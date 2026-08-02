import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin — stats + reports (admin only)
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Check admin flag
  const admin = getSupabaseAdmin();
  const { data: role } = await admin.from("user_roles").select("is_admin").eq("user_id", session.user.id).maybeSingle();
  if (!role?.is_admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "stats";

  if (type === "reports") {
    const { data: reports } = await admin.from("community_reports").select(`
      id, reason, created_at,
      post_id, reported_by,
      community_posts!inner(id, content, display_name, created_at)
    `).order("created_at", { ascending: false }).limit(50);
    return NextResponse.json(reports || []);
  }

  // Stats — use count via separate queries
  const { count: totalUsers } = await admin.from("profiles").select("*", { count: "exact", head: true }).then(r => ({ count: r.count ?? 0 }));
  const { count: totalPosts } = await admin.from("community_posts").select("*", { count: "exact", head: true }).then(r => ({ count: r.count ?? 0 }));
  const { count: totalComments } = await admin.from("community_comments").select("*", { count: "exact", head: true }).then(r => ({ count: r.count ?? 0 }));
  const { count: totalCheckins } = await admin.from("check_ins").select("*", { count: "exact", head: true }).then(r => ({ count: r.count ?? 0 }));
  const { count: totalDiary } = await admin.from("diary_entries").select("*", { count: "exact", head: true }).then(r => ({ count: r.count ?? 0 }));
  // Mapbox usage this month
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const { count: mapboxLoads } = await admin.from("mapbox_usage").select("*", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()).then(r => ({ count: r.count ?? 0 }));

  const { count: activeUsers7d } = await admin.from("check_ins")
    .select("*", { count: "exact", head: true })
    .gte("date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
    .then(r => ({ count: r.count ?? 0 }));

  return NextResponse.json({
    users: totalUsers || 0,
    active7d: activeUsers7d || 0,
    posts: totalPosts || 0,
    comments: totalComments || 0,
    checkins: totalCheckins || 0,
    diary: totalDiary || 0,
    mapboxLoads: mapboxLoads || 0,
  });
}

// POST /api/admin — set admin/tester flag (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: prefs } = await admin.from("user_preferences").select("context").eq("user_id", session.user.id).maybeSingle();
  const ctx = (prefs?.context || {}) as Record<string, unknown>;
  if (!ctx.is_admin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { userId, flag, value } = await req.json();
  if (!userId || !flag) return NextResponse.json({ error: "userId e flag obrigatórios" }, { status: 400 });

  const { data: targetPrefs } = await admin.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  const targetCtx = (targetPrefs?.context || {}) as Record<string, unknown>;
  targetCtx[flag] = value;

  await admin.from("user_preferences").upsert({
    user_id: userId,
    context: targetCtx,
    enabled_questions: targetPrefs?.enabled_questions || [],
    onboarding_completed: targetPrefs?.onboarding_completed ?? true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  return NextResponse.json({ ok: true });
}
