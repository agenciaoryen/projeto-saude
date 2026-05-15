import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { sumMacros, nutritionScore, mealTypeLabel, mealTypeEmoji } from "@/lib/meal-utils";
import { getLocalDate, getLocalDateFromISO } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Meal, MealType } from "@/types";

interface WeekDay {
  date: string;
  label: string;
  meals: Meal[];
  kcal: number;
  score: number;
}

export function WeeklyReport({ meals, weekDays }: { meals: Meal[]; weekDays: WeekDay[] }) {
  // Semana atual vs anterior
  const { thisWeekAvg, lastWeekAvg, trend, trendPct } = useMemo(() => {
    const today = new Date();
    const thisWeekKcals: number[] = [];
    const lastWeekKcals: number[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateFromISO(d.toISOString());
      const dayMeals = meals.filter((m) => getLocalDateFromISO(m.data_hora) === dateStr);
      const kcal = sumMacros(dayMeals.filter((m) => m.macros)).calorias_kcal;
      if (i < 7) thisWeekKcals.push(kcal);
    }

    for (let i = 7; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateFromISO(d.toISOString());
      const dayMeals = meals.filter((m) => getLocalDateFromISO(m.data_hora) === dateStr);
      const kcal = sumMacros(dayMeals.filter((m) => m.macros)).calorias_kcal;
      lastWeekKcals.push(kcal);
    }

    const thisWeekFiltered = thisWeekKcals.filter((k) => k > 0);
    const lastWeekFiltered = lastWeekKcals.filter((k) => k > 0);
    const avg1 = thisWeekFiltered.length > 0 ? Math.round(thisWeekFiltered.reduce((a, b) => a + b, 0) / thisWeekFiltered.length) : 0;
    const avg2 = lastWeekFiltered.length > 0 ? Math.round(lastWeekFiltered.reduce((a, b) => a + b, 0) / lastWeekFiltered.length) : 0;

    let t: "up" | "down" | "flat" = "flat";
    let pct = 0;
    if (avg1 > 0 && avg2 > 0) {
      pct = Math.round(((avg1 - avg2) / avg2) * 100);
      t = pct > 5 ? "up" : pct < -5 ? "down" : "flat";
    }

    return { thisWeekAvg: avg1, lastWeekAvg: avg2, trend: t, trendPct: Math.abs(pct) };
  }, [meals]);

  // Distribuição por tipo de refeição
  const mealTypeDist = useMemo(() => {
    const map = new Map<MealType, { kcal: number; count: number }>();
    const weekMeals = meals.filter((m) => {
      const diff = (new Date().getTime() - new Date(m.data_hora).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });

    for (const m of weekMeals) {
      if (!m.macros) continue;
      const entry = map.get(m.tipo_refeicao) || { kcal: 0, count: 0 };
      entry.kcal += m.macros.calorias_kcal;
      entry.count += 1;
      map.set(m.tipo_refeicao, entry);
    }

    const totalKcal = [...map.values()].reduce((s, e) => s + e.kcal, 0);
    return [...map.entries()]
      .map(([tipo, data]) => ({
        tipo,
        emoji: mealTypeEmoji(tipo),
        label: mealTypeLabel(tipo),
        kcal: data.kcal,
        count: data.count,
        pct: totalKcal > 0 ? Math.round((data.kcal / totalKcal) * 100) : 0,
      }))
      .sort((a, b) => b.kcal - a.kcal);
  }, [meals]);

  // Itens mais frequentes
  const topItems = useMemo(() => {
    const itemMap = new Map<string, number>();
    const weekMeals = meals.filter((m) => {
      const diff = (new Date().getTime() - new Date(m.data_hora).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7 && m.itens;
    });

    for (const m of weekMeals) {
      for (const item of m.itens || []) {
        const name = item.nome.toLowerCase().trim();
        if (name.length < 2) continue;
        itemMap.set(name, (itemMap.get(name) || 0) + 1);
      }
    }

    return [...itemMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [meals]);

  // Melhor e pior dia
  const { bestDay, worstDay } = useMemo(() => {
    let best: WeekDay | null = null;
    let worst: WeekDay | null = null;

    for (const day of weekDays) {
      const analyzed = day.meals.filter((m) => m.macros && m.status_analise === "analisado");
      if (analyzed.length === 0) continue;
      const score = nutritionScore(analyzed);
      if (!best || score > (nutritionScore(best.meals.filter((m) => m.macros && m.status_analise === "analisado")) || 0)) {
        best = { ...day, score };
      }
      if (!worst || score < (nutritionScore(worst.meals.filter((m) => m.macros && m.status_analise === "analisado")) || 100)) {
        worst = { ...day, score };
      }
    }

    return { bestDay: best, worstDay: worst };
  }, [weekDays]);

  const hasWeekData = weekDays.some((d) => d.kcal > 0);

  if (!hasWeekData) return null;

  return (
    <div className="space-y-3">
      {/* Tendência semanal */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">📊 Comparação semanal</p>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Esta semana</p>
              <p className="text-xl font-bold tabular-nums">{thisWeekAvg}</p>
              <p className="text-xs text-muted-foreground">kcal/dia</p>
            </div>

            <div className="flex flex-col items-center px-4">
              {trend === "up" ? (
                <TrendingUp className="size-5 text-amber-500" />
              ) : trend === "down" ? (
                <TrendingDown className="size-5 text-emerald-500" />
              ) : (
                <Minus className="size-5 text-muted-foreground" />
              )}
              {trendPct > 0 && (
                <span className={`text-xs font-medium mt-0.5 ${trend === "up" ? "text-amber-500" : "text-emerald-500"}`}>
                  {trendPct}%
                </span>
              )}
            </div>

            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Semana passada</p>
              <p className="text-lg font-semibold tabular-nums text-muted-foreground">{lastWeekAvg}</p>
              <p className="text-xs text-muted-foreground">kcal/dia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Melhor / Pior dia */}
      {(bestDay || worstDay) && (
        <div className="grid grid-cols-2 gap-2">
          {bestDay && (
            <Card className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">🌟 Melhor dia</p>
                <p className="text-sm font-medium">{new Date(bestDay.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })}</p>
                <p className="text-lg font-bold text-emerald-600">{bestDay.score}</p>
              </CardContent>
            </Card>
          )}
          {worstDay && (
            <Card className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border-amber-200">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">💡 A melhorar</p>
                <p className="text-sm font-medium">{new Date(worstDay.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })}</p>
                <p className="text-lg font-bold text-amber-600">{worstDay.score}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Distribuição por tipo de refeição */}
      {mealTypeDist.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">🍽️ Distribuição por refeição</p>
            {mealTypeDist.map((d) => (
              <div key={d.tipo} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{d.emoji} {d.label}</span>
                  <span className="text-muted-foreground text-xs">{d.kcal} kcal · {d.pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all"
                    style={{ width: `${Math.max(d.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Itens mais frequentes */}
      {topItems.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">🔁 O que mais apareceu</p>
            <div className="flex flex-wrap gap-1.5">
              {topItems.map(([nome, count]) => (
                <span key={nome} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                  {nome} <span className="font-medium text-foreground">{count}x</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
