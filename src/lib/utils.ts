import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns today's date in YYYY-MM-DD using LOCAL timezone (not UTC). */
export function getLocalDate(): string {
  return fmtLocal(new Date());
}

/** Returns yesterday's date in YYYY-MM-DD using LOCAL timezone. */
export function getLocalYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtLocal(d);
}

/** Converts a UTC ISO timestamp string to a local date string (YYYY-MM-DD). */
export function getLocalDateFromISO(isoStr: string): string {
  return fmtLocal(new Date(isoStr));
}

/** Formats a Date as YYYY-MM-DD in LOCAL timezone. */
export function formatLocalDate(d: Date): string {
  return fmtLocal(d);
}

/**
 * Counts consecutive days from the most recent check-in.
 * Timezone-independent: uses date arithmetic, not "today" strings.
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Sort descending
  const sorted = [...dates].sort(
    (a, b) => new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()
  );

  // Check if latest is within 2.5 days of now (grace period for timezone gaps)
  const latestMs = new Date(sorted[0] + "T12:00:00").getTime();
  const graceMs = 2.5 * 86400000;
  if (Date.now() - latestMs > graceMs) return 0;

  // Count consecutive days
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = new Date(sorted[i] + "T12:00:00").getTime();
    const prev = new Date(sorted[i + 1] + "T12:00:00").getTime();
    const diff = Math.abs((curr - prev) / 86400000);
    if (diff >= 0.9 && diff <= 1.1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
