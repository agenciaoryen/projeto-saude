import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

function connect() {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith("sua_")) {
    throw new Error("DATABASE_URL não configurada");
  }
  const client = postgres(url, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}

export const db = {
  select: (...args: Parameters<ReturnType<typeof connect>["select"]>) =>
    connect().select(...args),
  insert: (...args: Parameters<ReturnType<typeof connect>["insert"]>) =>
    connect().insert(...args),
  update: (...args: Parameters<ReturnType<typeof connect>["update"]>) =>
    connect().update(...args),
  delete: (...args: Parameters<ReturnType<typeof connect>["delete"]>) =>
    connect().delete(...args),
  execute: (...args: Parameters<ReturnType<typeof connect>["execute"]>) =>
    connect().execute(...args),
} as unknown as ReturnType<typeof connect>;
