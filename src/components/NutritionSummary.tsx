import { Card, CardContent } from "@/components/ui/card";
import { sumMacros, nutritionScore, DEFAULT_DAILY_KCAL } from "@/lib/meal-utils";
import type { Meal } from "@/types";

export function NutritionSummary({ meals, label, kcalGoal = DEFAULT_DAILY_KCAL }: { meals: Meal[]; label: string; kcalGoal?: number }) {
  const analyzed = meals.filter((m) => m.macros && m.status_analise === "analisado");
  const total = sumMacros(analyzed);
  const hasData = analyzed.length > 0;

  const totalG = total.carboidratos_g + total.proteinas_g + total.gorduras_g;
  const carbPct = totalG > 0 ? Math.round((total.carboidratos_g / totalG) * 100) : 0;
  const protPct = totalG > 0 ? Math.round((total.proteinas_g / totalG) * 100) : 0;
  const gordPct = totalG > 0 ? Math.round((total.gorduras_g / totalG) * 100) : 0;

  const score = hasData ? nutritionScore(analyzed) : 0;
  const scoreColor = score >= 80 ? "oklch(0.45 0.15 160)" : score >= 60 ? "oklch(0.60 0.12 70)" : "oklch(0.50 0.15 15)";

  const kcalPct = hasData ? Math.min(Math.round((total.calorias_kcal / kcalGoal) * 100), 100) : 0;
  const progressColor = kcalPct >= 100 ? "oklch(0.60 0.12 70)" : "oklch(0.45 0.15 160)";

  // Dados para o anel de macros
  const ringData = [
    { pct: carbPct, color: "oklch(0.60 0.12 70)", label: "Carbs", grams: total.carboidratos_g },
    { pct: protPct, color: "oklch(0.50 0.15 15)", label: "Prot", grams: total.proteinas_g },
    { pct: gordPct, color: "oklch(0.55 0.15 45)", label: "Gord", grams: total.gorduras_g },
  ].filter((d) => d.pct > 0);

  const ringCirc = 2 * Math.PI * 15; // ≈ 94.2

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          {hasData && (
            <span className="text-[11px] text-muted-foreground">
              {analyzed.length} {analyzed.length === 1 ? "refeição" : "refeições"}
            </span>
          )}
        </div>

        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma refeição analisada neste período.
          </p>
        ) : (
          <>
            {/* Kcal + Score lado a lado */}
            <div className="flex items-center gap-5">
              <div className="flex-1 text-center space-y-2">
                <div>
                  <span className="text-3xl font-bold tabular-nums">{total.calorias_kcal}</span>
                  <span className="text-sm text-muted-foreground ml-1">kcal</span>
                </div>
                {/* Barra de progresso da meta */}
                <div className="space-y-0.5">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      style={{ height: "100%", borderRadius: 9999, transition: "all .7s ease", background: progressColor, width: `${Math.min(kcalPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {kcalPct}% da meta · {kcalGoal} kcal
                  </p>
                </div>
              </div>

              {/* Anel de macros */}
              <div className="relative size-16 shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                  {ringData.reduce(
                    (els, seg, i) => {
                      const prevSum = ringData.slice(0, i).reduce((s, d) => s + d.pct, 0);
                      const dashLen = (seg.pct / 100) * ringCirc;
                      const offset = ringCirc - (prevSum / 100) * ringCirc;
                      els.push(
                        <circle
                          key={seg.label}
                          cx="18" cy="18" r="15"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="3"
                          strokeDasharray={`${dashLen} ${ringCirc}`}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                        />
                      );
                      return els;
                    },
                    [] as JSX.Element[]
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{score}</span>
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "oklch(0.60 0.12 70)", marginRight: 4, verticalAlign: "middle" }} />
                <span className="text-muted-foreground">Carbs</span>
                <p className="font-medium tabular-nums">{total.carboidratos_g}g</p>
              </div>
              <div>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "oklch(0.50 0.15 15)", marginRight: 4, verticalAlign: "middle" }} />
                <span className="text-muted-foreground">Prot</span>
                <p className="font-medium tabular-nums">{total.proteinas_g}g</p>
              </div>
              <div>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "oklch(0.55 0.15 45)", marginRight: 4, verticalAlign: "middle" }} />
                <span className="text-muted-foreground">Gord</span>
                <p className="font-medium tabular-nums">{total.gorduras_g}g</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
