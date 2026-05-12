"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CheckIn } from "@/types";

const HISTORICO_DISPLAY: Record<string, string> = {
  took_medication: "💊",
  talked_to_someone: "🗣️",
  meditation_prayer_breathing: "🧘",
  creative_activity: "🎨",
  ate_well: "🍽️",
  bowel_movement: "🚽",
  exercise_walk: "🏃",
  drank_water: "💧",
  slept_well: "😴",
  felt_judged: "⚖️",
  did_something_enjoyable: "😊",
  worked_on_goals: "🎯",
};

function getScoreForCheckIn(ci: CheckIn, enabledKeys: string[]) {
  const scoreKeys = enabledKeys.filter((k) => k !== "suicidalThoughts");
  return scoreKeys.filter((k) => {
    const camelKey = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    return (ci as Record<string, unknown>)[camelKey] === true;
  }).length;
}

export default function HistoricoPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/check-ins").then((r) => r.json()),
      fetch("/api/preferences").then((r) => r.json()),
    ]).then(([checkInsData, prefsData]) => {
      setEnabledKeys(prefsData.enabled_questions || []);
      if (Array.isArray(checkInsData)) {
        setCheckIns(
          checkInsData.sort(
            (a: CheckIn, b: CheckIn) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalHabits = enabledKeys.filter((k) => k !== "suicidalThoughts").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""} registrado
          {checkIns.length !== 1 ? "s" : ""}
        </p>
      </div>

      {checkIns.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-4xl">📋</div>
            <p className="text-muted-foreground">Nenhum check-in registrado ainda.</p>
            <Button size="lg" className="rounded-xl" onClick={() => router.push("/check-in")}>
              Fazer primeiro check-in
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkIns.map((ci) => {
            const score = getScoreForCheckIn(ci, enabledKeys);

            return (
              <Card key={ci.id} className="rounded-2xl hover:bg-secondary/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {new Date(ci.date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {score}/{totalHabits}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    {enabledKeys
                      .filter((k) => k !== "suicidalThoughts")
                      .map((key) => {
                        const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
                        const val = (ci as Record<string, unknown>)[camelKey] === true;
                        const emoji = HISTORICO_DISPLAY[key] || "•";
                        return (
                          <span key={key} className={val ? "" : "opacity-30"}>
                            {emoji}
                          </span>
                        );
                      })}
                  </div>
                  {ci.feeling && (
                    <p className="text-sm mt-2 text-muted-foreground line-clamp-1">
                      "{ci.feeling}"
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-1 rounded-xl" onClick={() => router.push(`/check-in/${ci.id}`)}>
                    Ver detalhes
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
