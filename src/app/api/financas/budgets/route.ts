import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("financial_budgets")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("month", month);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { category, monthly_limit, month } = body;

  if (!category || !monthly_limit || !month) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("financial_budgets")
    .upsert({
      user_id: session.user.id,
      category,
      monthly_limit: Number(monthly_limit),
      month,
    }, { onConflict: "user_id,category,month" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { category, month } = await req.json();
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("financial_budgets")
    .delete()
    .eq("user_id", session.user.id)
    .eq("category", category)
    .eq("month", month);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
