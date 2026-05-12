"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";

const CONTEXT_QUESTIONS = [
  { id: "has_medication", qKey: "q_medicacao", dKey: "q_medicacao_desc" },
  { id: "has_faith", qKey: "q_fe", dKey: "q_fe_desc" },
  { id: "has_creative_hobby", qKey: "q_criatividade", dKey: "q_criatividade_desc" },
  { id: "track_suicidal_thoughts", qKey: "q_suicida", dKey: "q_suicida_desc" },
];

export default function ConfiguracoesPage() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const isFirstRender = useRef(true);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => {
        setAnswers(
          data.context || {
            has_medication: false,
            has_faith: false,
            has_creative_hobby: false,
            track_suicidal_thoughts: true,
          }
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Auto-save with debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaved(false);
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      const enabled = [
        "felt_judged", "talked_to_someone", "meditation_prayer_breathing",
        "creative_activity", "ate_well", "bowel_movement", "exercise_walk",
        "drank_water", "slept_well", "did_something_enjoyable", "worked_on_goals",
      ];
      if (answers.has_medication) enabled.push("took_medication");
      if (answers.track_suicidal_thoughts) enabled.push("suicidal_thoughts");

      try {
        const res = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled_questions: enabled, context: answers }),
        });
        if (res.ok) setSaved(true);
      } catch {
        // silent
      }
    }, 1000);
    return () => clearTimeout(autoSaveRef.current);
  }, [answers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("config_title")}</h1>
          <p className="text-muted-foreground text-sm">{t("config_subtitle")}</p>
        </div>
        {saved && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            Salvo ✓
          </span>
        )}
      </div>

      {CONTEXT_QUESTIONS.map((q) => (
        <Card key={q.id} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t(q.qKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{t(q.dKey)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggle(q.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  answers[q.id]
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t("sim")}
              </button>
              <button
                type="button"
                onClick={() => toggle(q.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !answers[q.id]
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t("nao")}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
