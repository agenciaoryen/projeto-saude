import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Verify cycle ownership
  const { data: cycle } = await admin
    .from("quarterly_cycles")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!cycle) return NextResponse.json({ error: "Ciclo não encontrado" }, { status: 404 });

  const body = await req.json();
  const { overall_score, biggest_win, main_learning, what_to_carry_forward } = body;

  if (overall_score == null || !biggest_win?.trim() || !main_learning?.trim()) {
    return NextResponse.json(
      { error: "Campos obrigatórios: overall_score, biggest_win, main_learning" },
      { status: 400 }
    );
  }

  // Upsert: delete existing review for this cycle, then insert
  await admin.from("quarterly_reviews").delete().eq("cycle_id", id);

  const { data: review, error } = await admin
    .from("quarterly_reviews")
    .insert({
      cycle_id: id,
      overall_score,
      biggest_win,
      main_learning,
      what_to_carry_forward: what_to_carry_forward || "",
    })
    .select()
    .single();

  if (error || !review) return NextResponse.json({ error: error?.message }, { status: 500 });

  return NextResponse.json(review, { status: 201 });
}
