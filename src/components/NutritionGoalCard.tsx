"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, ChevronDown } from "lucide-react";

type Objective = "perder_peso" | "manter" | "ganhar_massa" | "melhorar_habitos";

const OBJECTIVES: { id: Objective; label: string; emoji: string; desc: string; kcal: number }[] = [
  { id: "perder_peso", label: "Perder peso", emoji: "⚖️", desc: "Déficit calórico moderado para emagrecer de forma saudável", kcal: 1600 },
  { id: "manter", label: "Manter o peso", emoji: "✨", desc: "Equilíbrio para manter o peso atual com saúde", kcal: 2000 },
  { id: "ganhar_massa", label: "Ganhar massa", emoji: "💪", desc: "Superávit calórico focado em ganho muscular", kcal: 2500 },
  { id: "melhorar_habitos", label: "Melhorar hábitos", emoji: "🌱", desc: "Foco na qualidade, sem meta rígida de calorias", kcal: 2000 },
];

interface GoalData {
  objective: Objective;
  kcal: number;
}

// Salva no context via preferences API (faz merge com context atual)
async function saveGoal(goal: GoalData, currentContext: Record<string, unknown>) {
  await fetch("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { ...currentContext, nutrition_goal: goal } }),
  });
}

export function NutritionGoalCard() {
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [ctx, setCtx] = useState<Record<string, unknown>>({});
  const [editing, setEditing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        setCtx((data.context as Record<string, unknown>) || {});
        if (data.context?.nutrition_goal) {
          setGoal(data.context.nutrition_goal as GoalData);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const objective = OBJECTIVES.find((o) => o.id === goal?.objective);
  const kcal = goal?.kcal || 2000;
  const minKcal = 1200;
  const maxKcal = 3500;
  const sliderPct = ((kcal - minKcal) / (maxKcal - minKcal)) * 100;

  const handleSelectObjective = async (obj: Objective) => {
    const newGoal: GoalData = { objective: obj, kcal: OBJECTIVES.find((o) => o.id === obj)!.kcal };
    setGoal(newGoal);
    await saveGoal(newGoal, ctx);
    setEditing(false);
  };

  const handleKcalChange = async (newKcal: number) => {
    if (!goal) return;
    const updated = { ...goal, kcal: Math.round(newKcal) };
    setGoal(updated);
    await saveGoal(updated);
  };

  // Estado inicial: sem objetivo definido
  if (!goal) {
    return (
      <Card className="rounded-2xl border-dashed border-primary/30 bg-muted/20">
        <CardContent className="p-4 text-center space-y-3">
          <div className="text-3xl">🎯</div>
          <div>
            <p className="text-sm font-medium">Qual é o seu objetivo?</p>
            <p className="text-xs text-muted-foreground">Isso ajuda a personalizar sua meta de calorias</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.id}
                type="button"
                onClick={() => handleSelectObjective(obj.id)}
                className="p-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors"
              >
                <span className="text-lg">{obj.emoji}</span>
                <p className="text-xs font-medium mt-1">{obj.label}</p>
                <p className="text-[10px] text-muted-foreground">{obj.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Objetivo definido — card compacto
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <span className="text-sm font-medium">Seu objetivo</span>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {editing ? "Fechar" : "Mudar"}
          </button>
        </div>

        {editing ? (
          /* Modo edição */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => handleSelectObjective(obj.id)}
                  className={`p-2.5 rounded-xl text-left transition-colors ${
                    goal.objective === obj.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">{obj.emoji}</span>
                  <p className="text-xs font-medium mt-0.5">{obj.label}</p>
                </button>
              ))}
            </div>

            {goal.objective !== "melhorar_habitos" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Meta diária</span>
                  <span className="text-sm font-bold tabular-nums">{kcal} kcal</span>
                </div>
                <input
                  type="range"
                  min={minKcal}
                  max={maxKcal}
                  step={50}
                  value={kcal}
                  onChange={(e) => handleKcalChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:shadow-sm"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{minKcal}</span>
                  <span>{maxKcal}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Modo visualização */
          <div className="flex items-center gap-3">
            <span className="text-2xl">{objective?.emoji}</span>
            <div>
              <p className="text-sm font-medium">{objective?.label}</p>
              <p className="text-xs text-muted-foreground">
                {goal.objective === "melhorar_habitos"
                  ? "Foco na qualidade, sem meta rígida"
                  : `Meta: ${kcal} kcal/dia`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
