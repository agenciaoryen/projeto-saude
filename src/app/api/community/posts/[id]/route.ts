import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/community/posts/[id] — delete own post
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("community_posts").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/community/posts/[id] — toggle like
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: existing } = await admin.from("community_likes").select("id").eq("post_id", id).eq("user_id", session.user.id).maybeSingle();

  if (existing) {
    await admin.from("community_likes").delete().eq("id", existing.id);
    return NextResponse.json({ liked: false });
  } else {
    await admin.from("community_likes").insert({ post_id: id, user_id: session.user.id });
    return NextResponse.json({ liked: true });
  }
}
