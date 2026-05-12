"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const QUESTIONS_BY_GROUP = [
  {
    group: "🧘 Autocuidado",
    items: [
      { key: "meditationPrayerBreathing", label: "Fez meditação | oração | respiração" },
      { key: "creativeActivity", label: "Cantou | pintou | desenhou | assistiu TV" },
      { key: "didSomethingEnjoyable", label: "Fez algo que gostou hoje" },
      { key: "workedOnGoals", label: "Trabalhou pelas suas metas hoje" },
    ],
  },
  {
    group: "💪 Físico",
    items: [
      { key: "ateWell", label: "Comeu bem hoje" },
      { key: "drankWater", label: "Tomou 1L água (mínimo)" },
      { key: "exerciseWalk", label: "Saiu a caminhar | exercício físico" },
      { key: "sleptWell", label: "Dormiu bem | descansou" },
      { key: "bowelMovement", label: "Fez cocô" },
    ],
  },
  {
    group: "💊 Saúde",
    items: [
      { key: "tookMedication", label: "Tomou remédios certinho" },
      { key: "suicidalThoughts", label: "Pensamento suicida" },
    ],
  },
  {
    group: "🤝 Social",
    items: [
      { key: "talkedToSomeone", label: "Conversou com alguém presencialmente" },
      { key: "feltJudged", label: "Se sentiu julgada(o) hoje" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (keys: string[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error("Escolha pelo menos uma pergunta para começar.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled_questions: [...selected],
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
          <h1 className="text-2xl font-bold">Vamos personalizar seu diário</h1>
          <p className="text-muted-foreground text-sm">
            Cada pessoa é única. Escolha abaixo quais áreas fazem sentido para
            você acompanhar no dia a dia.
          </p>
        </div>

        {QUESTIONS_BY_GROUP.map(({ group, items }) => {
          const allOn = items.every((i) => selected.has(i.key));
          const someOn = items.some((i) => selected.has(i.key));
          return (
            <Card key={group} className="rounded-2xl">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{group}</CardTitle>
                <Badge
                  variant={allOn ? "default" : someOn ? "secondary" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleGroup(items.map((i) => i.key), !allOn)}
                >
                  {allOn ? "Todos" : someOn ? "Alguns" : "Nenhum"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      selected.has(key)
                        ? "bg-primary/10 text-primary font-medium border border-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <Button
          size="lg"
          className="w-full rounded-xl"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Salvando..." : `Começar com ${selected.size} pergunta${selected.size !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </main>
  );
}
