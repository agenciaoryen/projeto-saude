"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";

export default function InsightsPage() {
  const { t } = useTranslation();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("insight_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnalysis(parsed.text);
        setLastGenerated(parsed.date);
      } catch { /* noop */ }
    }
  }, []);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = data.analysis;
      setAnalysis(text);
      const now = new Date().toLocaleString("pt-BR");
      setLastGenerated(now);
      localStorage.setItem("insight_cache", JSON.stringify({ text, date: now }));
    } catch {
      setAnalysis("Tive dificuldade de me conectar agora. Tente novamente em alguns instantes. 💛");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground text-sm">
          Uma análise gentil do seu momento, feita pela Maya
        </p>
      </div>

      {!analysis && !loading ? (
        <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-5xl">🔮</div>
            <div>
              <p className="font-medium">Quer um olhar sobre seu momento?</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                A Maya analisa seus check-ins e diário para te dar um insight gentil e pessoal.
              </p>
            </div>
            <Button size="lg" className="rounded-xl" onClick={generateAnalysis}>
              Gerar insight
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center space-y-5">
            <div className="flex items-center justify-center gap-1.5">
              <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
              <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
              <span className="size-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-muted-foreground">
              A Maya está observando seus últimos dias com carinho...
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl bg-gradient-to-br from-amber-50/30 via-background to-primary/5 dark:from-amber-950/10 dark:via-background dark:to-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                  🌸
                </div>
                <div>
                  <p className="font-medium text-sm">Maya</p>
                  {lastGenerated && (
                    <p className="text-[10px] text-muted-foreground">
                      {lastGenerated}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                {analysis}
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={generateAnalysis}
            disabled={loading}
          >
            Gerar novo insight
          </Button>
        </>
      )}
    </div>
  );
}
