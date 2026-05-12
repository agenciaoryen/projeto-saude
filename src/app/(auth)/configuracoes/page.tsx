"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const GENDER_OPTIONS = [
  { id: "masculino", label: "Masculino", emoji: "⚡" },
  { id: "feminino", label: "Feminino", emoji: "🌸" },
  { id: "nao_dizer", label: "Prefiro não dizer", emoji: "🌱" },
] as const;

const CONTEXT_QUESTIONS = [
  {
    id: "has_medication",
    question: "Você toma medicamentos prescritos regularmente?",
    description: "Mostra a pergunta 'Tomou remédios certinho' no check-in.",
  },
  {
    id: "has_faith",
    question: "Você tem prática de fé, espiritualidade ou religião?",
    description: 'Adiciona "oração" à pergunta de meditação/respiração.',
  },
  {
    id: "has_creative_hobby",
    question: "Você costuma cantar, pintar ou desenhar?",
    description: 'Adiciona "cantou/pintou/desenhou" à pergunta criativa.',
  },
  {
    id: "track_suicidal_thoughts",
    question: "Incluir pergunta sobre pensamento suicida?",
    description: "Recomendamos manter para acompanhar sua segurança.",
  },
];

export default function ConfiguracoesPage() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [gender, setGender] = useState<string>("nao_dizer");
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
        context: { ...answers, gender },
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar.");
      setSaving(false);
      return;
    }

    toast.success("Preferências atualizadas! 🌱");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">
          Suas respostas ajudam a personalizar as perguntas do check-in.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Qual seu gênero?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Personaliza o estilo visual do seu dashboard.
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

      {CONTEXT_QUESTIONS.map((q) => (
        <Card key={q.id} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{q.question}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {q.description}
            </p>
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
                Sim
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
                Não
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
        {saving ? "Salvando..." : "Salvar preferências"}
      </Button>
    </div>
  );
}
