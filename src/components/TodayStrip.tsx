"use client";

import { useRouter } from "next/navigation";
import type { CheckIn, SleepLog, WeeklyTask } from "@/types";

/* ── Mini card skeleton ─────────────────────────────────────── */

function MiniSkeleton() {
  return (
    <div
      className="flex-shrink-0 rounded-2xl animate-pulse"
      style={{
        width: 108,
        height: 96,
        background: "oklch(0.18 0.015 270)",
        border: "1px solid oklch(0.25 0.02 270 / 0.5)",
        padding: "12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className="w-6 h-6 rounded-full" style={{ background: "oklch(0.22 0.02 270)" }} />
      <div className="h-3 rounded-full w-16" style={{ background: "oklch(0.22 0.02 270)" }} />
      <div className="h-2.5 rounded-full w-12" style={{ background: "oklch(0.22 0.02 270)" }} />
    </div>
  );
}

/* ── Mini card de dados ─────────────────────────────────────── */

function MiniCard({
  emoji,
  label,
  value,
  sub,
  subColor,
  onClick,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 flex flex-col gap-1.5 text-left cursor-pointer transition-transform active:scale-95"
      style={{
        width: 108,
        borderRadius: 16,
        padding: "12px 10px",
        background: "oklch(0.16 0.012 270)",
        border: "1px solid oklch(0.28 0.02 270 / 0.5)",
      }}
    >
      <span className="text-xl leading-none">{emoji}</span>
      <p className="m-0 text-[11px] font-semibold leading-tight" style={{ color: "#e0d6ff" }}>
        {value}
      </p>
      <p className="m-0 text-[10px] font-medium" style={{ color: subColor || "oklch(0.55 0.03 270)" }}>
        {sub || label}
      </p>
    </button>
  );
}

/* ── Props ──────────────────────────────────────────────────── */

interface TodayStripProps {
  recentSleep: SleepLog | null;
  todayCheckIn: CheckIn | null;
  todaySpending: number | null;
  spendingLimit: number;
  todayTasks: WeeklyTask[];
  todayMealsCount?: number;
  todayMealsKcal?: number | null;
  loading?: boolean;
}

/* ── Component ──────────────────────────────────────────────── */

export function TodayStrip({
  recentSleep,
  todayCheckIn,
  todaySpending,
  spendingLimit,
  todayTasks,
  todayMealsCount,
  todayMealsKcal,
  loading,
}: TodayStripProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="px-3.5 pt-4">
        <p
          className="m-0 mb-2.5 text-[10px] font-bold tracking-[.12em] uppercase"
          style={{ color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}
        >
          Hoje num piscar
        </p>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollSnapType: "x mandatory", paddingBottom: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <MiniSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const sleepValue = recentSleep?.duration_min
    ? `${Math.floor(recentSleep.duration_min / 60)}h${recentSleep.duration_min % 60 > 0 ? ` ${recentSleep.duration_min % 60}min` : ""}`
    : recentSleep?.quality
      ? `Qualidade ${recentSleep.quality}/5`
      : "—";

  const sleepSub = recentSleep?.quality
    ? recentSleep.quality >= 4 ? "Boa noite" : recentSleep.quality >= 3 ? "Noite ok" : "Noite ruim"
    : "Sem registro";

  const sleepSubColor = recentSleep?.quality
    ? recentSleep.quality >= 3 ? "#22D18B" : "#FF5C5C"
    : undefined;

  const moodValue = todayCheckIn?.mood_tags?.[0]
    ? todayCheckIn.mood_tags[0].charAt(0).toUpperCase() + todayCheckIn.mood_tags[0].slice(1)
    : todayCheckIn?.feeling
      ? `"${todayCheckIn.feeling.slice(0, 12)}${todayCheckIn.feeling.length > 12 ? "…" : ""}"`
      : "—";

  const moodSub = todayCheckIn ? "Check-in feito" : "Pendente";

  const mealCount = todayMealsCount ?? 0;
  const mealKcal = todayMealsKcal ?? null;
  const mealValue = mealKcal != null ? `${mealKcal} kcal` : mealCount > 0 ? `${mealCount}/4` : "—";
  const mealSub = mealCount > 0
    ? `${mealCount} refeiç${mealCount === 1 ? "ão" : "ões"}`
    : "Registrar";
  const mealSubColor = mealKcal != null && mealKcal > 2200 ? "#FF5C5C" : "#22D18B";

  const spendingPct =
    todaySpending !== null && spendingLimit > 0
      ? Math.round((todaySpending / spendingLimit) * 100)
      : null;
  const spendingValue = todaySpending !== null ? `R$${todaySpending.toFixed(0)}` : "—";
  const spendingSub = spendingPct !== null ? `${spendingPct}% do limite` : "Sem dados";

  const todayDone = todayTasks.filter((t) => t.status === "concluida").length;
  const todayTotal = todayTasks.length;
  const taskValue = todayTotal > 0 ? `${todayDone}/${todayTotal}` : "—";
  const taskSub = todayTotal > 0 ? (todayDone === todayTotal ? "Tudo feito!" : "em andamento") : "Sem tarefas";

  return (
    <div className="px-3.5 pt-4">
      <p
        className="m-0 mb-2.5 text-[10px] font-bold tracking-[.12em] uppercase"
        style={{ color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}
      >
        Hoje num piscar
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        <MiniCard
          emoji="😴"
          label="Sono"
          value={sleepValue}
          sub={sleepSub}
          subColor={sleepSubColor}
          onClick={() => router.push("/sono")}
        />
        <MiniCard
          emoji={todayCheckIn?.mood_tags?.[0] ? "😊" : "🤔"}
          label="Humor"
          value={moodValue}
          sub={moodSub}
          subColor={todayCheckIn ? "#22D18B" : undefined}
          onClick={() => router.push("/check-in")}
        />
        <MiniCard
          emoji="🥗"
          label="Refeições"
          value={mealValue}
          sub={mealSub}
          subColor={mealSubColor}
          onClick={() => router.push("/nutricao")}
        />
        <MiniCard
          emoji="💰"
          label="Gastos"
          value={spendingValue}
          sub={spendingSub}
          subColor={spendingPct && spendingPct > 70 ? "#FF5C5C" : "#22D18B"}
          onClick={() => router.push("/financas")}
        />
        <MiniCard
          emoji="📋"
          label="Tarefas"
          value={taskValue}
          sub={taskSub}
          subColor={todayDone === todayTotal && todayTotal > 0 ? "#22D18B" : undefined}
          onClick={() => router.push("/agenda")}
        />
      </div>

      {/* Fade indicator on right edge */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
        style={{
          background: "linear-gradient(to right, transparent, oklch(0.12 0.012 270))",
        }}
      />
    </div>
  );
}
