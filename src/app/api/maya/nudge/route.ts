import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";

// ── Trigger detection ──────────────────────────────────────────────────────────

interface NudgeResult {
  id: string;
  message: string;
  priority: number; // 1 = highest
  action?: { label: string; href: string };
}

function saludo(firstName: string): string {
  return `Oii, ${firstName || ""}`.trim().replace(/\s+$/, "") + "!";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function detectAllTriggers(userId: string, today: string, firstName: string, gender: string): Promise<NudgeResult[]> {
  const admin = getSupabaseAdmin();

  const soloSolo = gender === "feminino" ? "sozinha" : "sozinho";
  const oo = gender === "feminino" ? "a" : "o";

  // Fetch recent data
  const [
    { data: recentCheckIns },
    { data: activeGoals },
    { data: todayTx },
    { data: lastDiary },
  ] = await Promise.all([
    admin.from("check_ins").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(10),
    admin.from("goals").select("*, goal_stages(*)").eq("user_id", userId).eq("status", "ativa").order("created_at", { ascending: true }),
    admin.from("financial_transactions").select("amount, type").eq("user_id", userId).gte("date", `${today.slice(0, 7)}-01`).lte("date", `${today.slice(0, 7)}-31`),
    admin.from("diary_entries").select("date").eq("user_id", userId).order("date", { ascending: false }).limit(1),
  ]);

  const checks = recentCheckIns || [];

  const greet = saludo(firstName);
  const hasTodayCheckIn = checks.length > 0 && checks[0]?.date === today;
  const results: NudgeResult[] = [];

  // ── STREAK IN RISK ──
  if (checks.length >= 3 && !hasTodayCheckIn) {
    let streak = 0;
    const todayDate = new Date(today + "T12:00:00");
    for (let i = 0; i < checks.length; i++) {
      const checkDate = new Date(checks[i].date + "T12:00:00");
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      if (checkDate.getTime() === expected.getTime()) streak++;
      else break;
    }
    if (streak >= 5) {
      results.push({
        id: "streak_risk",
        message: pick([
          `${greet} vi que você está há ${streak} dias sem falhar no check-in. Hoje ainda não rolou... tá tudo bem?`,
          `${greet} ${streak} dias seguidos! 🥺 Vi que hoje ainda não fez seu check-in. Aconteceu alguma coisa?`,
          `${greet} sua corrente de ${streak} dias tá correndo perigo! Tá tudo bem? Não precisa escrever muito, só uns toques.`,
        ]),
        priority: 1,
        action: { label: "Fazer check-in agora", href: "/check-in" },
      });
    }
  }

  // ── SLEEP PATTERN ──
  if (checks.length >= 4) {
    const last4 = checks.slice(0, 4);
    const badSleepCount = last4.filter((c: any) => c.slept_well === false).length;
    if (badSleepCount >= 3) {
      results.push({
        id: "sleep_bad",
        message: pick([
          `${greet} vi que você dormiu mal nos últimos 3 dias. Isso mexe com tudo: humor, energia, foco. Quer conversar sobre o que pode estar atrapalhando?`,
          `${greet} notei que seu sono não tá legal faz 3 dias. Às vezes a gente nem percebe o que tá roubando nosso descanso. Bora tentar entender juntos?`,
          `${greet} olhei aqui e vi que você não dormiu bem nos últimos dias. Seu corpo tá pedindo atenção. O que será que tá roubando seu sono?`,
        ]),
        priority: 2,
        action: { label: "Conversar com Maya", href: "/insights" },
      });
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
      results.push({
        id: "mood_drop",
        message: pick([
          `${greet} vi que seu humor caiu nos últimos dias. Não precisa enfrentar isso ${soloSolo}. Me conta o que tá pesando?`,
          `${greet} tá tudo bem não estar bem. Vi que você não está nos seus melhores dias. Quer desabafar um pouco?`,
          `${greet} senti que você tá mais pra baixo esses dias. Se quiser conversar, tô aqui. Sem pressa, sem cobrança.`,
        ]),
        priority: 2,
        action: { label: "Conversar com Maya", href: "/insights" },
      });
    }
  }

  // ── DIARY ABANDONED ──
  if (lastDiary && lastDiary.length > 0) {
    const lastDiaryDate = new Date(lastDiary[0].date + "T12:00:00");
    const now = new Date(today + "T12:00:00");
    const daysSince = Math.floor((now.getTime() - lastDiaryDate.getTime()) / 86_400_000);
    if (daysSince >= 5) {
      results.push({
        id: "diary_abandoned",
        message: pick([
          `${greet} faz ${daysSince} dias que você não escreve no diário. Escrever ajuda a clarear a mente... quando quiser, tô aqui pra ler.`,
          `${greet} vi que seu diário tá paradinho faz ${daysSince} dias. Não precisa escrever um texto, uma frase já vale. Tá afim?`,
          `${greet} lembrei do seu diário... já faz ${daysSince} dias. Às vezes a gente só precisa despejar os pensamentos em algum lugar.`,
        ]),
        priority: 3,
        action: { label: "Escrever no diário", href: "/diario/novo" },
      });
    }
  }

  // ── GOAL STAGNATION ──
  if (activeGoals && activeGoals.length > 0) {
    const nowDate = new Date();
    for (const g of activeGoals) {
      const stages = (g.goal_stages as any[]) || [];
      const timestamps = [new Date(g.updated_at).getTime()];
      for (const s of stages) timestamps.push(new Date(s.updated_at).getTime());
      const lastActive = Math.max(...timestamps);
      const daysInactive = Math.floor((nowDate.getTime() - lastActive) / 86_400_000);
      if (daysInactive >= 7) {
        // Humanize goal title: remove numbers, simplify
        const rawTitle: string = g.title || "";
        const summary = rawTitle
          .replace(/\d+\s*(kg|kilos|quilos|meses|dias|semanas)/gi, "")
          .replace(/em\s+\d+\s+\w+/gi, "")
          .replace(/[\(\)]/g, "")
          .trim()
          .slice(0, 40) || "melhorar";
        results.push({
          id: "goal_stale",
          message: pick([
            `${greet} vi que sua meta de ${summary} tá paradinha há ${daysInactive} dias. Quer destravar? Posso te ajudar a pensar no primeiro passo.`,
            `${greet} estava olhando aqui e vi que você não mexeu na sua meta de ${summary} faz um tempinho. Tá difícil? Me conta.`,
            `${greet} sabe aquela meta de ${summary}? Tá parada há ${daysInactive} dias. Mas ei, isso é normal. Bora dar um passo pequeno hoje?`,
          ]),
          priority: 3,
        action: { label: "Ver minhas metas", href: "/agenda" },
        });
      }
    }
  }

  // ── SPENDING ALERT ──
  const totalSpent = (todayTx || []).filter((t: any) => t.type === "despesa").reduce((s: number, t: any) => s + (t.amount || 0), 0);
  if (totalSpent > 80) {
    results.push({
      id: "spending",
      message: pick([
        `${greet} vi que já gastou R$ ${totalSpent.toFixed(0).replace(".", ",")} este mês. Tá conseguindo se organizar? Posso te ajudar a revisar.`,
        `${greet} dei uma olhada nos seus gastos e bateu R$ ${totalSpent.toFixed(0).replace(".", ",")} em compras. Quer dar uma revisada comigo?`,
        `${greet} notei que seus gastos tão em R$ ${totalSpent.toFixed(0).replace(".", ",")}. Tudo sob controle ou quer uma ajudinha pra revisar?`,
      ]),
      priority: 4,
    action: { label: "Ver finanças", href: "/financas" },
    });
  }

  // ── NO CHECK-IN TODAY ──
  if (!hasTodayCheckIn) {
    results.push({
      id: "checkin_miss",
      message: pick([
        `${greet} como você está hoje? Ainda não fez seu check-in. São 2 minutinhos e me ajuda a te conhecer melhor.`,
        `${greet} passando aqui pra saber de você. Não fez o check-in ainda... como tá seu dia?`,
        `${greet} tava por aqui e vi que você ainda não passou no check-in hoje. Como você está?`,
      ]),
      priority: 1,
    action: { label: "Fazer check-in agora", href: "/check-in" },
    });
  }

  return results;
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
    const gender = (context.gender as string) || "nao_dizer";

    // ── Cache check ──
    const cachedNudge = context.maya_nudge as { id: string; message: string; date: string; saved: boolean; releaseHour: number } | undefined;
    if (cachedNudge?.date === today && cachedNudge.message) {
      if (cachedNudge.saved) return NextResponse.json({ nudges: [] });
      // Respect timed release
      const now = new Date();
      const brH = now.getHours();
      if (brH < cachedNudge.releaseHour) return NextResponse.json({ nudges: [] });
      return NextResponse.json({ nudges: [{ id: cachedNudge.id, message: cachedNudge.message, action: (cachedNudge as any).action }] });
    }

    // ── Don't nudge if user already chatted today ──
    const { count: todayMsgCount } = await admin
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today + "T00:00:00Z")
      .lte("created_at", today + "T23:59:59Z");
    if (todayMsgCount && todayMsgCount > 0) {
      return NextResponse.json({ nudges: [] });
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

    // Detect ALL triggers, pick highest priority
    const nudges = await detectAllTriggers(user.id, today, firstName, gender);
    const bestNudge = nudges.sort((a, b) => a.priority - b.priority)[0];

    if (bestNudge) {
      // Cache for today
      await cacheNudge(admin, user.id, context, bestNudge.id, bestNudge.message, today, bestNudge.action);

      // Respect random release hour — don't show if too early
      const now = new Date();
      const brH = now.getHours();
      const savedNudge = (context.maya_nudge as any);
      if (savedNudge?.releaseHour && brH < savedNudge.releaseHour) {
        return NextResponse.json({ nudges: [] });
      }

      return NextResponse.json({ nudges: [{ id: bestNudge.id, message: bestNudge.message, action: bestNudge.action }] });
    }

    return NextResponse.json({ nudges: [] });
  } catch (error) {
    console.error("GET /api/maya/nudge error:", error);
    return NextResponse.json({ nudges: [] });
  }
}

async function cacheNudge(admin: any, userId: string, context: Record<string, unknown>, id: string, message: string, date: string, action?: { label: string; href: string }) {
  const releaseHour = 9 + Math.floor(Math.random() * 9);
  admin
    .from("user_preferences")
    .update({ context: { ...context, maya_nudge: { id, message, date, saved: false, releaseHour, action } } })
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
