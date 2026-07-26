import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";

// ── Trigger detection ──────────────────────────────────────────────────────────

interface NudgeResult {
  id: string;
  message: string;
  priority: number; // 1 = highest
}

async function detectTriggers(userId: string, today: string, userName: string): Promise<NudgeResult | null> {
  const admin = getSupabaseAdmin();

  // Fetch recent data
  const [
    { data: recentCheckIns },
    { data: activeGoals },
    { data: todayTx },
    { data: weekPlan },
  ] = await Promise.all([
    admin.from("check_ins").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(10),
    admin.from("goals").select("*, goal_stages(*)").eq("user_id", userId).eq("status", "ativa").order("created_at", { ascending: true }),
    admin.from("financial_transactions").select("amount, type").eq("user_id", userId).gte("date", `${today.slice(0, 7)}-01`).lte("date", `${today.slice(0, 7)}-31`),
    admin.from("weekly_plans").select("main_focus").eq("user_id", userId).order("week_start", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const firstName = userName.split(" ")[0] || "";
  const checks = recentCheckIns || [];

  // ── STREAK IN RISK ──
  if (checks.length >= 3) {
    let streak = 0;
    const todayDate = new Date(today + "T12:00:00");
    for (let i = 0; i < checks.length; i++) {
      const checkDate = new Date(checks[i].date + "T12:00:00");
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      if (checkDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    const hasToday = checks[0]?.date === today;
    if (streak >= 5 && !hasToday) {
      return {
        id: "streak_risk",
        message: `${firstName}, você está há ${streak} dias seguidos fazendo check-in. Hoje ainda não fez. Não quebra essa corrente! 🥺 Vai, 2 minutinhos.`,
        priority: 1,
      };
    }
  }

  // ── SLEEP PATTERN ──
  if (checks.length >= 4) {
    const last4 = checks.slice(0, 4);
    const badSleepCount = last4.filter((c: any) => c.slept_well === false).length;
    if (badSleepCount >= 3) {
      return {
        id: "sleep_bad",
        message: `${firstName}, você dormiu mal nos últimos 3 dias. Isso afeta seu humor, energia e foco. Quer conversar sobre o que pode estar atrapalhando?`,
        priority: 2,
      };
    }
  }

  // ── MOOD DROP ──
  if (checks.length >= 3) {
    const last3 = checks.slice(0, 3);
    const moods = last3.filter((c: any) => c.mood_tags?.length > 0).map((c: any) => c.mood_tags[0]);
    const negativeMoods = moods.filter((m: string) =>
      ["ansiosa", "triste", "cansada", "sobrecarregada", "irritada"].includes(m)
    );
    if (negativeMoods.length >= 2 && moods.length >= 2) {
      return {
        id: "mood_drop",
        message: `${firstName}, seu humor caiu nos últimos dias. Não tem que enfrentar isso sozinho(a). Me conta o que está pesando?`,
        priority: 2,
      };
    }
  }

  // ── GOAL STAGNATION ──
  if (activeGoals && activeGoals.length > 0) {
    const now = new Date();
    for (const g of activeGoals) {
      const stages = (g.goal_stages as any[]) || [];
      const timestamps = [new Date(g.updated_at).getTime()];
      for (const s of stages) {
        timestamps.push(new Date(s.updated_at).getTime());
      }
      const lastActive = Math.max(...timestamps);
      const daysInactive = Math.floor((now.getTime() - lastActive) / 86_400_000);
      if (daysInactive >= 7) {
        return {
          id: "goal_stale",
          message: `${firstName}, sua meta "${g.title}" está parada há ${daysInactive} dias. Quer destravar? Posso te ajudar a pensar no primeiro passo.`,
          priority: 3,
        };
      }
    }
  }

  // ── SPENDING ALERT ──
  const totalSpent = (todayTx || []).filter((t: any) => t.type === "despesa").reduce((s: number, t: any) => s + (t.amount || 0), 0);
  if (totalSpent > 0) {
    return {
      id: "spending",
      message: `${firstName}, você já gastou R$ ${totalSpent.toFixed(2).replace(".", ",")} este mês. Quer revisar seu orçamento comigo?`,
      priority: 4,
    };
  }

  // ── NO CHECK-IN TODAY ──
  const hasTodayCheckIn = checks[0]?.date === today;
  if (!hasTodayCheckIn) {
    return {
      id: "checkin_miss",
      message: `${firstName}, ainda não fez seu check-in hoje. São só 2 minutos. Como você está?`,
      priority: 1,
    };
  }

  return null;
}

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const today = getLocalDate();

  try {
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("context")
      .eq("user_id", user.id)
      .single();

    const context = (prefs?.context ?? {}) as Record<string, unknown>;
    const userName = (user.user_metadata?.name as string) || "";
    const firstName = userName.split(" ")[0];

    // ── Cache check ──
    const cachedNudge = context.maya_nudge as { id: string; message: string; date: string; saved: boolean } | undefined;
    if (cachedNudge?.date === today && cachedNudge.message) {
      // If already saved to chat, return empty (don't repeat)
      if (cachedNudge.saved) {
        return NextResponse.json({ nudges: [] });
      }
      return NextResponse.json({
        nudges: [{ id: cachedNudge.id, message: cachedNudge.message }],
      });
    }

    // Get or create check-in count
    const { count } = await admin
      .from("check_ins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!count || count === 0) {
      const welcomeMsg = `Oi ${firstName || "você"}! 💜 Eu sou a Maya. Registre seu primeiro check-in e vamos começar essa jornada juntos.`;
      await cacheNudge(admin, user.id, context, "welcome", welcomeMsg, today);
      return NextResponse.json({ nudges: [{ id: "welcome", message: welcomeMsg }] });
    }

    // Detect triggers
    const nudge = await detectTriggers(user.id, today, userName);

    if (nudge) {
      // Cache the nudge for today
      await cacheNudge(admin, user.id, context, nudge.id, nudge.message, today);
      return NextResponse.json({ nudges: [nudge] });
    }

    return NextResponse.json({ nudges: [] });
  } catch (error) {
    console.error("GET /api/maya/nudge error:", error);
    return NextResponse.json({ nudges: [] });
  }
}

async function cacheNudge(admin: any, userId: string, context: Record<string, unknown>, id: string, message: string, date: string) {
  admin
    .from("user_preferences")
    .update({ context: { ...context, maya_nudge: { id, message, date, saved: false } } })
    .eq("user_id", userId)
    .then(() => {})
    .catch(() => {});
}

// ── POST — Mark nudge as saved to chat ─────────────────────────────────────────

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: prefs } = await admin
    .from("user_preferences")
    .select("context")
    .eq("user_id", user.id)
    .single();

  const context = (prefs?.context ?? {}) as Record<string, unknown>;
  const today = getLocalDate();
  const cachedNudge = context.maya_nudge as { id: string; message: string; date: string } | undefined;

  if (cachedNudge?.date === today && cachedNudge.message) {
    // Save to chat_messages
    await admin.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: cachedNudge.message,
    });

    // Mark as saved so it doesn't repeat
    await admin
      .from("user_preferences")
      .update({ context: { ...context, maya_nudge: { ...cachedNudge, saved: true } } })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
