import type { SleepLog, SleepStats } from "@/types";
import { getWeekMondayDate, getWeekSundayDate } from "@/lib/utils";

// ── Sleep cycle calculator ────────────────────────────────────────────────────

const CYCLE_MIN = 90;

/** Returns ideal wake-up times starting from sleep_start, for N complete cycles */
export function sleepCycleTimes(sleepStart: Date, cycles = [5, 6]): Date[] {
  return cycles.map((n) => {
    const wake = new Date(sleepStart.getTime());
    wake.setMinutes(wake.getMinutes() + n * CYCLE_MIN + 14); // +14min to fall asleep
    return wake;
  });
}

/** Formats duration in minutes to "Xh Ymin" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// ── Sleep score (0–100) ───────────────────────────────────────────────────────

/**
 * Scores a single sleep log:
 * - Duration: ideal 420–540 min (7–9h) = 40pts
 * - Quality: self-reported 1–5 = 30pts
 * - No interruptions = 20pts (lose 5 per interruption, min 0)
 * - Dreams reported = 10pts (proxy for REM completeness)
 */
export function sleepScore(log: SleepLog): number {
  let score = 0;

  // Duration component (40pts)
  if (log.duration_min !== null && log.duration_min > 0) {
    const dur = log.duration_min;
    if (dur >= 420 && dur <= 540) score += 40;
    else if (dur >= 360 && dur < 420) score += 30; // 6–7h
    else if (dur > 540 && dur <= 600) score += 30; // 9–10h
    else if (dur >= 300 && dur < 360) score += 18; // 5–6h
    else if (dur > 600) score += 18; // >10h
    else score += 5; // <5h
  }

  // Quality component (30pts)
  if (log.quality !== null) {
    score += Math.round(((log.quality - 1) / 4) * 30);
  }

  // Interruptions component (20pts)
  const interr = log.interruptions ?? 0;
  score += Math.max(0, 20 - interr * 5);

  // Dreams (10pts — proxy for deep/REM sleep)
  if (log.had_dreams === true) score += 10;

  return Math.min(100, score);
}

// ── Consistency score ─────────────────────────────────────────────────────────

/**
 * Measures bedtime/wake-time consistency over a set of logs.
 * Looks at variance in sleep_start hours — lower variance = higher score.
 */
export function consistencyScore(logs: SleepLog[]): number {
  const starts = logs
    .filter((l) => l.sleep_start)
    .map((l) => {
      const d = new Date(l.sleep_start!);
      let h = d.getHours() + d.getMinutes() / 60;
      if (h < 12) h += 24; // treat 01:00 as 25:00 so nightly clustering works
      return h;
    });

  if (starts.length < 2) return 100;

  const mean = starts.reduce((s, h) => s + h, 0) / starts.length;
  const variance = starts.reduce((s, h) => s + (h - mean) ** 2, 0) / starts.length;
  const stdDev = Math.sqrt(variance);

  // stdDev ≤ 0.5h → 100, stdDev ≥ 3h → 0
  return Math.max(0, Math.round(100 - (stdDev / 3) * 100));
}

// ── Weekly stats ──────────────────────────────────────────────────────────────

export function computeSleepStats(allLogs: SleepLog[]): SleepStats {
  const mondayDate = getWeekMondayDate();
  const sundayDate = getWeekSundayDate();

  const weeklyLogs = allLogs.filter((l) => l.date >= mondayDate && l.date <= sundayDate);
  const withDuration = weeklyLogs.filter((l) => l.duration_min !== null && l.duration_min > 0);
  const withQuality = weeklyLogs.filter((l) => l.quality !== null);

  const avgDurationMin =
    withDuration.length > 0
      ? Math.round(withDuration.reduce((s, l) => s + (l.duration_min ?? 0), 0) / withDuration.length)
      : 0;

  const avgQuality =
    withQuality.length > 0
      ? Math.round((withQuality.reduce((s, l) => s + (l.quality ?? 0), 0) / withQuality.length) * 10) / 10
      : 0;

  const scored = weeklyLogs.map((l) => ({ log: l, score: sleepScore(l) }));
  const bestNight = scored.length > 0 ? scored.reduce((a, b) => (b.score > a.score ? b : a)).log : null;
  const worstNight = scored.length > 0 ? scored.reduce((a, b) => (b.score < a.score ? b : a)).log : null;

  return {
    avgDurationMin,
    avgQuality,
    totalNights: weeklyLogs.length,
    bestNight,
    worstNight,
    consistencyScore: consistencyScore(weeklyLogs),
    weeklyLogs,
  };
}

// ── Duration from quality (fallback when no times logged) ────────────────────

export const DURATION_FROM_QUALITY: Record<number, number> = {
  1: 240, // ~4h
  2: 330, // ~5.5h
  3: 420, // ~7h
  4: 480, // ~8h
  5: 510, // ~8.5h
};

// ── Duration chips (for UI) ───────────────────────────────────────────────────

export const DURATION_CHIPS: { label: string; value: number }[] = [
  { label: "< 5h", value: 270 },
  { label: "5–6h", value: 330 },
  { label: "6–7h", value: 390 },
  { label: "7–8h", value: 450 },
  { label: "8h+", value: 510 },
];
