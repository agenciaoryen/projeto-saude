"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import type { CheckIn } from "@/types";

type FormData = Omit<CheckIn, "id" | "user_id" | "created_at" | "updated_at">;

interface CheckInFormProps {
  existingCheckIn?: CheckIn | null;
}

function getQuestionLabel(key: string, ctx: Record<string, boolean>, t: (k: string) => string): string {
  if (key === "meditation_prayer_breathing") {
    return ctx.has_faith ? t("q_meditacao_fe") : t("q_meditacao");
  }
  if (key === "creative_activity") {
    return ctx.has_creative_hobby ? t("q_criatividade_hobby") : t("q_criatividade_geral");
  }
  const labelMap: Record<string, string> = {
    felt_judged: "q_julgada",
    took_medication: "q_remedios",
    talked_to_someone: "q_conversou",
    ate_well: "q_comeu_bem",
    bowel_movement: "q_coco",
    exercise_walk: "q_exercicio",
    drank_water: "q_agua",
    slept_well: "q_dormiu",
    suicidal_thoughts: "q_suicida_label",
    did_something_enjoyable: "q_gostou",
    worked_on_goals: "q_metas",
  };
  const k = labelMap[key];
  return k ? t(k) : key;
}

export function CheckInForm({ existingCheckIn }: CheckInFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const isFirstRender = useRef(true);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const autoSave = useCallback(async (data: FormData) => {
    try {
      const res = await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) setSaved(true);
    } catch {
      // silent fail on auto-save
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => autoSave(form), 1500);
    return () => clearTimeout(autoSaveRef.current);
  }, [form, autoSave]);

  const handleCheck = (key: keyof FormData, checked: boolean) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const activeQuestions = enabledKeys.map((key) => ({
    key,
    label: getQuestionLabel(key, context, t),
  }));

  const score = activeQuestions.filter(
    (q) => q.key !== "suicidal_thoughts" && form[q.key as keyof FormData] === true
  ).length;
  const total = activeQuestions.filter((q) => q.key !== "suicidal_thoughts").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.suicidal_thoughts) {
      toast.warning(t("cvv_warning"));
    }

    setLoading(true);

    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error(t("erro_salvar"));
      setLoading(false);
      return;
    }

    toast.success(
      existingCheckIn
        ? t("checkin_atualizado")
        : `${t("checkin_registrado")} Você marcou ${score} de ${total} hábitos positivos. 🌱`
    );

    fetch("/api/achievements", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.new_achievements?.length > 0) {
          data.new_achievements.forEach((a: { icon: string; label: string }) => {
            toast.success(`${a.icon} ${a.label} ${t("desbloqueado")}`, {
              duration: 4000,
            });
          });
        }
      })
      .catch(() => {});

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{t("checkin_diario")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {existingCheckIn ? t("editando_checkin") : t("responda_sinceridade")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("nenhuma_pergunta")}{" "}
              <a href="/configurações" className="text-primary underline">
                {t("configure_diario")}
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
                      {t("sim")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCheck(q.key as keyof FormData, false)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        value === false
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t("nao")}
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
          <CardTitle className="text-lg">{t("respostas_abertas")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feeling">{t("sentimento_label")}</Label>
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
            <Label htmlFor="gratitude">{t("gratidao_label")}</Label>
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

      <div className="flex items-center gap-2">
        {saved && (
          <span className="text-xs text-muted-foreground animate-in fade-in">
            Salvo automaticamente
          </span>
        )}
        <Button
          type="submit"
          size="lg"
          className="flex-1 rounded-xl"
          disabled={loading}
        >
          {loading
            ? t("salvando")
            : existingCheckIn
            ? t("atualizar_checkin")
            : t("salvar_checkin")}
        </Button>
      </div>
    </form>
  );
}
