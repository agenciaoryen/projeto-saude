import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET — load user's chat messages
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before"); // cursor: load messages older than this

  const admin = getSupabaseAdmin();
  let query = admin
    .from("chat_messages")
    .select("id, role, content, image_urls, created_at")
    .eq("user_id", user.id)
    .or("chat_type.is.null,chat_type.eq.maya")
    .order("created_at", { ascending: false })
    .limit(200);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const response = NextResponse.json(data || []);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

// POST — save a batch of new messages
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const messages = body.messages as Array<{ role: string; content: string; image_urls?: string[] }> | undefined;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array obrigatório" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const rows = messages.map((m) => ({
    user_id: user.id,
    role: m.role,
    content: m.content,
    image_urls: m.image_urls || [],
    chat_type: "maya",
  }));

  const { error } = await admin.from("chat_messages").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate home-message cache so next dashboard load reflects chat conversation
  invalidateHomeMessageCache(admin, user.id);

  return NextResponse.json({ saved: rows.length });
}

// ── Cache invalidation ───────────────────────────────────────────────────

function invalidateHomeMessageCache(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
) {
  admin
    .from("user_preferences")
    .select("context")
    .eq("user_id", userId)
    .single()
    .then(({ data }) => {
      if (!data) return;
      const ctx = { ...(data.context as Record<string, unknown>) };
      delete ctx.maya_home_message;
      return admin.from("user_preferences").update({ context: ctx }).eq("user_id", userId);
    })
    .catch(() => {});
}
