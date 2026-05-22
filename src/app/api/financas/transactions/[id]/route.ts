import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { type, amount, category, description, date } = body;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("financial_transactions")
    .update({
      ...(type !== undefined && { type }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description: description || null }),
      ...(date !== undefined && { date }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("financial_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
