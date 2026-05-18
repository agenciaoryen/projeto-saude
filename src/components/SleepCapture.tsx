"use client";

/**
 * SleepCapture — Passive sleep monitoring with ZERO permissions.
 *
 * Strategy:
 * 1. Battery Status API (Android Chrome): charging stops in 21h–04h window → sleep candidate;
 *    charging starts in 05h–10h window → wake candidate.
 * 2. Page Visibility API (all browsers): hidden for 4h+ during night → sleep candidate;
 *    visible in morning window → wake candidate.
 *
 * Events are stored in localStorage and submitted on next app open (when session exists).
 * A passive log is only submitted if duration is plausible (2h–14h).
 */

import { useEffect } from "react";

interface PassiveEvent {
  type: "battery_sleep" | "battery_wake" | "visibility_sleep" | "visibility_wake";
  timestamp: string;
  batteryLevel?: number;
  chargingState?: boolean;
}

const STORAGE_KEY = "sleep_passive_events";
const MAX_EVENTS = 50;

function isNightHour(h: number) { return h >= 21 || h < 5; }
function isMorningHour(h: number) { return h >= 5 && h < 11; }

function pushEvent(evt: PassiveEvent) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: PassiveEvent[] = raw ? JSON.parse(raw) : [];
    events.push(evt);
    // Keep only last MAX_EVENTS to avoid stale data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch { /* ignore */ }
}

function getEvents(): PassiveEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function clearEvents() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

async function flushEvents() {
  const events = getEvents();
  if (events.length === 0) return;

  // Find best sleep_start and wake pair
  const sleepEvt = events.find((e) => e.type === "battery_sleep" || e.type === "visibility_sleep");
  const wakeEvt = [...events].reverse().find((e) => e.type === "battery_wake" || e.type === "visibility_wake");

  if (!sleepEvt || !wakeEvt) return; // no complete pair yet

  const durationMin = Math.round(
    (new Date(wakeEvt.timestamp).getTime() - new Date(sleepEvt.timestamp).getTime()) / 60000
  );

  // Skip implausible
  if (durationMin < 120 || durationMin > 840) {
    clearEvents();
    return;
  }

  try {
    const res = await fetch("/api/sleep/passive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events,
        estimatedSleepStart: sleepEvt.timestamp,
        estimatedWake: wakeEvt.timestamp,
        durationMin,
      }),
    });
    if (res.ok) clearEvents();
  } catch { /* will retry next open */ }
}

export function SleepCapture() {
  useEffect(() => {
    // Flush any pending events from last session
    flushEvents();

    // ── Battery Status API ──────────────────────────────────────────────────
    type BatteryManager = { onchargingchange: (() => void) | null; charging: boolean; level: number };
    let batteryManager: BatteryManager | null = null;

    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((b) => {
          batteryManager = b;
          b.onchargingchange = () => {
            if (!batteryManager) return;
            const now = new Date();
            const h = now.getHours();
            if (!batteryManager.charging && isNightHour(h)) {
              pushEvent({ type: "battery_sleep", timestamp: now.toISOString(), batteryLevel: batteryManager.level, chargingState: false });
            } else if (batteryManager.charging && isMorningHour(h)) {
              pushEvent({ type: "battery_wake", timestamp: now.toISOString(), batteryLevel: batteryManager.level, chargingState: true });
              flushEvents();
            }
          };
        })
        .catch(() => { /* API not available */ });
    }

    // ── Page Visibility API ─────────────────────────────────────────────────
    let hiddenAt: Date | null = null;

    const handleVisibility = () => {
      const now = new Date();
      const h = now.getHours();

      if (document.hidden) {
        hiddenAt = now;
        if (isNightHour(h)) {
          pushEvent({ type: "visibility_sleep", timestamp: now.toISOString() });
        }
      } else {
        if (hiddenAt && isMorningHour(h)) {
          const minutesHidden = (now.getTime() - hiddenAt.getTime()) / 60000;
          // Only consider wakes after 3h+ of hidden time
          if (minutesHidden >= 180) {
            pushEvent({ type: "visibility_wake", timestamp: now.toISOString() });
            flushEvents();
          }
        }
        hiddenAt = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (batteryManager) batteryManager.onchargingchange = null;
    };
  }, []);

  return null; // invisible — purely side-effect component
}
