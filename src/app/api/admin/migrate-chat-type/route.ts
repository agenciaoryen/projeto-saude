import { NextResponse } from "next/server";
import postgres from "postgres";

// One-time migration: add chat_type column to chat_messages
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });

  const sql = postgres(dbUrl, { max: 1 });
  try {
    await sql.unsafe("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_type TEXT");
    await sql.unsafe("UPDATE chat_messages SET chat_type = 'maya' WHERE chat_type IS NULL");
    await sql.end();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    await sql.end();
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
