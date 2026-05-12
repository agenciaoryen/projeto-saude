"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const CONTEXT_QUESTIONS = [
  {
    id: "has_medication",
    question: "Você toma medicamentos prescritos regularmente?",
    description:
      "Se sim, vamos te lembrar de registrar se tomou os remédios certinho.",
  },
  {
    id: "has_faith",
    question: "Você tem alguma prática de fé, espiritualidade ou religião?",
    description:
      "Se sim, a pergunta de meditação incluirá 'oração'. Se não, será apenas meditação e respiração.",
  },
  {
    id: "has_creative_hobby",
    question: "Você costuma cantar, pintar ou desenhar?",
    description:
      "Se sim, incluiremos essas opções. Se não, a pergunta será mais geral sobre criatividade e lazer.",
  },
  {
    id: "track_suicidal_thoughts",
    question: "Quer incluir a pergunta sobre pensamento suicida?",
    description:
      "É uma pergunta importante para acompanhar sua segurança. Recomendamos incluir.",
    defaultValue: true,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, boolean>>({
    has_medication: false,
    has_faith: false,
    has_creative_hobby: false,
    track_suicidal_thoughts: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.onboarding_completed) {
          router.push("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const toggle = (id: string) => {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);

    const enabled = [
      "feltJudged",
      "talkedToSomeone",
      "meditationPrayerBreathing",
      "creativeActivity",
      "ateWell",
      "bowelMovement",
      "exerciseWalk",
      "drankWater",
      "sleptWell",
      "didSomethingEnjoyable",
      "workedOnGoals",
    ];

    if (answers.has_medication) enabled.push("tookMedication");
    if (answers.track_suicidal_thoughts) enabled.push("suicidalThoughts");

    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled_questions: enabled,
        context: answers,
        onboarding_completed: true,
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao salvar. Tente novamente.");
      setLoading(false);
      return;
    }

    toast.success("Diário personalizado! 🌱");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🌱</div>
          <h1 className="text-2xl font-bold">Vamos nos conhecer</h1>
          <p className="text-muted-foreground text-sm">
            Algumas perguntas para personalizar seu diário. Suas respostas
            ajudam a mostrar só o que faz sentido pra você.
          </p>
        </div>

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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    !answers[q.id]
                      ? "bg-primary text-primary-foreground"
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
          disabled={loading}
        >
          {loading ? "Salvando..." : "Começar"}
        </Button>
      </div>
    </main>
  );
}
