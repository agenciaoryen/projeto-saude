import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/shopping-list
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    // Unchecked first, then by created_at
    const { data, error } = await admin
      .from("shopping_items")
      .select("*")
      .eq("user_id", user.id)
      .order("checked", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("GET /api/shopping-list error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lista", detail: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/shopping-list — single item or bulk array
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

    // Bulk insert: { items: [{ item_name, category? }] }
    if (body.items && Array.isArray(body.items)) {
      const rows = body.items.map((it: { item_name: string; category?: string }) => ({
        user_id: user.id,
        item_name: it.item_name,
        category: it.category || "geral",
      }));

      const { data, error } = await admin
        .from("shopping_items")
        .insert(rows)
        .select();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }

    // Single insert: { item_name, category? }
    if (!body.item_name || !body.item_name.trim()) {
      return NextResponse.json({ error: "Nome do item obrigatório" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("shopping_items")
      .insert({
        user_id: user.id,
        item_name: body.item_name.trim(),
        category: body.category || "geral",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST /api/shopping-list error:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar item", detail: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/shopping-list
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const updates: Record<string, unknown> = {};

    if (body.item_name !== undefined) updates.item_name = body.item_name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.checked !== undefined) updates.checked = body.checked;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("shopping_items")
      .update(updates)
      .eq("id", body.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("PATCH /api/shopping-list error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar item", detail: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/shopping-list?id=UUID  OR  ?clearChecked=true
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const admin = getSupabaseAdmin();

    // Clear all checked items
    if (searchParams.get("clearChecked") === "true") {
      const { error } = await admin
        .from("shopping_items")
        .delete()
        .eq("user_id", user.id)
        .eq("checked", true);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Delete single item
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const { error } = await admin
      .from("shopping_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/shopping-list error:", error);
    return NextResponse.json(
      { error: "Erro ao remover item", detail: String(error) },
      { status: 500 }
    );
  }
}
