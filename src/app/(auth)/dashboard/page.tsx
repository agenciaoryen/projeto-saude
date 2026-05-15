"use client";

import { useEffect, useState } from "react";
import { getLocalDate, calculateStreak } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakBadge } from "@/components/StreakBadge";
import { MoodChart } from "@/components/MoodChart";
import { GardenView } from "@/components/GardenView";
import { StatsView } from "@/components/StatsView";
import { MayaNudge } from "@/components/MayaNudge";
import { PorqueCard } from "@/components/PorqueCard";
import { NutritionMiniCard } from "@/components/NutritionMiniCard";
import { useTranslation } from "@/lib/useTranslation";
import type { CheckIn, UserAchievement } from "@/types";


const HABIT_DISPLAY: Record<string, [string, string]> = {
  took_medication: ["💊", "Remédios"],
  talked_to_someone: ["🗣️", "Conversou"],
  meditation_prayer_breathing: ["🧘", "Meditou/Orou"],
  creative_activity: ["🎨", "Criatividade"],
  ate_well: ["🍽️", "Comeu bem"],
  bowel_movement: ["🚽", "Fez cocô"],
  exercise_walk: ["🏃", "Exercício"],
  drank_water: ["💧", "Água 1L"],
  slept_well: ["😴", "Dormiu bem"],
  felt_judged: ["⚖️", "Julgada(o)"],
  did_something_enjoyable: ["😊", "Algo que gostou"],
  worked_on_goals: ["🎯", "Metas"],
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [gender, setGender] = useState<string>("nao_dizer");
  const [loading, setLoading] = useState(true);
  const [todayDisplay, setTodayDisplay] = useState("");

  useEffect(() => {
    setTodayDisplay(new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/check-ins").then((r) => r.json()),
      fetch("/api/preferences").then((r) => r.json()),
      fetch("/api/achievements").then((r) => r.json()),
    ]).then(([checkInsData, prefsData, achievementsData]) => {
      if (!prefsData.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
      setEnabledKeys(prefsData.enabled_questions || []);
      setGender(prefsData.context?.gender || "nao_dizer");
      if (Array.isArray(checkInsData)) {
        setCheckIns(checkInsData);
        const today = getLocalDate();
        setTodayCheckIn(checkInsData.find((c: CheckIn) => c.date === today) || null);
      }
      if (Array.isArray(achievementsData)) {
        setAchievements(achievementsData);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  const streak = calculateStreak(checkIns.map((c: CheckIn) => c.date));

  const enabledNonSuicidal = enabledKeys.filter((k) => k !== "suicidal_thoughts" && k !== "felt_judged");
  const totalHabits = enabledNonSuicidal.length;

  const positiveCount = todayCheckIn
    ? enabledNonSuicidal.filter((k) => {
        return (todayCheckIn as Record<string, unknown>)[k] === true;
      }).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("ola")}</h1>
        <p className="text-muted-foreground text-sm">{todayDisplay}</p>
      </div>

      <MayaNudge />

      <PorqueCard gender={gender} />

      <NutritionMiniCard />

      {!todayCheckIn ? (
        <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-4xl">📝</div>
            <div>
              <p className="font-medium">{t("sem_checkin")}</p>
              <p className="text-sm text-muted-foreground">{t("leva_menos_3min")}</p>
            </div>
            <Button size="lg" className="rounded-xl" onClick={() => router.push("/check-in")}>
              {t("fazer_checkin")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("checkin_hoje_feito")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de progresso */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  🌱 <span className="font-medium text-foreground">{positiveCount}</span> {t("cuidados_hoje")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {positiveCount}/{totalHabits}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${totalHabits > 0 ? (positiveCount / totalHabits) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Chips do que foi feito */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                ✅ O que você fez hoje
              </p>
              <div className="flex flex-wrap gap-1.5">
                {enabledNonSuicidal.map((key) => {
                  const value = (todayCheckIn as Record<string, unknown>)[key] === true;
                  const [emoji, label] = HABIT_DISPLAY[key] || ["•", key];
                  if (!value) return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    >
                      {emoji} {label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* O que não foi feito — sutil, sem culpa */}
            {enabledNonSuicidal.filter((k) => (todayCheckIn as Record<string, unknown>)[k] !== true).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground/60">
                  Amanhã é outro dia...
                </p>
                <div className="flex flex-wrap gap-1">
                  {enabledNonSuicidal.map((key) => {
                    const value = (todayCheckIn as Record<string, unknown>)[key] === true;
                    const [emoji] = HABIT_DISPLAY[key] || ["•"];
                    if (value) return null;
                    return (
                      <span key={key} className="text-sm opacity-40" title={HABIT_DISPLAY[key]?.[1]}>
                        {emoji}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sentimento + Gratidão lado a lado ou empilhados */}
            <div className="space-y-2.5">
              {todayCheckIn.feeling && (
                <div className="p-3 rounded-xl bg-secondary/40 dark:bg-secondary/20 border border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                    💬 {t("como_se_sente")}
                  </p>
                  <p className="text-sm leading-relaxed">{todayCheckIn.feeling}</p>
                </div>
              )}
              {todayCheckIn.gratitude && (
                <div className="p-3 rounded-xl bg-accent/30 dark:bg-accent/10 border border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                    🙏 {t("gratidao")}
                  </p>
                  <p className="text-sm leading-relaxed italic">{todayCheckIn.gratitude}</p>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => router.push("/check-in")}>
              {t("editar_checkin")}
            </Button>
          </CardContent>
        </Card>
      )}

      <StreakBadge streak={streak} />

      {gender === "masculino" ? (
        <StatsView
          streak={streak}
          achievements={achievements}
          totalCheckIns={checkIns.length}
        />
      ) : (
        <GardenView
          streak={streak}
          achievements={achievements}
          totalCheckIns={checkIns.length}
        />
      )}

      {checkIns.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">{t("evolucao")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodChart checkIns={checkIns} enabledKeys={enabledKeys} />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{t("ultimos_checkins")}</CardTitle>
        </CardHeader>
        <CardContent>
          {checkIns.slice(0, 7).map((ci) => (
            <div
              key={ci.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">
                {new Date(ci.date + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                {ci.feeling
                  ? ci.feeling.slice(0, 30) + (ci.feeling.length > 30 ? "..." : "")
                  : "—"}
              </span>
            </div>
          ))}
          {checkIns.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("nenhum_checkin")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
