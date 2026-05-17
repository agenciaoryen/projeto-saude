"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

export function WeeklyMirror() {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reflect/weekly", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.narrative) setNarrative(data.narrative);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="rounded-2xl bg-gradient-to-br from-purple-50/30 to-transparent dark:from-purple-950/10 border-purple-200/40 dark:border-purple-800/30">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-purple-500" />
          <span className="text-sm text-muted-foreground">Preparando seu espelho da semana...</span>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) return null;

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-purple-50/30 to-transparent dark:from-purple-950/10 border-purple-200/40 dark:border-purple-800/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-purple-500" />
          <span className="text-sm font-medium">Seu espelho da semana</span>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3 whitespace-pre-wrap">
          {narrative}
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          Gerado a partir dos seus dados. Nao e um diagnostico — e um reflexo.
        </p>
      </CardContent>
    </Card>
  );
}
