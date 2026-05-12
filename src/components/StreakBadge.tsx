"use client";

import { useTranslation } from "@/lib/useTranslation";

interface StreakBadgeProps {
  streak: number;
}

const MILESTONES = [3, 7, 14, 30, 60, 90];

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { t } = useTranslation();

  const getMessage = () => {
    if (streak === 0) return t("comece_hoje");
    if (streak < 3) return t("comecando");
    if (streak < 7) return t("constancia");
    if (streak < 14) return t("uma_semana");
    if (streak < 30) return t("incrivel");
    if (streak < 60) return t("um_mes");
    return t("lendario");
  };

  const nextMilestone = MILESTONES.find((m) => m > streak);
  const currentMilestone = [...MILESTONES].reverse().find((m) => streak >= m) || 0;
  const progress = nextMilestone
    ? ((streak - currentMilestone) / (nextMilestone - currentMilestone)) * 100
    : 100;

  return (
    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/20 rounded-2xl">
      <div className="text-4xl font-bold text-primary">{streak}</div>
      <div className="text-sm text-muted-foreground mt-1">{t("dias_consecutivos")}</div>
      <div className="text-xs text-primary font-medium mt-1">{getMessage()}</div>
      {nextMilestone && (
        <div className="mt-3 space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t("faltam_dias")} {nextMilestone - streak} dia{nextMilestone - streak !== 1 ? "s" : ""} {t("para_proximo_marco")} ({nextMilestone}d)
          </p>
        </div>
      )}
    </div>
  );
}
