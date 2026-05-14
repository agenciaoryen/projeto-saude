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
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {sorted.map((ci, i) => {
          const score = allScores[i];
          const height = (score / maxScore) * 100;

          return (
            <div
              key={ci.id}
              className="flex-1 flex flex-col items-center gap-1 min-w-2 self-stretch"
            >
              <div
                className="w-full rounded-t-sm transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(height, 6)}%`,
                  backgroundColor:
                    score >= maxScore * 0.8
                      ? "var(--color-primary)"
                      : score >= maxScore * 0.6
                      ? "var(--color-chart-2)"
                      : score >= maxScore * 0.3
                      ? "var(--color-chart-3)"
                      : "var(--color-muted-foreground)",
                  opacity: score > 0 ? 0.7 + (score / maxScore) * 0.3 : 0.35,
                }}
                title={`${score}/${maxScore} hábitos - ${new Date(ci.date + "T12:00:00").toLocaleDateString("pt-BR")}`}
              />
            </div>
          );
        })}
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
