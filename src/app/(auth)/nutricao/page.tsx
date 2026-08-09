"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalDate, getLocalDateFromISO, getWeekMondayDate, getWeekSundayDate } from "@/lib/utils";
import { cachedFetch } from "@/lib/fetch-cache";
import { sumMacros, dailyQuality, nutritionScore, mealTypeEmoji, mealTypeLabel, classificationLabel, classificationColor, getDailyKcalGoal, DEFAULT_DAILY_KCAL } from "@/lib/meal-utils";
import { MealCard } from "@/components/MealCard";
import { NutritionSummary } from "@/components/NutritionSummary";
import { WeeklyReport } from "@/components/WeeklyReport";
import { QuickAddMeals } from "@/components/QuickAddMeals";
import { NutritionTips } from "@/components/NutritionTips";
import { NutritionGoalCard } from "@/components/NutritionGoalCard";
import { NutritionChat } from "@/components/NutritionChat";
import { MonthlyReport } from "@/components/MonthlyReport";
import { FoodMoodCorrelation } from "@/components/FoodMoodCorrelation";
import { WeeklyMirror } from "@/components/WeeklyMirror";
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
    cachedFetch<{ context?: Record<string, unknown> }>("/api/preferences")
      .then((data) => {
        const ctx = (data?.context as Record<string, unknown>) || {};
        setKcalGoal(getDailyKcalGoal(ctx));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    cachedFetch<unknown[]>("/api/meals")
      .then((data) => {
        if (Array.isArray(data)) setMeals(data as Meal[]);
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

  // Dados da semana atual (Seg–Dom)
  const weekDays = useMemo(() => {
    const mondayDate = getWeekMondayDate();
    const days: { date: string; label: string; meals: Meal[]; kcal: number; score: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate + "T12:00:00");
      d.setDate(d.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayMeals = mealsByDay.get(dateStr) || [];
      const analyzed = dayMeals.filter((m) => m.macros && m.status_analise === "analisado");
      const kcal = sumMacros(dayMeals.filter((m) => m.macros)).calorias_kcal;
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("pt-BR", { weekday: "short" }),
        meals: dayMeals,
        kcal,
        score: nutritionScore(analyzed),
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
    if (freq < 3) issues.push("Poucas refeições registradas (ideal: 3+). Se comeu mais, vale anotar para uma análise mais fiel.");

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
      <div
        style={{
          minHeight: "100dvh",
          background: `radial-gradient(ellipse 80% 50% at 80% 0%, oklch(.58 .18 270 / .15) 0%, transparent 55%),
                       linear-gradient(180deg, oklch(.12 .012 270) 0%, oklch(.15 .015 270) 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("carregando")}</p>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden pb-32"
      style={{
        background: `
          radial-gradient(ellipse 100% 55% at 80% 0%, oklch(.58 .18 270 / .15) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 0% 100%, oklch(.58 .18 270 / .1) 0%, transparent 50%),
          linear-gradient(180deg, oklch(.12 .012 270) 0%, oklch(.15 .015 270) 100%)
        `,
        fontFamily: "var(--font-sans)",
        color: "var(--foreground)",
      }}
    >
      {/* Floating + button */}
      <button
        type="button"
        onClick={() => router.push("/nutricao/registrar")}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 10,
          width: 44, height: 44, borderRadius: "50%",
          background: "#7C5CFF", border: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(124,92,255,0.4)",
          color: "#fff",
        }}
        aria-label="Registrar refeição"
      >
        <Plus size={20} />
      </button>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {todayDisplay}
        </p>
        <h1 className="mt-1 text-[36px] font-bold tracking-tight leading-[1.05]">
          Nutrição
        </h1>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-4">
        <div
          className="inline-flex w-full p-1 rounded-2xl"
          style={{
            background: "oklch(.16 .012 270 / .55)",
            backdropFilter: "blur(8px)",
            border: "1px solid oklch(.28 .02 270 / .5)",
          }}
        >
          {(["dia", "semana", "mes"] as TabView[]).map((tview) => (
            <button
              key={tview}
              type="button"
              onClick={() => setTab(tview)}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
              style={{
                background: tab === tview ? "var(--primary)" : "transparent",
                color: tab === tview ? "#fff" : "var(--muted-foreground)",
                boxShadow: tab === tview ? "0 2px 8px -2px oklch(.58 .18 270 / .35)" : "none",
                border: 0, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {tview === "dia" ? "Dia" : tview === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-5">

      {/* ========== VISÃO DIÁRIA ========== */}
      {tab === "dia" && (
        <div className="space-y-6">
          {/* Indicador de qualidade — clicável com diagnóstico */}
          {todayMeals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              style={{
                width: "100%", textAlign: "left", borderRadius: 12, cursor: "pointer",
                fontFamily: "inherit", transition: "all .15s ease",
                background: todayQuality === "bom"
                  ? "oklch(0.45 0.15 160 / 0.08)"
                  : todayQuality === "atencao"
                  ? "oklch(0.60 0.12 70 / 0.08)"
                  : "oklch(0.16 0.012 270 / 0.5)",
                border: todayQuality === "bom"
                  ? "1px solid oklch(0.45 0.15 160 / 0.15)"
                  : todayQuality === "atencao"
                  ? "1px solid oklch(0.60 0.12 70 / 0.15)"
                  : "1px solid oklch(.28 .02 270 / .25)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: todayQuality === "bom"
                    ? "oklch(0.45 0.15 160)"
                    : todayQuality === "atencao"
                    ? "oklch(0.60 0.12 70)"
                    : "#9e96b5",
                }}>
                  {todayQuality === "bom" ? t("qualidade_bom") :
                   todayQuality === "atencao" ? t("qualidade_atencao") :
                   t("qualidade_sem_dados")}
                </span>
                <ChevronDown style={{ width: 16, height: 16, color: "#9e96b5", transition: "transform .2s ease", transform: showQualityDetails ? "rotate(180deg)" : "rotate(0deg)" }} />
              </div>

              {showQualityDetails && qualityDiagnostic && todayQuality !== "sem_dados" && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                  {/* Score */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#9e96b5" }}>Score:</span>
                    <span style={{
                      fontWeight: 700,
                      color: qualityDiagnostic.score >= 80
                        ? "oklch(0.45 0.15 160)"
                        : qualityDiagnostic.score >= 60
                        ? "oklch(0.60 0.12 70)"
                        : "oklch(0.50 0.15 15)",
                    }}>
                      {qualityDiagnostic.score}/100
                    </span>
                    <span style={{ fontSize: 11, color: "#9e96b5" }}>
                      ({qualityDiagnostic.freq} {qualityDiagnostic.freq === 1 ? "refeição" : "refeições"})
                    </span>
                  </div>

                  {/* Balanço de macros */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>Distribuição de macros</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, textAlign: "center", fontSize: 11 }}>
                      <div style={{
                        borderRadius: 8, padding: "6px 0",
                        background: qualityDiagnostic.carbOk ? "oklch(0.45 0.15 160 / 0.10)" : "oklch(0.50 0.15 15 / 0.08)",
                        color: qualityDiagnostic.carbOk ? "oklch(0.45 0.15 160)" : "oklch(0.50 0.15 15)",
                        fontWeight: 600,
                      }}>
                        Carbs {qualityDiagnostic.carbPct}%
                      </div>
                      <div style={{
                        borderRadius: 8, padding: "6px 0",
                        background: qualityDiagnostic.protOk ? "oklch(0.45 0.15 160 / 0.10)" : "oklch(0.50 0.15 15 / 0.08)",
                        color: qualityDiagnostic.protOk ? "oklch(0.45 0.15 160)" : "oklch(0.50 0.15 15)",
                        fontWeight: 600,
                      }}>
                        Prot {qualityDiagnostic.protPct}%
                      </div>
                      <div style={{
                        borderRadius: 8, padding: "6px 0",
                        background: qualityDiagnostic.gordOk ? "oklch(0.45 0.15 160 / 0.10)" : "oklch(0.50 0.15 15 / 0.08)",
                        color: qualityDiagnostic.gordOk ? "oklch(0.45 0.15 160)" : "oklch(0.50 0.15 15)",
                        fontWeight: 600,
                      }}>
                        Gord {qualityDiagnostic.gordPct}%
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: "#9e96b5" }}>
                      Ideal: 40-65% carb · 15-30% prot · 15-35% gord
                    </p>
                  </div>

                  {/* Alertas específicos */}
                  {qualityDiagnostic.issues.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>O que melhorar</p>
                      {qualityDiagnostic.issues.map((issue, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 8, fontSize: 11,
                          color: "oklch(0.60 0.12 70)", background: "oklch(0.60 0.12 70 / 0.08)",
                          borderRadius: 8, padding: "4px 12px",
                        }}>
                          <span>⚠️</span> {issue}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Classificações do dia */}
                  {qualityDiagnostic.classCount.size > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>Classificações do dia</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {[...qualityDiagnostic.classCount.entries()].map(([classif, count]) => (
                          <Badge key={classif} className={`text-[10px] ${classificationColor(classif as Meal["classificacao"] & string)}`}>
                            {classificationLabel(classif as Meal["classificacao"] & string)} ({count}x)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayQuality === "bom" && qualityDiagnostic.issues.length === 0 && (
                    <p style={{
                      margin: 0, fontSize: 11, borderRadius: 8, padding: "8px 12px",
                      color: "oklch(0.45 0.15 160)", background: "oklch(0.45 0.15 160 / 0.10)",
                    }}>
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

          <FoodMoodCorrelation meals={meals} />

          <NutritionChat />

          {/* Lista de refeições */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("refeicoes_hoje")}</p>
            {todayMeals.length > 0 && todayMeals.length < 3 && new Date().getHours() >= 14 && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2.5 leading-relaxed">
                Você registrou {todayMeals.length} {todayMeals.length === 1 ? "refeição" : "refeições"} hoje — o resumo reflete apenas o que foi anotado. Se comeu mais, vale registrar para uma análise mais completa.
              </p>
            )}
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
          {/* Espelho da semana em destaque */}
          <WeeklyMirror />

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

          {/* Raio-X do mês */}
          <MonthlyReport meals={meals.filter((m) => {
            const d = new Date(m.data_hora);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          })} monthStats={monthStats} />

          {monthStats.total === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("sem_dados_suficientes")}
            </p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
