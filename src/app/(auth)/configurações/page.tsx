"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { LANG_OPTIONS } from "@/lib/i18n";

const GENDER_OPTIONS = [
  { id: "masculino", label: "Masculino", emoji: "⚡" },
  { id: "feminino", label: "Feminino", emoji: "🌸" },
  { id: "nao_dizer", label: "Prefiro não dizer", emoji: "🌱" },
] as const;

const CONTEXT_QUESTIONS = [
  {
    id: "has_medication",
    qKey: "q_medicacao",
    dKey: "q_medicacao_desc",
  },
  {
    id: "has_faith",
    qKey: "q_fe",
    dKey: "q_fe_desc",
  },
  {
    id: "has_creative_hobby",
    qKey: "q_criatividade",
    dKey: "q_criatividade_desc",
  },
  {
    id: "track_suicidal_thoughts",
    qKey: "q_suicida",
    dKey: "q_suicida_desc",
  },
];

export default function ConfiguracoesPage() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [gender, setGender] = useState<string>("nao_dizer");
  const [language, setLanguage] = useState<string>("pt");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        if (data.context?.gender) setGender(data.context.gender);
        if (data.context?.language) setLanguage(data.context.language);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaving(true);

    const enabled = [
      "felt_judged",
      "talked_to_someone",
      "meditation_prayer_breathing",
      "creative_activity",
      "ate_well",
      "bowel_movement",
      "exercise_walk",
      "drank_water",
      "slept_well",
      "did_something_enjoyable",
      "worked_on_goals",
    ];

    if (answers.has_medication) enabled.push("took_medication");
    if (answers.track_suicidal_thoughts) enabled.push("suicidal_thoughts");

    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled_questions: enabled,
        context: { ...answers, gender, language },
      }),
    });

    if (!res.ok) {
      toast.error(t("erro_salvar"));
      setSaving(false);
      return;
    }

    toast.success(t("preferencias_atualizadas"));
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("config_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("config_subtitle")}</p>
      </div>

      {/* Language selector */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Idioma / Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguage(opt.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  language === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.flag} {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gender */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("pergunta_genero")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t("genero_subtitle_config")}
          </p>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGender(opt.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  gender === opt.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Context questions */}
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

      <Button
        size="lg"
        className="w-full rounded-xl"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? t("salvando") : t("salvar_entrada")}
      </Button>
    </div>
  );
}
