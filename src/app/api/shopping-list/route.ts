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
    // Unchecked first, then by position, then by created_at
    const { data, error } = await admin
      .from("shopping_items")
      .select("*")
      .eq("user_id", user.id)
      .order("checked", { ascending: true })
      .order("position", { ascending: true })
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

    // Get next position (max position + 1) for the user
    const { data: maxRow } = await admin
      .from("shopping_items")
      .select("position")
      .eq("user_id", user.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = (maxRow?.position ?? -1) + 1;

    // Bulk insert: { items: [{ item_name, category? }] }
    if (body.items && Array.isArray(body.items)) {
      const rows = body.items.map((it: { item_name: string; category?: string }, i: number) => ({
        user_id: user.id,
        item_name: it.item_name,
        category: it.category || "geral",
        position: nextPosition + i,
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
        position: nextPosition,
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

// PATCH /api/shopping-list  —  partial update OR batch reorder
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

    // Batch reorder: { reorder: [{ id, position }] }
    if (body.reorder && Array.isArray(body.reorder)) {
      // Build a single UPDATE with CASE WHEN for each id
      // Use a raw update via upsert or individual updates
      // For simplicity and reliability, do individual updates in a transaction-like loop
      const results = [];
      for (const item of body.reorder) {
        if (!item.id) continue;
        const { data, error } = await admin
          .from("shopping_items")
          .update({ position: item.position })
          .eq("id", item.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) {
          console.error("Reorder error for", item.id, error);
          continue;
        }
        results.push(data);
      }
      return NextResponse.json({ success: true, count: results.length });
    }

    // Single item update
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.item_name !== undefined) updates.item_name = body.item_name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.checked !== undefined) updates.checked = body.checked;
    if (body.position !== undefined) updates.position = body.position;

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
