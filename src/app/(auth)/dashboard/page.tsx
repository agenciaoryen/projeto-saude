"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreakBadge } from "@/components/StreakBadge";
import { MoodChart } from "@/components/MoodChart";
import type { CheckIn } from "@/types";

function calculateStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  const latest = sorted[0]?.date;
  if (latest !== today && latest !== yesterday) return 0;

  let streak = 0;
  let checkDate = new Date(today);
  for (const ci of sorted) {
    const ciDate = new Date(ci.date).toISOString().split("T")[0];
    const expected = checkDate.toISOString().split("T")[0];
    if (ciDate === expected) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}

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
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/check-ins").then((r) => r.json()),
      fetch("/api/preferences").then((r) => r.json()),
    ]).then(([checkInsData, prefsData]) => {
      if (!prefsData.onboarding_completed) {
        router.push("/onboarding");
        return;
      }
      setEnabledKeys(prefsData.enabled_questions || []);
      if (Array.isArray(checkInsData)) {
        setCheckIns(checkInsData);
        const today = new Date().toISOString().split("T")[0];
        setTodayCheckIn(checkInsData.find((c: CheckIn) => c.date === today) || null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const streak = calculateStreak(checkIns);

  const enabledNonSuicidal = enabledKeys.filter((k) => k !== "suicidalThoughts");
  const totalHabits = enabledNonSuicidal.length;

  const positiveCount = todayCheckIn
    ? enabledNonSuicidal.filter((k) => {
        const camelKey = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
        return (todayCheckIn as Record<string, unknown>)[camelKey] === true;
      }).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá! 🌱</h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {!todayCheckIn ? (
        <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-4xl">📝</div>
            <div>
              <p className="font-medium">Você ainda não fez o check-in de hoje</p>
              <p className="text-sm text-muted-foreground">Leva menos de 3 minutos</p>
            </div>
            <Button size="lg" className="rounded-xl" onClick={() => router.push("/check-in")}>
              Fazer check-in
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Check-in de hoje ✅</CardTitle>
            <Badge variant="secondary">
              {positiveCount}/{totalHabits} hábitos
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {enabledNonSuicidal.map((key) => {
                const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
                const value = (todayCheckIn as Record<string, unknown>)[camelKey] === true;
                const [emoji, label] = HABIT_DISPLAY[key] || ["•", camelKey];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      value ? "bg-primary/10" : "bg-muted/50 opacity-50"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className={value ? "font-medium" : ""}>{label}</span>
                  </div>
                );
              })}
            </div>
            {todayCheckIn.feeling && (
              <div className="mt-4 p-3 bg-secondary/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">
                  Como se sente:
                </p>
                <p className="text-sm">{todayCheckIn.feeling}</p>
              </div>
            )}
            {todayCheckIn.gratitude && (
              <div className="mt-2 p-3 bg-accent/20 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Gratidão:</p>
                <p className="text-sm italic">{todayCheckIn.gratitude}</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => router.push("/check-in")}>
              Editar check-in de hoje
            </Button>
          </CardContent>
        </Card>
      )}

      <StreakBadge streak={streak} />

      {checkIns.length > 1 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Evolução</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodChart checkIns={checkIns} enabledKeys={enabledKeys} />
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Últimos check-ins</CardTitle>
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
              Nenhum check-in ainda. Comece hoje!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
