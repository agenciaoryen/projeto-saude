"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalDate, getLocalDateFromISO } from "@/lib/utils";
import { sumMacros, dailyQuality, mealTypeEmoji, mealTypeLabel, classificationLabel, classificationColor } from "@/lib/meal-utils";
import { MealCard } from "@/components/MealCard";
import { NutritionSummary } from "@/components/NutritionSummary";
import { Plus, ChevronRight } from "lucide-react";
import type { Meal } from "@/types";

type TabView = "dia" | "semana" | "mes";

export default function NutricaoPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>("dia");
  const [todayDisplay, setTodayDisplay] = useState("");

  useEffect(() => {
    setTodayDisplay(new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }));
  }, []);

  useEffect(() => {
    fetch("/api/meals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMeals(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filtra refeições de hoje (converte UTC → local)
  const todayMeals = useMemo(() => {
    const today = getLocalDate();
    return meals.filter((m) => getLocalDateFromISO(m.data_hora) === today);
  }, [meals]);

  // Agrupa refeições por dia local
  const mealsByDay = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      const dia = getLocalDateFromISO(m.data_hora);
      const arr = map.get(dia) || [];
      arr.push(m);
      map.set(dia, arr);
    }
    return map;
  }, [meals]);

  // Dados da semana (datas locais)
  const weekDays = useMemo(() => {
    const days: { date: string; label: string; meals: Meal[]; kcal: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateFromISO(d.toISOString());
      const dayMeals = mealsByDay.get(dateStr) || [];
      const kcal = sumMacros(dayMeals.filter((m) => m.macros)).calorias_kcal;
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }),
        meals: dayMeals,
        kcal,
      });
    }
    return days;
  }, [mealsByDay]);

  // Padrões detectados na semana
  const weekPatterns = useMemo(() => {
    const patterns: string[] = [];
    const weekMeals = meals.filter((m) => {
      const d = new Date(m.data_hora);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });

    const totalClass = weekMeals.filter((m) => m.classificacao === "alta_acucar").length;
    if (totalClass >= 4) patterns.push("Açúcar alto em " + totalClass + " dos últimos 7 dias");

    const totalGord = weekMeals.filter((m) => m.classificacao === "alta_gordura").length;
    if (totalGord >= 4) patterns.push("Gordura alta em " + totalGord + " dos últimos 7 dias");

    const totalEqui = weekMeals.filter((m) => m.classificacao === "equilibrada").length;
    if (totalEqui >= 5) patterns.push("Maioria das refeições equilibradas — ótimo!");

    return patterns;
  }, [meals]);

  // Dados do mês
  const monthStats = useMemo(() => {
    const now = new Date();
    const monthMeals = meals.filter((m) => {
      const d = new Date(m.data_hora);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const analyzed = monthMeals.filter((m) => m.macros);
    const total = sumMacros(analyzed);
    const avgKcal = analyzed.length > 0 ? Math.round(total.calorias_kcal / analyzed.length) : 0;

    const classCount = new Map<string, number>();
    for (const m of monthMeals) {
      if (m.classificacao) {
        classCount.set(m.classificacao, (classCount.get(m.classificacao) || 0) + 1);
      }
    }

    return { total: analyzed.length, avgKcal, classCount };
  }, [meals]);

  const todayQuality = dailyQuality(todayMeals);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("nutricao")}</h1>
          <p className="text-muted-foreground text-sm">{todayDisplay}</p>
        </div>
        <Button
          size="icon"
          className="rounded-full size-10"
          onClick={() => router.push("/nutricao/registrar")}
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1">
        {(["dia", "semana", "mes"] as TabView[]).map((tview) => (
          <button
            key={tview}
            type="button"
            onClick={() => setTab(tview)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === tview ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tview === "dia" ? "Dia" : tview === "semana" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>

      {/* ========== VISÃO DIÁRIA ========== */}
      {tab === "dia" && (
        <div className="space-y-6">
          {/* Indicador de qualidade */}
          {todayMeals.length > 0 && (
            <div className={`text-center py-3 rounded-xl text-sm font-medium ${
              todayQuality === "bom" ? "bg-green-50 text-green-700" :
              todayQuality === "atencao" ? "bg-yellow-50 text-yellow-700" :
              "bg-muted text-muted-foreground"
            }`}>
              {todayQuality === "bom" ? t("qualidade_bom") :
               todayQuality === "atencao" ? t("qualidade_atencao") :
               t("qualidade_sem_dados")}
            </div>
          )}

          <NutritionSummary meals={todayMeals} label={t("resumo_do_dia")} />

          {/* Lista de refeições */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("refeicoes_hoje")}</p>
            {todayMeals.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
                <CardContent className="py-8 text-center space-y-4">
                  <div className="text-4xl">🍽️</div>
                  <div>
                    <p className="font-medium">{t("nenhuma_refeicao")}</p>
                    <p className="text-sm text-muted-foreground">{t("registre_primeira")}</p>
                  </div>
                  <Button className="rounded-xl" onClick={() => router.push("/nutricao/registrar")}>
                    {t("registrar_refeicao")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              todayMeals
                .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
                .map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))
            )}
          </div>
        </div>
      )}

      {/* ========== VISÃO SEMANAL ========== */}
      {tab === "semana" && (
        <div className="space-y-6">
          <NutritionSummary
            meals={weekDays.flatMap((d) => d.meals)}
            label={t("resumo_do_dia")}
          />

          {/* Gráfico de calorias por dia */}
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-4">{t("calorias_por_dia")}</p>
              <div className="flex items-end justify-between gap-1 h-32">
                {weekDays.map((day) => {
                  const maxKcal = Math.max(...weekDays.map((d) => d.kcal), 1);
                  const heightPct = Math.max(4, (day.kcal / maxKcal) * 100);
                  const isToday = day.date === getLocalDate();
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium">{day.kcal}</span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isToday ? "bg-primary" : "bg-primary/30"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className={`text-[10px] ${isToday ? "font-semibold" : "text-muted-foreground"}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Padrões detectados */}
          {weekPatterns.length > 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">{t("padroes_detectados")}</p>
                {weekPatterns.map((p, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {p}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {weekPatterns.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("sem_dados_suficientes")}
            </p>
          )}

          {/* Lista de refeições da semana */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Refeições da semana</p>
            {weekDays.flatMap((d) => d.meals).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("nenhuma_refeicao")}</p>
            ) : (
              weekDays
                .filter((d) => d.meals.length > 0)
                .reverse()
                .map((day) => (
                  <div key={day.date} className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    {day.meals
                      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
                      .map((meal) => (
                        <MealCard key={meal.id} meal={meal} />
                      ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========== VISÃO MENSAL ========== */}
      {tab === "mes" && (
        <div className="space-y-6">
          <NutritionSummary
            meals={meals.filter((m) => {
              const d = new Date(m.data_hora);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })}
            label="Resumo do mês"
          />

          {/* Estatísticas do mês */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <p className="text-sm font-medium">{t("visao_mensal")}</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold">{monthStats.total}</p>
                  <p className="text-xs text-muted-foreground">{monthStats.total === 1 ? "Refeição analisada" : "Refeições analisadas"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-2xl font-bold">{monthStats.avgKcal}</p>
                  <p className="text-xs text-muted-foreground">Média kcal/refeição</p>
                </div>
              </div>

              {monthStats.classCount.size > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Classificações mais frequentes</p>
                  {[...monthStats.classCount.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([classif, count]) => (
                      <div key={classif} className="flex items-center justify-between text-sm">
                        <Badge className={classificationColor(classif as Meal["classificacao"] & string)}>
                          {classificationLabel(classif as Meal["classificacao"] & string)}
                        </Badge>
                        <span className="text-muted-foreground">{count}x</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {monthStats.total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("sem_dados_suficientes")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
