"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { CheckIn } from "@/types";

const YES_NO_QUESTIONS = [
  { key: "feltJudged", label: "Se sentiu julgada(o) hoje" },
  { key: "tookMedication", label: "Tomou remédios certinho" },
  { key: "talkedToSomeone", label: "Conversou com alguém presencialmente" },
  { key: "meditationPrayerBreathing", label: "Fez meditação | oração | respiração" },
  { key: "creativeActivity", label: "Cantou | pintou | desenhou | assistiu TV" },
  { key: "ateWell", label: "Comeu bem hoje" },
  { key: "bowelMovement", label: "Fez cocô" },
  { key: "exerciseWalk", label: "Saiu a caminhar | exercício físico" },
  { key: "drankWater", label: "Tomou 1L água (mínimo)" },
  { key: "sleptWell", label: "Dormiu bem | descansou" },
  { key: "suicidalThoughts", label: "Pensamento suicida" },
  { key: "didSomethingEnjoyable", label: "Fez algo que gostou hoje" },
  { key: "workedOnGoals", label: "Trabalhou pelas suas metas hoje" },
];

type FormData = Omit<CheckIn, "id" | "user_id" | "created_at" | "updated_at">;

interface CheckInFormProps {
  existingCheckIn?: CheckIn | null;
}

export function CheckInForm({ existingCheckIn }: CheckInFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    feltJudged: false,
    tookMedication: false,
    talkedToSomeone: false,
    meditationPrayerBreathing: false,
    creativeActivity: false,
    ateWell: false,
    bowelMovement: false,
    exerciseWalk: false,
    drankWater: false,
    sleptWell: false,
    suicidalThoughts: false,
    didSomethingEnjoyable: false,
    workedOnGoals: false,
    feeling: "",
    gratitude: "",
  });

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => {
        setEnabledKeys(data.enabled_questions || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (existingCheckIn) {
      setForm({
        date: existingCheckIn.date,
        feltJudged: existingCheckIn.felt_judged,
        tookMedication: existingCheckIn.took_medication,
        talkedToSomeone: existingCheckIn.talked_to_someone,
        meditationPrayerBreathing: existingCheckIn.meditation_prayer_breathing,
        creativeActivity: existingCheckIn.creative_activity,
        ateWell: existingCheckIn.ate_well,
        bowelMovement: existingCheckIn.bowel_movement,
        exerciseWalk: existingCheckIn.exercise_walk,
        drankWater: existingCheckIn.drank_water,
        sleptWell: existingCheckIn.slept_well,
        suicidalThoughts: existingCheckIn.suicidal_thoughts,
        didSomethingEnjoyable: existingCheckIn.did_something_enjoyable,
        workedOnGoals: existingCheckIn.worked_on_goals,
        feeling: existingCheckIn.feeling,
        gratitude: existingCheckIn.gratitude,
      });
    }
  }, [existingCheckIn]);

  const handleCheck = (key: keyof FormData, checked: boolean) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const activeQuestions = YES_NO_QUESTIONS.filter((q) =>
    enabledKeys.includes(q.key)
  );

  const score = activeQuestions.filter(
    (q) => q.key !== "suicidalThoughts" && form[q.key as keyof FormData] === true
  ).length;
  const total = activeQuestions.filter((q) => q.key !== "suicidalThoughts").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.suicidalThoughts) {
      toast.warning(
        "Se você está tendo pensamentos suicidas, por favor ligue para o CVV: 188. Você não está sozinho(a). 💚"
      );
    }

    setLoading(true);

    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar. Tente novamente.");
      setLoading(false);
      return;
    }

    toast.success(
      existingCheckIn
        ? "Check-in atualizado com sucesso! 🌱"
        : `Check-in registrado! Você marcou ${score} de ${total} hábitos positivos. 🌱`
    );

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Check-in diário</CardTitle>
          <p className="text-sm text-muted-foreground">
            {existingCheckIn
              ? "Editando check-in"
              : "Responda com sinceridade — sem julgamentos"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma pergunta selecionada.{" "}
              <a href="/configuracoes" className="text-primary underline">
                Configure seu diário
              </a>
            </p>
          ) : (
            activeQuestions.map((q) => (
              <div
                key={q.key}
                className={`flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors ${
                  q.key === "suicidalThoughts"
                    ? "border border-red-200 dark:border-red-900 rounded-lg p-3"
                    : ""
                }`}
              >
                <Checkbox
                  id={q.key}
                  checked={!!form[q.key as keyof FormData]}
                  onCheckedChange={(checked) =>
                    handleCheck(q.key as keyof FormData, checked === true)
                  }
                  className="mt-1"
                />
                <Label
                  htmlFor={q.key}
                  className={`text-sm leading-relaxed cursor-pointer ${
                    q.key === "suicidalThoughts"
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : ""
                  }`}
                >
                  {q.label}
                </Label>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Respostas abertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeling">Como se sente:</Label>
            <Textarea
              id="feeling"
              placeholder="Descreva como você está se sentindo hoje..."
              rows={3}
              value={form.feeling}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, feeling: e.target.value }))
              }
              className="resize-none rounded-xl"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="gratitude">Algo pelo qual está agradecida(o):</Label>
            <Textarea
              id="gratitude"
              placeholder="Pelo que você é grato(a) hoje?"
              rows={2}
              value={form.gratitude}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, gratitude: e.target.value }))
              }
              className="resize-none rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl"
        disabled={loading}
      >
        {loading
          ? "Salvando..."
          : existingCheckIn
          ? "Atualizar check-in"
          : "Salvar check-in"}
      </Button>
    </form>
  );
}
