import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────

interface PlanInsight {
  id: string;
  priority: 1 | 2 | 3; // 1=urgent, 2=attention, 3=suggestion
  message: string;
  action?: { label: string; href: string };
}

interface PlanMetrics {
  strongest: string;
  weakest: string;
  balance: number;    // 0–100, higher = more balanced
  variation: number;  // % change vs last week
}

interface InsightResponse {
  insights: PlanInsight[];
  metrics: PlanMetrics;
}

// ── Area config ────────────────────────────────────────────────────────

const AREAS = [
  { key: "saude",           label: "Saúde",           color: "#7C5CFF" },
  { key: "carreira",        label: "Carreira",        color: "#5EEAD4" },
  { key: "financas",        label: "Finanças",        color: "#F59E0B" },
  { key: "relacionamentos", label: "Relacionamentos", color: "#EC4899" },
  { key: "familia",         label: "Família",         color: "#22D18B" },
  { key: "desenvolvimento", label: "Mente",           color: "#A78BFA" },
  { key: "lazer",           label: "Lazer",           color: "#38BDF8" },
  { key: "espiritualidade", label: "Espiritualidade", color: "#F97316" },
  { key: "outros",          label: "Outros",          color: "#9CA3AF" },
];

function areaLabel(key: string): string {
  return AREAS.find(a => a.key === key)?.label ?? key;
}

function getWeekMonday(date: string): string {
  const d = new Date(date + "T12:00:00");
  const dow = d.getDay();
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + daysToMonday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Helpers ────────────────────────────────────────────────────────────

interface WeekData {
  weekStart: string;
  tasks: any[];
  doneByArea: Record<string, number>;
  totalByArea: Record<string, number>;
  totalDone: number;
  totalTasks: number;
}

function computeAreaStats(tasks: any[]): { doneByArea: Record<string, number>; totalByArea: Record<string, number>; totalDone: number; totalTasks: number } {
  const doneByArea: Record<string, number> = {};
  const totalByArea: Record<string, number> = {};
  let totalDone = 0;
  for (const t of tasks) {
    const area = t.area || "outros";
    totalByArea[area] = (totalByArea[area] || 0) + 1;
    if (t.status === "concluida") {
      doneByArea[area] = (doneByArea[area] || 0) + 1;
      totalDone++;
    }
  }
  return { doneByArea, totalByArea, totalDone, totalTasks: tasks.length };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Insight generators ─────────────────────────────────────────────────

function generateInsights(
  current: WeekData,
  history: WeekData[],
  activeGoals: any[],
  recentSleep: any[],
  recentMoods: string[],
  firstName: string,
): PlanInsight[] {
  const results: PlanInsight[] = [];
  const name = firstName || "";

  // ── 1. OVERLOAD ──
  const areasWithTasks = Object.keys(current.totalByArea).filter(k => current.totalByArea[k] > 0);
  const historicalAreaAvg = history.length > 0
    ? history.reduce((sum, w) => sum + Object.keys(w.totalByArea).filter(k => w.totalByArea[k] > 0).length, 0) / history.length
    : 3;

  if (areasWithTasks.length > historicalAreaAvg + 1 && areasWithTasks.length >= 5) {
    // Calculate completion rate for weeks with ≤3 areas
    const narrowWeeks = history.filter(w => Object.keys(w.totalByArea).filter(k => w.totalByArea[k] > 0).length <= 3);
    const wideWeeks = history.filter(w => Object.keys(w.totalByArea).filter(k => w.totalByArea[k] > 0).length >= 5);
    const narrowRate = narrowWeeks.length > 0
      ? Math.round(narrowWeeks.reduce((s, w) => s + (w.totalTasks > 0 ? w.totalDone / w.totalTasks : 0), 0) / narrowWeeks.length * 100)
      : 70;
    const wideRate = wideWeeks.length > 0
      ? Math.round(wideWeeks.reduce((s, w) => s + (w.totalTasks > 0 ? w.totalDone / w.totalTasks : 0), 0) / wideWeeks.length * 100)
      : 40;
    const diff = narrowRate - wideRate;

    if (diff >= 15) {
      results.push({
        id: "overload",
        priority: 1,
        message: `Você está tentando priorizar ${areasWithTasks.length} áreas ao mesmo tempo. Nas semanas em que focou em até 3 áreas, sua execução subiu ${diff}%.`,
        action: { label: "Ajustar foco", href: "/agenda?tab=semana" },
      });
    }
  }

  // ── 2. ABANDONED AREA ──
  const historicalAreas = new Set<string>();
  for (const w of history) {
    for (const k of Object.keys(w.totalByArea)) {
      if (w.totalByArea[k] > 0) historicalAreas.add(k);
    }
  }
  const abandoned = [...historicalAreas].filter(a => !current.totalByArea[a] && a !== "outros");
  if (abandoned.length > 0) {
    results.push({
      id: "abandoned",
      priority: 2,
      message: `${areaLabel(abandoned[0])} ${abandoned.length > 1 ? `e ${areaLabel(abandoned[1])} ` : ""}${abandoned.length > 1 ? "ficaram" : "ficou"} de fora esta semana. Isso é intencional ou um descuido?`,
      action: { label: "Adicionar tarefa", href: "/agenda?tab=semana" },
    });
  }

  // ── 3. ORPHAN GOAL ──
  if (activeGoals.length > 0) {
    const linkedGoalIds = new Set(current.tasks.filter((t: any) => t.linked_goal_id).map((t: any) => t.linked_goal_id));
    const orphanGoals = activeGoals.filter((g: any) => !linkedGoalIds.has(g.id));
    if (orphanGoals.length > 0) {
      const g = orphanGoals[0];
      results.push({
        id: "orphan_goal",
        priority: 2,
        message: `Sua meta "${(g.title || "").slice(0, 40)}" não tem nenhuma ação esta semana. Quer agendar algo?`,
        action: { label: "Ver metas", href: "/agenda?tab=metas" },
      });
    }
  }

  // ── 4. ENERGY IMBALANCE ──
  if (current.totalTasks >= 5) {
    const areaEntries = Object.entries(current.totalByArea)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
    const total = areaEntries.reduce((s, [, v]) => s + v, 0);
    const top = areaEntries[0];
    if (top && total > 0 && top[1] / total > 0.4) {
      results.push({
        id: "imbalance",
        priority: 1,
        message: `${areaLabel(top[0])} está consumindo ${Math.round(top[1] / total * 100)}% da sua semana. Isso é intencional? Às vezes focar demais numa área deixa as outras murcharem.`,
        action: { label: "Reequilibrar", href: "/agenda?tab=semana" },
      });
    }
  }

  // ── 5. POSITIVE TREND ──
  for (const area of Object.keys(current.totalByArea)) {
    if (!current.totalByArea[area] || area === "outros") continue;
    const pct = current.totalByArea[area] > 0 ? (current.doneByArea[area] || 0) / current.totalByArea[area] : 0;
    const historicalDone = history.filter(w => w.totalByArea[area] > 0);
    const allFull = historicalDone.length >= 2 && historicalDone.every(w => (w.totalByArea[area] || 0) > 0 && (w.doneByArea[area] || 0) === (w.totalByArea[area] || 0));
    if (allFull && pct >= 0.8) {
      results.push({
        id: "streak",
        priority: 3,
        message: `👏 ${areaLabel(area)} está com ${historicalDone.length + 1} semanas seguidas de execução impecável. Isso é disciplina de verdade!`,
      });
      break;
    }
  }

  // ── 6. NEGATIVE TREND ──
  for (const area of Object.keys(current.totalByArea)) {
    if (!current.totalByArea[area] || area === "outros") continue;
    const consecutiveLow = history.filter(w => w.totalByArea[area] > 0 && (w.doneByArea[area] || 0) === 0);
    if (consecutiveLow.length >= 2 && (current.doneByArea[area] || 0) === 0) {
      results.push({
        id: "decline",
        priority: 2,
        message: `${areaLabel(area)} está ${consecutiveLow.length + 1} semanas sendo planejada mas não executada. Talvez o plano esteja ambicioso demais? Que tal começar com uma tarefa bem pequena?`,
        action: { label: "Ajustar tarefas", href: "/agenda?tab=semana" },
      });
      break;
    }
  }

  // ── 7. BURNOUT RISK ──
  const badSleep = (recentSleep || []).filter((s: any) => s.quality != null && s.quality <= 2).length;
  const growthTasks = current.tasks.filter((t: any) => t.task_type === "crescimento" && t.status !== "concluida").length;
  if (badSleep >= 2 && growthTasks >= 3) {
    results.push({
      id: "burnout_risk",
      priority: 1,
      message: `Seu sono está ruim há ${badSleep} noites e você tem ${growthTasks} tarefas de crescimento. Cuidado com burnout. Esta pode ser uma semana para manutenção, não expansão.`,
      action: { label: "Conversar com Maya", href: "/insights" },
    });
  }

  return results;
}

// ── Metrics calculator ──────────────────────────────────────────────────

function calculateMetrics(current: WeekData, history: WeekData[]): PlanMetrics {
  const areaEntries = Object.entries(current.totalByArea).filter(([, v]) => v > 0);
  const total = areaEntries.reduce((s, [, v]) => s + v, 0);

  // Strongest & weakest by completion %
  let strongest = "—";
  let weakest = "—";
  let bestPct = -1;
  let worstPct = Infinity;
  for (const [key, tot] of Object.entries(current.totalByArea)) {
    if (key === "outros" || tot === 0) continue;
    const pct = (current.doneByArea[key] || 0) / tot;
    if (pct > bestPct) { bestPct = pct; strongest = areaLabel(key); }
    if (pct < worstPct) { worstPct = pct; weakest = areaLabel(key); }
  }

  // Balance: 100 = equal distribution, 0 = all in one area
  const areaCount = areaEntries.length;
  let balance = 50;
  if (areaCount > 0 && total > 0) {
    const ideal = 1 / areaCount;
    const deviations = areaEntries.map(([, v]) => Math.abs(v / total - ideal));
    const avgDeviation = deviations.reduce((s, d) => s + d, 0) / areaCount;
    balance = Math.round(Math.max(0, 100 - avgDeviation * 200));
  }

  // Variation vs last week
  let variation = 0;
  if (history.length > 0 && current.totalTasks > 0) {
    const lastWeek = history[0];
    if (lastWeek.totalTasks > 0) {
      variation = Math.round((current.totalTasks - lastWeek.totalTasks) / lastWeek.totalTasks * 100);
    }
  }

  return { strongest, weakest, balance, variation };
}

// ── GET ─────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const today = getLocalDate();
  const url = new URL(req.url);
  const weekParam = url.searchParams.get("week");
  const currentWeekStart = weekParam || getWeekMonday(today);

  try {
    // User profile
    const { data: prefs } = await admin.from("user_preferences").select("context").eq("user_id", user.id).single();
    const context = (prefs?.context ?? {}) as Record<string, unknown>;
    const userName = (user.user_metadata?.name as string) || "";
    const firstName = userName.split(" ")[0];

    // Fetch 5 weeks of plans (current + 4 historical)
    const weekStarts: string[] = [];
    const d = new Date(currentWeekStart + "T12:00:00");
    for (let i = 0; i < 5; i++) {
      const mon = new Date(d);
      mon.setDate(d.getDate() - i * 7);
      weekStarts.push(`${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`);
    }

    const [plansResult, goalsResult, sleepResult, moodResult] = await Promise.all([
      // All 5 weekly plans with tasks
      Promise.all(weekStarts.map(ws =>
        admin.from("weekly_plans")
          .select("*, weekly_tasks(*)")
          .eq("user_id", user.id)
          .eq("week_start", ws)
          .maybeSingle()
      )),
      // Active goals
      admin.from("goals").select("*").eq("user_id", user.id).eq("status", "ativa"),
      // Recent sleep
      admin.from("sleep_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
      // Recent moods
      admin.from("check_ins").select("mood_tags").eq("user_id", user.id).order("date", { ascending: false }).limit(5),
    ]);

    // Build week data
    const weeks: WeekData[] = [];
    for (let i = 0; i < plansResult.length; i++) {
      const plan = plansResult[i];
      const tasks = (plan?.weekly_tasks as any[]) || [];
      const stats = computeAreaStats(tasks);
      weeks.push({ weekStart: weekStarts[i], tasks, ...stats });
    }
    const current = weeks[0];
    const history = weeks.slice(1).filter(w => w.totalTasks > 0);

    // Active goals
    const activeGoals = (goalsResult || []) as any[];

    // Sleep
    const sleepLogs = (sleepResult || []) as any[];

    // Moods
    const recentMoods: string[] = [];
    for (const c of (moodResult || []) as any[]) {
      if (c.mood_tags?.length > 0) recentMoods.push(c.mood_tags[0]);
    }

    const insights = generateInsights(current, history, activeGoals, sleepLogs, recentMoods, firstName);
    const metrics = calculateMetrics(current, history);

    // Sort by priority, return top 3
    const topInsights = insights.sort((a, b) => a.priority - b.priority).slice(0, 3);

    return NextResponse.json({ insights: topInsights, metrics });
  } catch (error) {
    console.error("GET /api/maya/plan-insight error:", error);
    return NextResponse.json({ insights: [], metrics: { strongest: "—", weakest: "—", balance: 50, variation: 0 } });
  }
}
