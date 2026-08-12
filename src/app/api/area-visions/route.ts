import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const VALID_AREAS = [
  "saude", "carreira", "financas", "relacionamentos",
  "desenvolvimento", "familia", "lazer", "espiritualidade",
];

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("area_visions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("area", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { area, statement } = body;

  if (!area || typeof area !== "string" || !VALID_AREAS.includes(area)) {
    return NextResponse.json(
      { error: `Área inválida. Use uma das 8 áreas: ${VALID_AREAS.join(", ")}` },
      { status: 400 }
    );
  }

  if (statement == null || typeof statement !== "string") {
    return NextResponse.json({ error: "statement é obrigatório (string)" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Upsert: try update first, insert if not exists
  const { data: existing } = await admin
    .from("area_visions")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("area", area)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("area_visions")
      .update({ statement, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();

    if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await admin
    .from("area_visions")
    .insert({
      user_id: session.user.id,
      area,
      statement,
    })
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
