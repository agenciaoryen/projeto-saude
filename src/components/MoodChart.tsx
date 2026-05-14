"use client";

import type { CheckIn } from "@/types";

interface MoodChartProps {
  checkIns: CheckIn[];
  enabledKeys: string[];
}

export function MoodChart({ checkIns, enabledKeys }: MoodChartProps) {
  const sorted = [...checkIns]
    .sort((a, b) => new Date(a.date + "T12:00:00").getTime() - new Date(b.date + "T12:00:00").getTime())
    .slice(-30);

  if (sorted.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Mais dias de check-in para ver sua evolução
      </p>
    );
  }

  const scoreKeys = enabledKeys.filter((k) => k !== "suicidal_thoughts");
  const maxScore = scoreKeys.length || 1;

  const getScore = (ci: CheckIn) =>
    scoreKeys.filter((k) => {
      return (ci as Record<string, unknown>)[k] === true;
    }).length;

  const allScores = sorted.map((ci) => getScore(ci));
  const hasData = allScores.some((s) => s > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhum hábito registrado ainda
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground text-center">
        Hábitos concluídos por dia
      </p>

      {/* Grid lines + chart area */}
      <div className="relative">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-border/30" />
          <div className="border-t border-border/30" />
          <div className="border-t border-border/30" />
          <div className="border-t border-border/30" />
        </div>

        <div className="flex items-end gap-1 h-32">
          {sorted.map((ci, i) => {
            const score = allScores[i];
            const height = Math.max((score / maxScore) * 100, score > 0 ? 8 : 2);

            const barColor =
              score >= maxScore * 0.8
                ? "var(--color-primary)"
                : score >= maxScore * 0.6
                ? "var(--color-chart-2)"
                : score >= maxScore * 0.3
                ? "var(--color-chart-3)"
                : "var(--color-muted-foreground)";

            return (
              <div
                key={ci.id}
                className="flex-1 flex flex-col justify-end items-center min-w-2 self-stretch"
              >
                {/* Score count above bar */}
                <span
                  className="text-[10px] font-medium mb-1"
                  style={{ color: barColor }}
                >
                  {score > 0 ? score : ""}
                </span>
                {/* Bar */}
                <div
                  className="w-full max-w-[16px] rounded-t-sm transition-all hover:opacity-80 mx-auto"
                  style={{
                    height: `${height}%`,
                    backgroundColor: barColor,
                    opacity: score > 0 ? 0.7 + (score / maxScore) * 0.3 : 0.25,
                  }}
                  title={`${score}/${maxScore} hábitos - ${new Date(ci.date + "T12:00:00").toLocaleDateString("pt-BR")}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(sorted[0].date + "T12:00:00").toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {new Date(
            sorted[sorted.length - 1].date + "T12:00:00"
          ).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}
