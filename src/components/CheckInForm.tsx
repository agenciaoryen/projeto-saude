"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { CheckIn } from "@/types";

type FormData = Omit<CheckIn, "id" | "user_id" | "created_at" | "updated_at">;

interface CheckInFormProps {
  existingCheckIn?: CheckIn | null;
}

function getQuestionLabel(key: string, ctx: Record<string, boolean>): string {
  if (key === "meditation_prayer_breathing") {
    return ctx.has_faith
      ? "Fez meditação | oração | respiração"
      : "Fez meditação | respiração";
  }
  if (key === "creative_activity") {
    return ctx.has_creative_hobby
      ? "Cantou | pintou | desenhou | assistiu TV"
      : "Assistiu TV | fez algo criativo";
  }
  const labels: Record<string, string> = {
    felt_judged: "Se sentiu julgada(o) hoje",
    took_medication: "Tomou remédios certinho",
    talked_to_someone: "Conversou com alguém presencialmente",
    ate_well: "Comeu bem hoje",
    bowel_movement: "Fez cocô",
    exercise_walk: "Saiu a caminhar | exercício físico",
    drank_water: "Tomou 1L água (mínimo)",
    slept_well: "Dormiu bem | descansou",
    suicidal_thoughts: "Pensamento suicida",
    did_something_enjoyable: "Fez algo que gostou hoje",
    worked_on_goals: "Trabalhou pelas suas metas hoje",
  };
  return labels[key] || key;
}

export function CheckInForm({ existingCheckIn }: CheckInFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [context, setContext] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split("T")[0],
    felt_judged: false,
    took_medication: false,
    talked_to_someone: false,
    meditation_prayer_breathing: false,
    creative_activity: false,
    ate_well: false,
    bowel_movement: false,
    exercise_walk: false,
    drank_water: false,
    slept_well: false,
    suicidal_thoughts: false,
    did_something_enjoyable: false,
    worked_on_goals: false,
    feeling: "",
    gratitude: "",
  });

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => {
        setEnabledKeys(data.enabled_questions || []);
        setContext(data.context || {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (existingCheckIn) {
      setForm({
        date: existingCheckIn.date,
        felt_judged: existingCheckIn.felt_judged,
        took_medication: existingCheckIn.took_medication,
        talked_to_someone: existingCheckIn.talked_to_someone,
        meditation_prayer_breathing: existingCheckIn.meditation_prayer_breathing,
        creative_activity: existingCheckIn.creative_activity,
        ate_well: existingCheckIn.ate_well,
        bowel_movement: existingCheckIn.bowel_movement,
        exercise_walk: existingCheckIn.exercise_walk,
        drank_water: existingCheckIn.drank_water,
        slept_well: existingCheckIn.slept_well,
        suicidal_thoughts: existingCheckIn.suicidal_thoughts,
        did_something_enjoyable: existingCheckIn.did_something_enjoyable,
        worked_on_goals: existingCheckIn.worked_on_goals,
        feeling: existingCheckIn.feeling,
        gratitude: existingCheckIn.gratitude,
      });
    }
  }, [existingCheckIn]);

  const handleCheck = (key: keyof FormData, checked: boolean) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const activeQuestions = enabledKeys.map((key) => ({
    key,
    label: getQuestionLabel(key, context),
  }));

  const score = activeQuestions.filter(
    (q) => q.key !== "suicidal_thoughts" && form[q.key as keyof FormData] === true
  ).length;
  const total = activeQuestions.filter((q) => q.key !== "suicidal_thoughts").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.suicidal_thoughts) {
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
            activeQuestions.map((q) => {
              const value = form[q.key as keyof FormData];
              const isSuicidal = q.key === "suicidal_thoughts";

              return (
                <div
                  key={q.key}
                  className={`p-3 rounded-xl space-y-2 ${
                    isSuicidal
                      ? "border border-red-200 dark:border-red-900"
                      : ""
                  }`}
                >
                  <p
                    className={`text-sm leading-relaxed ${
                      isSuicidal
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : ""
                    }`}
                  >
                    {q.label}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCheck(q.key as keyof FormData, true)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        value === true
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCheck(q.key as keyof FormData, false)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        value === false
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
              );
            })
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
