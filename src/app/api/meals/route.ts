import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const id = searchParams.get("id");

    const admin = getSupabaseAdmin();

    if (id) {
      const { data, error } = await admin
        .from("meals")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    if (date) {
      // Refições de uma data específica (filtra pelo dia na timestamp)
      const startOfDay = `${date}T00:00:00-03:00`;
      const endOfDay = `${date}T23:59:59-03:00`;

      const { data, error } = await admin
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_hora", startOfDay)
        .lte("data_hora", endOfDay)
        .order("data_hora", { ascending: false });

      if (error) throw error;
      return NextResponse.json(data || []);
    }

    const { data, error } = await admin
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .order("data_hora", { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/meals error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar refeições", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const admin = getSupabaseAdmin();

    const isUpdate = !!body.id;

    const row: Record<string, unknown> = {
      user_id: user.id,
      tipo_refeicao: body.tipo_refeicao || "almoco",
      foto_path: body.foto_path ?? null,
      itens: body.itens ?? [],
      macros: body.macros ?? null,
      classificacao: body.classificacao ?? null,
      observacao: body.observacao ?? "",
      texto_livre: body.texto_livre ?? "",
      status_analise: body.status_analise ?? "pendente",
    };

    // Only set data_hora on insert or when explicitly provided (preserve original on update)
    if (!isUpdate || body.data_hora) {
      row.data_hora = body.data_hora || new Date().toISOString();
    }

    if (isUpdate) {
      const { data: updated, error } = await admin
        .from("meals")
        .update(row)
        .eq("id", body.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updated);
    }

    const { data: created, error } = await admin
      .from("meals")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/meals error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar refeição", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("meals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/meals error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar refeição", detail: String(error) },
      { status: 500 }
    );
  }
}
