import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getLocalDate } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const userId = session.user.id;
  const today = getLocalDate();

  // Get user context: recent mood, last mood tags
  const { data: recentCI } = await admin.from("check_ins").select("mood_tags, feeling").eq("user_id", userId).order("date", { ascending: false }).limit(3);
  const recentMoods = (recentCI || []).flatMap(c => c.mood_tags || []);
  const lastFeeling = recentCI?.[0]?.feeling || "";

  // Get user preferences for their name
  const { data: prefs } = await admin.from("user_preferences").select("context").eq("user_id", userId).maybeSingle();
  const userName = ((prefs?.context as any)?.name as string) || session.user.user_metadata?.name || "";

  // Determine what kind of posts to look for
  const hasNegativeMood = recentMoods.some((m: string) =>
    ["triste", "ansiosa", "cansada", "sobrecarregada", "irritada", "desanimada", "estressada"].includes(m)
  );

  // Fetch recent posts prioritizing the right category
  const categories = hasNegativeMood
    ? ["vitoria", "gratidao", "dica"]  // uplifting content
    : ["reflexao", "dica", "vitoria"]; // balanced

  const { data: posts } = await admin.from("community_posts").select(`
    *,
    community_likes(count)
  `).in("category", categories).order("created_at", { ascending: false }).limit(30);

  // Pick 2-3 posts that feel relevant
  const candidates = (posts || [])
    .filter((p: any) => p.user_id !== userId) // don't show own posts
    .sort(() => Math.random() - 0.5) // shuffle
    .slice(0, 3)
    .map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      display_emoji: p.display_emoji,
      category: p.category,
      content: p.content?.slice(0, 200) || "",
      like_count: p.community_likes?.[0]?.count ?? 0,
    }));

  // Build Maya's message
  const greeting = userName ? `${userName}` : "";
  const moodContext = hasNegativeMood
    ? "Vi que seu humor não está dos melhores. Separei algumas coisas que a comunidade compartilhou e que talvez te façam bem."
    : "Separei algumas inspirações da comunidade que combinam com seu momento.";

  const fallbackMessage = candidates.length === 0
    ? (userName
      ? `${userName}, ainda não encontrei nada que combine com seu momento. Mas a comunidade está crescendo — que tal ser o primeiro a compartilhar algo hoje?`
      : "Ainda não encontrei nada que combine com seu momento. Mas a comunidade está crescendo — que tal ser o primeiro a compartilhar algo hoje?")
    : undefined;

  return NextResponse.json({
    message: fallbackMessage || (greeting ? `${greeting}, ${moodContext.charAt(0).toLowerCase() + moodContext.slice(1)}` : moodContext),
    posts: candidates,
  });
}
