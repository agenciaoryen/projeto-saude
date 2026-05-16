"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalDate, getLocalDateFromISO } from "@/lib/utils";
import { sumMacros, dailyQuality, nutritionScore, mealTypeEmoji, mealTypeLabel, classificationLabel, classificationColor, getDailyKcalGoal, DEFAULT_DAILY_KCAL } from "@/lib/meal-utils";
import { MealCard } from "@/components/MealCard";
import { NutritionSummary } from "@/components/NutritionSummary";
import { WeeklyReport } from "@/components/WeeklyReport";
import { QuickAddMeals } from "@/components/QuickAddMeals";
import { NutritionTips } from "@/components/NutritionTips";
import { NutritionGoalCard } from "@/components/NutritionGoalCard";
import { Plus, ChevronDown } from "lucide-react";
import type { Meal } from "@/types";

type TabView = "dia" | "semana" | "mes";

export default function NutricaoPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>("dia");
  const [todayDisplay, setTodayDisplay] = useState("");
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [kcalGoal, setKcalGoal] = useState(DEFAULT_DAILY_KCAL);

  useEffect(() => {
    setTodayDisplay(new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }));
  }, []);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        const ctx = (data.context as Record<string, unknown>) || {};
        setKcalGoal(getDailyKcalGoal(ctx));
      })
      .catch(() => {});
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

  // Diagnóstico detalhado para o alerta de qualidade
  const qualityDiagnostic = useMemo(() => {
    const analyzed = todayMeals.filter((m) => m.macros && m.status_analise === "analisado");
    if (analyzed.length === 0) return null;

    const total = sumMacros(analyzed);
    const totalG = total.carboidratos_g + total.proteinas_g + total.gorduras_g;
    const carbPct = totalG > 0 ? Math.round((total.carboidratos_g / totalG) * 100) : 0;
    const protPct = totalG > 0 ? Math.round((total.proteinas_g / totalG) * 100) : 0;
    const gordPct = totalG > 0 ? Math.round((total.gorduras_g / totalG) * 100) : 0;

    const score = nutritionScore(analyzed);
    const freq = analyzed.length;

    const carbOk = carbPct >= 40 && carbPct <= 65;
    const protOk = protPct >= 15 && protPct <= 30;
    const gordOk = gordPct >= 15 && gordPct <= 35;

    const issues: string[] = [];
    if (!carbOk) issues.push(carbPct > 65 ? "Carboidratos acima do ideal" : "Carboidratos abaixo do ideal");
    if (!protOk) issues.push(protPct < 15 ? "Proteína abaixo do ideal" : "Proteína acima do ideal");
    if (!gordOk) issues.push(gordPct > 35 ? "Gorduras acima do ideal" : "Gorduras abaixo do ideal");
    if (freq < 3) issues.push("Poucas refeições no dia (ideal: 3-4)");

    const classCount = new Map<string, number>();
    for (const m of todayMeals) {
      if (m.classificacao) {
        classCount.set(m.classificacao, (classCount.get(m.classificacao) || 0) + 1);
      }
    }

    const highSugar = classCount.get("alta_acucar") || 0;
    const highFat = classCount.get("alta_gordura") || 0;

    return { carbPct, protPct, gordPct, score, freq, issues, carbOk, protOk, gordOk, highSugar, highFat, classCount };
  }, [todayMeals]);

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
          {/* Indicador de qualidade — clicável com diagnóstico */}
          {todayMeals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              className={`w-full text-left rounded-xl transition-all ${
                todayQuality === "bom" ? "bg-green-50 hover:bg-green-100" :
                todayQuality === "atencao" ? "bg-yellow-50 hover:bg-yellow-100" :
                "bg-muted hover:bg-muted/70"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className={`text-sm font-medium ${
                  todayQuality === "bom" ? "text-green-700" :
                  todayQuality === "atencao" ? "text-yellow-700" :
                  "text-muted-foreground"
                }`}>
                  {todayQuality === "bom" ? t("qualidade_bom") :
                   todayQuality === "atencao" ? t("qualidade_atencao") :
                   t("qualidade_sem_dados")}
                </span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${showQualityDetails ? "rotate-180" : ""}`} />
              </div>

              {showQualityDetails && qualityDiagnostic && todayQuality !== "sem_dados" && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                  {/* Score */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Score:</span>
                    <span className={`font-bold ${qualityDiagnostic.score >= 80 ? "text-emerald-600" : qualityDiagnostic.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                      {qualityDiagnostic.score}/100
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({qualityDiagnostic.freq} {qualityDiagnostic.freq === 1 ? "refeição" : "refeições"})
                    </span>
                  </div>

                  {/* Balanço de macros */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Distribuição de macros</p>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className={`rounded-lg py-1.5 ${qualityDiagnostic.carbOk ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                        Carbs {qualityDiagnostic.carbPct}%
                      </div>
                      <div className={`rounded-lg py-1.5 ${qualityDiagnostic.protOk ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                        Prot {qualityDiagnostic.protPct}%
                      </div>
                      <div className={`rounded-lg py-1.5 ${qualityDiagnostic.gordOk ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                        Gord {qualityDiagnostic.gordPct}%
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ideal: 40-65% carb · 15-30% prot · 15-35% gord
                    </p>
                  </div>

                  {/* Alertas específicos */}
                  {qualityDiagnostic.issues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">O que melhorar</p>
                      {qualityDiagnostic.issues.map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-3 py-1.5">
                          <span>⚠️</span> {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Classificações do dia */}
                  {qualityDiagnostic.classCount.size > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Classificações do dia</p>
                      <div className="flex flex-wrap gap-1">
                        {[...qualityDiagnostic.classCount.entries()].map(([classif, count]) => (
                          <Badge key={classif} className={`text-[10px] ${classificationColor(classif as Meal["classificacao"] & string)}`}>
                            {classificationLabel(classif as Meal["classificacao"] & string)} ({count}x)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayQuality === "bom" && qualityDiagnostic.issues.length === 0 && (
                    <p className="text-xs text-green-700 bg-green-100 rounded-lg px-3 py-2">
                      Continue assim! Seus macros estão equilibrados e a frequência de refeições está boa.
                    </p>
                  )}
                </div>
              )}
            </button>
          )}

          <NutritionGoalCard />
          <NutritionSummary meals={todayMeals} label={t("resumo_do_dia")} kcalGoal={kcalGoal} />

          <QuickAddMeals meals={meals} />

          <NutritionTips />

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
                  <MealCard key={meal.id} meal={meal} onClick={() => router.push(`/nutricao/${meal.id}`)} />
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
            label={t("resumo_da_semana")}
            kcalGoal={kcalGoal}
          />

          {/* Relatório semanal inteligente */}
          <WeeklyReport meals={meals} weekDays={weekDays} />

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
                        <MealCard key={meal.id} meal={meal} onClick={() => router.push(`/nutricao/${meal.id}`)} />
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
            label={t("resumo_do_mes")}
            kcalGoal={kcalGoal}
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
