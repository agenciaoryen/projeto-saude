import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/leitura/biblioteca — listar livros do usuário
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // opcional: filtrar por status
    const admin = getSupabaseAdmin();

    let query = admin
      .from("user_books")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/leitura/biblioteca error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar biblioteca", detail: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/leitura/biblioteca — salvar livro
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

    if (!body.book_id || !body.title) {
      return NextResponse.json({ error: "book_id e title obrigatórios" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("user_books")
      .upsert({
        user_id: user.id,
        book_id: body.book_id,
        title: body.title,
        author: body.author || null,
        cover_url: body.cover_url || null,
        status: body.status || "want_to_read",
        progress: body.progress || 0,
        started_at: body.status === "reading" ? new Date().toISOString() : null,
      }, { onConflict: "user_id,book_id" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/leitura/biblioteca error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar livro", detail: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/leitura/biblioteca — atualizar progresso ou status
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const admin = getSupabaseAdmin();

    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "reading" && !body.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (body.status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (body.progress !== undefined) updates.progress = body.progress;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("user_books")
      .update(updates)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("PATCH /api/leitura/biblioteca error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar livro", detail: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/leitura/biblioteca?id=UUID
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
      .from("user_books")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/leitura/biblioteca error:", error);
    return NextResponse.json(
      { error: "Erro ao remover livro", detail: String(error) },
      { status: 500 }
    );
  }
}
