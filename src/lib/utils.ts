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

/** Formats a Date as YYYY-MM-DD in LOCAL timezone. */
export function formatLocalDate(d: Date): string {
  return fmtLocal(d);
}
