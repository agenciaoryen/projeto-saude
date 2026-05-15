"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalDate } from "@/lib/utils";
import { sumMacros, nutritionScore } from "@/lib/meal-utils";
import { useTranslation } from "@/lib/useTranslation";
import type { Meal } from "@/types";

export function NutritionMiniCard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = getLocalDate();
    fetch(`/api/meals?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMeals(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const analyzed = meals.filter((m) => m.macros && m.status_analise === "analisado");
  const pending = meals.filter((m) => !m.macros || m.status_analise !== "analisado");
  const total = sumMacros(analyzed);

  // Sem refeições
  if (meals.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-primary/30 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => router.push("/nutricao/registrar")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t("registre_primeira")}</p>
              <p className="text-xs text-muted-foreground">{t("leva_menos_3min")}</p>
            </div>
            <span className="text-muted-foreground text-sm">+</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tem refeições mas nenhuma analisada
  if (analyzed.length === 0) {
    return (
      <Card className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
        onClick={() => router.push("/nutricao")}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {meals.length} {meals.length > 1 ? "refeições" : "refeição"} {t("pendente_analise").toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">Toque para analisar</p>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Refeições analisadas — card completo
  const score = nutritionScore(analyzed);
  const scoreColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const scoreBg = score >= 80 ? "stroke-emerald-500" : score >= 60 ? "stroke-amber-500" : "stroke-red-500";
  const ringLen = 94.2; // 2 * PI * 15 ≈ 94.2
  const dashLen = (score / 100) * ringLen;

  return (
    <Card className="rounded-2xl hover:bg-muted/5 transition-colors cursor-pointer"
      onClick={() => router.push("/nutricao")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">🍽️ {t("nutricao")} {t("resumo_do_dia").toLowerCase()}</p>
          <span className="text-xs text-muted-foreground">{t("ver_refeicoes")}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Anel de score */}
          <div className="relative size-14 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/20" />
              <circle cx="18" cy="18" r="15" fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${dashLen} ${ringLen}`}
                strokeLinecap="round"
                className={scoreBg} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor}`}>
              {score}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold tracking-tight">
              {total.calorias_kcal} <span className="text-sm font-normal text-muted-foreground">kcal</span>
            </p>
            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
              <span>C: {total.carboidratos_g}g</span>
              <span>P: {total.proteinas_g}g</span>
              <span>G: {total.gorduras_g}g</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{analyzed.length} {analyzed.length > 1 ? "refeições" : "refeição"}</span>
          {pending.length > 0 && (
            <>
              <span>·</span>
              <span>{pending.length} {t("pendente_analise").toLowerCase()}</span>
            </>
          )}
          {score >= 80 ? " · 🌟" : score >= 60 ? " · 👍" : " · 💡"}
        </div>
      </CardContent>
    </Card>
  );
}
