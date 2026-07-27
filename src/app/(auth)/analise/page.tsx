"use client";

import { useEffect, useState, useMemo } from "react";
import { cachedFetch } from "@/lib/fetch-cache";
import type { CheckIn, SleepLog, FinancialTransaction } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

/** YYYY-MM-DD for N days ago (in local time) */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Filter array to entries within the last `days` (inclusive of today) */
function filterPeriod<T extends { date: string }>(items: T[], days: number): T[] {
  const since = daysAgo(days - 1);
  return items.filter((i) => i.date >= since);
}

/** Previous equal-length period (e.g. last 7 days → the 7 days before that) */
function filterPrevPeriod<T extends { date: string }>(items: T[], days: number): T[] {
  const from = daysAgo(days * 2 - 1);
  const to = daysAgo(days);
  return items.filter((i) => i.date >= from && i.date <= to);
}

/** Safe average, returns null if empty */
function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Wellness score 0–100 from a single check-in, based on enabled habit keys */
function wellnessScore(ci: CheckIn, habitKeys: string[]): number {
  if (habitKeys.length === 0) return 50;
  let sum = 0;
  let count = 0;
  for (const k of habitKeys) {
    if (k === "suicidal_thoughts" || k === "water_cups") continue;
    const v = (ci as unknown as Record<string, unknown>)[k];
    if (k === "drank_water") {
      sum += (ci.water_cups ?? 0) >= 4 ? 100 : (ci.water_cups ?? 0) > 0 ? 50 : 0;
    } else {
      sum += v === true ? 100 : v === false ? 0 : 50;
    }
    count++;
  }
  return count > 0 ? Math.round(sum / count) : 50;
}

/** Positive mood tags (lowercase) */
const POSITIVE_TAGS = new Set([
  "feliz", "animado", "grato", "calmo", "confiante", "motivado",
  "tranquilo", "leve", "bem", "otimo", "alegre", "esperancoso",
  "produtivo", "focado", "energetico", "entusiasmado", "realizado",
  "satisfeito", "bem-humorado", "ok",
]);

const NEGATIVE_TAGS = new Set([
  "triste", "ansioso", "estressado", "irritado", "cansado",
  "desanimado", "preocupado", "sobrecarregado", "frustrado",
  "mal", "pessimo", "exausto", "desmotivado", "entediado",
  "sozinho", "inseguro", "confuso", "deprimido",
]);

// ── component ────────────────────────────────────────────────────────────────

export default function AnalisePage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"semana" | "mes" | "trimestre">("semana");

  const periodDays = { semana: 7, mes: 30, trimestre: 90 }[tab];

  useEffect(() => {
    Promise.all([
      cachedFetch<CheckIn[]>("/api/check-ins"),
      cachedFetch<{ enabled_questions?: string[] }>("/api/preferences"),
      cachedFetch<SleepLog[]>("/api/sleep?limit=200"),
      cachedFetch<FinancialTransaction[]>("/api/financas/transactions"),
    ])
      .then(([ci, prefs, sleep, fin]) => {
        if (Array.isArray(ci)) setCheckIns(ci);
        if (Array.isArray(sleep)) setSleepLogs(sleep);
        if (Array.isArray(fin)) setTransactions(fin);
        setEnabledKeys(prefs.enabled_questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── filtered data ────────────────────────────────────────────────────────

  const periodCI = useMemo(() => filterPeriod(checkIns, periodDays), [checkIns, periodDays]);
  const prevCI = useMemo(() => filterPrevPeriod(checkIns, periodDays), [checkIns, periodDays]);

  const periodSleep = useMemo(() => filterPeriod(sleepLogs, periodDays), [sleepLogs, periodDays]);
  const prevSleep = useMemo(() => filterPrevPeriod(sleepLogs, periodDays), [sleepLogs, periodDays]);

  const periodFin = useMemo(() => filterPeriod(transactions, periodDays), [transactions, periodDays]);
  const prevFin = useMemo(() => filterPrevPeriod(transactions, periodDays), [transactions, periodDays]);

  // ── wellness score 0–100 ─────────────────────────────────────────────────

  const habitKeys = useMemo(
    () => enabledKeys.filter((k) => k !== "suicidal_thoughts"),
    [enabledKeys],
  );

  const wellnessAvg = useMemo(
    () => avg(periodCI.map((ci) => wellnessScore(ci, habitKeys))),
    [periodCI, habitKeys],
  );

  const prevWellnessAvg = useMemo(
    () => avg(prevCI.map((ci) => wellnessScore(ci, habitKeys))),
    [prevCI, habitKeys],
  );

  // ── evolution % ───────────────────────────────────────────────────────────

  const evolutionPct = useMemo(() => {
    if (wellnessAvg == null || prevWellnessAvg == null) return null;
    if (prevWellnessAvg === 0) return wellnessAvg > 0 ? 100 : 0;
    return Math.round(((wellnessAvg - prevWellnessAvg) / prevWellnessAvg) * 100);
  }, [wellnessAvg, prevWellnessAvg]);

  // ── areas ─────────────────────────────────────────────────────────────────

  const areas = useMemo(() => {
    // ── sono ──
    const sleepDurations = periodSleep
      .map((s) => s.duration_min)
      .filter((d): d is number => d != null && d > 0);
    const sleepHrs = sleepDurations.length > 0
      ? sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length / 60
      : null;
    // fallback: slept_well % from check-ins
    const sleptWellPct = periodCI.length > 0
      ? Math.round((periodCI.filter((c) => c.slept_well === true).length / periodCI.length) * 100)
      : null;
    const sonoDisplay = sleepHrs != null ? Math.round(sleepHrs * 10) / 10 : null; // hours with 1 decimal

    const prevSleepDurations = prevSleep
      .map((s) => s.duration_min)
      .filter((d): d is number => d != null && d > 0);
    const prevSleepHrs = prevSleepDurations.length > 0
      ? prevSleepDurations.reduce((a, b) => a + b, 0) / prevSleepDurations.length / 60
      : null;
    const sonoPct = sleepHrs != null ? Math.round(sleepHrs / 8 * 100) : (sleptWellPct ?? 0);
    const prevSonoPct = prevSleepHrs != null ? Math.round(prevSleepHrs / 8 * 100) : 0;
    const sonoTrend = prevSonoPct > 0 ? Math.round(((sonoPct - prevSonoPct) / prevSonoPct) * 100) : 0;

    // ── humor ──
    const humorScores = periodCI.map((ci) => {
      const tags = ci.mood_tags ?? [];
      if (tags.length === 0) return 50; // neutral if no tags
      const pos = tags.filter((t) => POSITIVE_TAGS.has(t.toLowerCase())).length;
      const neg = tags.filter((t) => NEGATIVE_TAGS.has(t.toLowerCase())).length;
      if (pos + neg === 0) return 50;
      return Math.round((pos / (pos + neg)) * 100);
    });
    const humorPct = avg(humorScores) ?? 50;
    const prevHumorScores = prevCI.map((ci) => {
      const tags = ci.mood_tags ?? [];
      if (tags.length === 0) return 50;
      const pos = tags.filter((t) => POSITIVE_TAGS.has(t.toLowerCase())).length;
      const neg = tags.filter((t) => NEGATIVE_TAGS.has(t.toLowerCase())).length;
      if (pos + neg === 0) return 50;
      return Math.round((pos / (pos + neg)) * 100);
    });
    const prevHumorPct = avg(prevHumorScores) ?? 50;
    const humorTrend = prevHumorPct > 0 ? Math.round(((humorPct - prevHumorPct) / prevHumorPct) * 100) : 0;

    // ── foco ──
    const focoPct = periodCI.length > 0
      ? Math.round((periodCI.filter((c) => c.worked_on_goals === true).length / periodCI.length) * 100)
      : 0;
    const prevFocoPct = prevCI.length > 0
      ? Math.round((prevCI.filter((c) => c.worked_on_goals === true).length / prevCI.length) * 100)
      : 0;
    const focoTrend = prevFocoPct > 0 ? Math.round(((focoPct - prevFocoPct) / prevFocoPct) * 100) : 0;

    // ── gastos ──
    const despesas = periodFin
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const prevDespesas = prevFin
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    // Normalize by days so comparison is fair
    const despesasDaily = periodDays > 0 ? despesas / periodDays : despesas;
    const prevDespesasDaily = periodDays > 0 ? prevDespesas / periodDays : prevDespesas;
    const gastosTrend = prevDespesasDaily > 0
      ? Math.round(((prevDespesasDaily - despesasDaily) / prevDespesasDaily) * 100)
      : 0; // positive = spending less (good)

    return {
      sono: { pct: sonoPct, trend: sonoTrend, display: sonoDisplay, sleptWellPct },
      humor: { pct: humorPct, trend: humorTrend },
      foco: { pct: focoPct, trend: focoTrend },
      gastos: { pct: Math.round(despesas), trend: gastosTrend },
    };
  }, [periodCI, prevCI, periodSleep, prevSleep, periodFin, prevFin, periodDays]);

  // ── maya insight ──────────────────────────────────────────────────────────

  const mayaInsight = useMemo(() => {
    if (checkIns.length < 5) return null;

    // Split all check-ins into good-sleep and bad-sleep days
    const goodSleepCI = checkIns.filter((c) => c.slept_well === true);
    const badSleepCI = checkIns.filter((c) => c.slept_well === false);

    if (goodSleepCI.length < 2 || badSleepCI.length < 2) {
      // Not enough data to compare — fall back to a simpler insight
      const hasSleepLogs = sleepLogs.length > 0;
      if (hasSleepLogs) {
        const avgHrs = sleepLogs
          .map((s) => s.duration_min)
          .filter((d): d is number => d != null)
          .reduce((a, b) => a + b, 0) / sleepLogs.filter((s) => s.duration_min != null).length / 60;
        return {
          title: `Você dorme em média ${avgHrs.toFixed(1)}h por noite.`,
          detail: "Acompanhar o sono é o primeiro passo para entender seu bem-estar.",
          pct: null,
        };
      }
      return {
        title: "Continue registrando seu dia para eu encontrar padrões.",
        detail: "Quanto mais check-ins você fizer, mais insights como este aparecerão.",
        pct: null,
      };
    }

    // Compute wellness per group
    const goodAvg = goodSleepCI.reduce((s, c) => s + wellnessScore(c, habitKeys), 0) / goodSleepCI.length;
    const badAvg = badSleepCI.reduce((s, c) => s + wellnessScore(c, habitKeys), 0) / badSleepCI.length;
    const diff = Math.round(((goodAvg - badAvg) / Math.max(badAvg, 1)) * 100);

    if (diff <= 5) {
      return {
        title: "Seu bem-estar não varia muito com o sono.",
        detail: "Outros fatores podem estar impactando mais. Vamos continuar observando.",
        pct: null,
      };
    }

    return {
      title: `Seu bem-estar melhora ${diff}% quando você dorme bem.`,
      detail: `Baseado em ${goodSleepCI.length + badSleepCI.length} check-ins. O sono é um dos fatores que mais impactam sua qualidade de vida.`,
      pct: diff,
    };
  }, [checkIns, sleepLogs, habitKeys]);

  // ── impact factors ────────────────────────────────────────────────────────

  const impactFactors = useMemo(() => {
    if (checkIns.length < 5 || habitKeys.length === 0) return [];

    // Compute wellness for each check-in
    const scores = checkIns.map((ci) => wellnessScore(ci, habitKeys));

    // Correlation of each habit with overall wellness
    const habitLabels: Record<string, string> = {
      slept_well: "Sono",
      ate_well: "Alimentação",
      exercise_walk: "Exercício",
      meditation_prayer_breathing: "Meditação",
      worked_on_goals: "Foco",
      creative_activity: "Criatividade",
      did_something_enjoyable: "Lazer",
      talked_to_someone: "Conexão social",
      drank_water: "Hidratação",
      took_medication: "Medicação",
      felt_judged: "Julgamento",
      bowel_movement: "Intestino",
    };

    const factors: { label: string; pct: number; negative: boolean }[] = [];

    for (const k of habitKeys) {
      if (k === "water_cups" || k === "suicidal_thoughts" || k === "feeling" || k === "mood_tags" || k === "gratitude" || k === "gratitude_photos") continue;
      if (!habitLabels[k]) continue;

      // Split into days with this habit true vs false
      const trueScores: number[] = [];
      const falseScores: number[] = [];
      checkIns.forEach((ci, i) => {
        let val: boolean;
        if (k === "drank_water") {
          val = (ci.water_cups ?? 0) >= 4;
        } else {
          val = (ci as unknown as Record<string, unknown>)[k] === true;
        }
        if (val) trueScores.push(scores[i]);
        else falseScores.push(scores[i]);
      });

      if (trueScores.length < 2 || falseScores.length < 2) continue;

      const trueAvg = trueScores.reduce((a, b) => a + b, 0) / trueScores.length;
      const falseAvg = falseScores.reduce((a, b) => a + b, 0) / falseScores.length;
      const impact = Math.round(Math.abs(trueAvg - falseAvg));

      if (impact >= 3) {
        factors.push({
          label: habitLabels[k],
          pct: Math.min(impact, 100),
          negative: trueAvg < falseAvg, // negative if having this habit makes score lower (unusual)
        });
      }
    }

    // Sort by impact desc, take top 4
    factors.sort((a, b) => b.pct - a.pct);
    return factors.slice(0, 4);
  }, [checkIns, habitKeys]);

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 9999,
    border: 0,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 700,
    background: active ? "#7C5CFF" : "oklch(0.22 0.02 270)",
    color: active ? "#fff" : "oklch(0.6 0.03 270)",
    transition: "all .15s ease",
  });

  const areaCards = [
    {
      label: "Sono",
      pct: areas.sono.pct,
      trend: areas.sono.trend,
      positive: areas.sono.trend >= 0,
      detail: areas.sono.display != null ? `${areas.sono.display}h` : `${areas.sono.sleptWellPct ?? 0}%`,
    },
    {
      label: "Humor",
      pct: areas.humor.pct,
      trend: areas.humor.trend,
      positive: areas.humor.trend >= 0,
      detail: null,
    },
    {
      label: "Foco",
      pct: areas.foco.pct,
      trend: areas.foco.trend,
      positive: areas.foco.trend >= 0,
      detail: null,
    },
    {
      label: "Gastos",
      pct: typeof areas.gastos.pct === "number" && areas.gastos.pct > 0 ? areas.gastos.pct : 0,
      trend: areas.gastos.trend,
      positive: areas.gastos.trend >= 0, // trending down = good (spending less)
      detail: typeof areas.gastos.pct === "number" && areas.gastos.pct > 0
        ? `R$${areas.gastos.pct}`
        : "—",
    },
  ];

  const tabLabel = tab === "semana" ? "esta semana" : tab === "mes" ? "este mês" : "este trimestre";

  return (
    <div style={{ minHeight: "100dvh", background: "oklch(0.12 0.012 270)", paddingBottom: 110 }}>
      <div style={{ padding: "22px 20px 4px" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e0d6ff", letterSpacing: "-0.02em" }}>
          Visão geral
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "oklch(0.55 0.03 270)" }}>
          {periodCI.length} check-ins em {tabLabel}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 8 }}>
        {(["semana", "mes", "trimestre"] as const).map((t) => (
          <button key={t} type="button" style={tabStyle(tab === t)} onClick={() => setTab(t)}>
            {t === "semana" ? "Semana" : t === "mes" ? "Mês" : "Trimestre"}
          </button>
        ))}
      </div>

      {/* Evolution ring */}
      {periodCI.length >= 2 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%",
            background: evolutionPct != null
              ? `conic-gradient(#7C5CFF ${Math.max(0, Math.min(evolutionPct + 50, 100)) * 3.6}deg, #22D18B ${Math.abs(evolutionPct) * 3.6}deg, oklch(0.22 0.02 270) 0deg)`
              : `conic-gradient(#7C5CFF ${(wellnessAvg ?? 50) * 3.6}deg, oklch(0.22 0.02 270) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: 106, height: 106, borderRadius: "50%",
              background: "oklch(0.12 0.012 270)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#e0d6ff", lineHeight: 1 }}>
                {evolutionPct != null
                  ? (evolutionPct > 0 ? "+" : "") + evolutionPct
                  : wellnessAvg != null
                    ? Math.round(wellnessAvg)
                    : "—"}
              </span>
              <span style={{ fontSize: 10, color: "oklch(0.55 0.03 270)", marginTop: 2 }}>
                {evolutionPct != null ? "vs anterior" : "Bem-estar"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <p style={{ color: "oklch(0.55 0.03 270)", fontSize: 14 }}>
            Registre {3 - periodCI.length} {3 - periodCI.length === 1 ? "dia" : "dias"} a mais para ver sua evolução.
          </p>
        </div>
      )}

      {/* Maya detectou */}
      {mayaInsight && (
        <div style={{ padding: "0 16px", marginTop: 8 }}>
          <div style={{
            background: "oklch(0.16 0.012 270)",
            border: "1px solid oklch(0.28 0.02 270 / 0.5)",
            borderRadius: 18, padding: "16px 18px",
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#A78BFA" }}>
              💡 Maya detectou
            </p>
            <p style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 700, color: "#e0d6ff", lineHeight: 1.3 }}>
              {mayaInsight.title}
              {mayaInsight.pct != null && (
                <span style={{ color: "#22D18B", marginLeft: 4 }}>↑{mayaInsight.pct}%</span>
              )}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "oklch(0.55 0.03 270)", lineHeight: 1.4 }}>
              {mayaInsight.detail}
            </p>
          </div>
        </div>
      )}

      {/* Áreas em destaque */}
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}>
          Áreas em destaque
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {areaCards.map((a) => (
            <div key={a.label} style={{
              background: "oklch(0.16 0.012 270)",
              border: "1px solid oklch(0.28 0.02 270 / 0.5)",
              borderRadius: 16, padding: "14px 12px",
            }}>
              <p style={{ margin: 0, fontSize: 11, color: "oklch(0.55 0.03 270)", fontWeight: 500 }}>{a.label}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#e0d6ff" }}>
                  {a.label === "Sono" && a.detail ? a.detail : `${a.pct}%`}
                </span>
                {a.trend !== 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: a.positive ? "#22D18B" : "#FF5C5C" }}>
                    {a.trend > 0 ? "+" : ""}{a.trend}%
                  </span>
                )}
              </div>
              {/* Mini bar */}
              <div style={{
                height: 3, borderRadius: 9999, marginTop: 8,
                background: "oklch(0.25 0.02 270)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${Math.min(a.pct, 100)}%`, borderRadius: 9999,
                  background: a.label === "Gastos" && areas.gastos.trend < 0
                    ? "#FF5C5C"
                    : a.label === "Gastos"
                      ? "#22D18B"
                      : "linear-gradient(90deg, #7C5CFF, #A78BFA)",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fatores de impacto */}
      {impactFactors.length > 0 && (
        <div style={{ padding: "20px 16px 0" }}>
          <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}>
            O que mais impacta seu bem-estar
          </p>
          <div style={{
            background: "oklch(0.16 0.012 270)",
            border: "1px solid oklch(0.28 0.02 270 / 0.5)",
            borderRadius: 18, padding: "16px 18px",
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#e0d6ff", lineHeight: 1.4 }}>
              {impactFactors[0]?.label
                ? `${impactFactors[0].label} é o fator que mais eleva seu bem-estar.`
                : "Continue registrando para ver seus padrões."}
            </p>
            {impactFactors.map((f) => (
              <div key={f.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: "#e0d6ff" }}>{f.label}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: f.negative ? "#FF5C5C" : "#A78BFA",
                  }}>
                    {f.pct} pts
                  </span>
                </div>
                <div style={{
                  height: 4, borderRadius: 9999,
                  background: "oklch(0.25 0.02 270)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${Math.min(f.pct, 100)}%`,
                    borderRadius: 9999,
                    background: f.negative ? "#FF5C5C" : "#7C5CFF",
                    boxShadow: f.negative ? "none" : "0 0 6px rgba(124,92,255,0.35)",
                    transition: "width 0.7s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no data at all */}
      {checkIns.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "oklch(0.55 0.03 270)", fontSize: 15, margin: "0 0 8px" }}>
            Nenhum check-in ainda
          </p>
          <p style={{ color: "oklch(0.45 0.02 270)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Faça seu primeiro check-in para começar a ver sua evolução por aqui.
          </p>
        </div>
      )}
    </div>
  );
}
