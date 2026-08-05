import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("user_categories")
    .update(body)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();

  // Find the category to get its type (for determining the ID prefix used in transactions)
  const { data: cat } = await admin
    .from("user_categories")
    .select("id, type")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!cat) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  // Reassign any transactions using this category to "outros"
  const legacyId = `user_${cat.id}`;
  await admin
    .from("financial_transactions")
    .update({ category: "outros", subcategory: null })
    .eq("user_id", session.user.id)
    .eq("category", legacyId);

  // Delete the category
  const { error } = await admin
    .from("user_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
