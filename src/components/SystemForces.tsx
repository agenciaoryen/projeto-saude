"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cachedFetch } from "@/lib/fetch-cache";
import { getLocalDateFromISO } from "@/lib/utils";
import { Compass } from "lucide-react";
import type { CheckIn, Meal } from "@/types";

interface SystemInsight {
  title: string;
  body: string;
  type: "observation" | "pattern" | "highlight";
}

export function SystemForces() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      cachedFetch<CheckIn[]>("/api/check-ins"),
      cachedFetch<Meal[]>("/api/meals"),
    ])
      .then(([ci, m]) => {
        if (Array.isArray(ci)) setCheckIns(ci);
        if (Array.isArray(m)) setMeals(m);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const insights = useMemo(() => {
    if (!loaded) return [];

    const results: SystemInsight[] = [];

    // Agrupa check-ins por dia da semana
    const byDayOfWeek = new Map<number, CheckIn[]>();
    for (const ci of checkIns.slice(0, 28)) {
      const d = new Date(ci.date + "T12:00:00");
      const dow = d.getDay();
      const arr = byDayOfWeek.get(dow) || [];
      arr.push(ci);
      byDayOfWeek.set(dow, arr);
    }

    // Dias úteis (1-5) vs fim de semana (0, 6)
    const weekdayCheckIns: CheckIn[] = [];
    const weekendCheckIns: CheckIn[] = [];
    for (const [dow, cis] of byDayOfWeek) {
      if (dow === 0 || dow === 6) weekendCheckIns.push(...cis);
      else weekdayCheckIns.push(...cis);
    }

    const avgEnergy = (list: CheckIn[]) => {
      const withEnergy = list.filter((c) => c.energy_level !== null && c.energy_level !== undefined);
      if (withEnergy.length === 0) return null;
      return withEnergy.reduce((s, c) => s + (c.energy_level as number), 0) / withEnergy.length;
    };

    const avgSleep = (list: CheckIn[]) => {
      const withSleep = list.filter((c) => c.slept_well !== null && c.slept_well !== undefined);
      if (withSleep.length === 0) return null;
      return withSleep.filter((c) => c.slept_well).length / withSleep.length;
    };

    const avgHabits = (list: CheckIn[]) => {
      const withPositives = list.filter((c) => Array.isArray(c.positives));
      if (withPositives.length === 0) return null;
      return withPositives.reduce((s, c) => s + (c.positives || []).length, 0) / withPositives.length;
    };

    const wdEnergy = avgEnergy(weekdayCheckIns);
    const weEnergy = avgEnergy(weekendCheckIns);
    const wdSleep = avgSleep(weekdayCheckIns);
    const weSleep = avgSleep(weekendCheckIns);
    const wdHabits = avgHabits(weekdayCheckIns);
    const weHabits = avgHabits(weekendCheckIns);

    // Padrão 1: Energia cai durante a semana
    if (wdEnergy !== null && weEnergy !== null && wdEnergy < weEnergy - 0.5 && weekdayCheckIns.length >= 5) {
      results.push({
        title: "Sua energia muda com os dias",
        body: `Sua energia media em dias uteis (${wdEnergy.toFixed(1)}/10) e menor que nos fins de semana (${weEnergy.toFixed(1)}/10). Isso pode ter a ver com o ritmo das obrigacoes — e nao significa que voce esta fazendo algo errado. Significa que seu corpo responde ao contexto.`,
        type: "pattern",
      });
    }

    // Padrão 2: Sono pior durante a semana
    if (wdSleep !== null && weSleep !== null && wdSleep < weSleep - 0.1 && weekdayCheckIns.length >= 5) {
      results.push({
        title: "Dormir e mais dificil durante a semana",
        body: `Voce dorme bem em ${Math.round(wdSleep * 100)}% dos dias uteis, contra ${Math.round(weSleep * 100)}% nos fins de semana. Nao e so voce — e dificil dormir bem quando a cabeca esta cheia de compromissos. Isso nao e um fracasso pessoal.`,
        type: "observation",
      });
    }

    // Padrão 3: Muitos dias com energia baixa
    const lowEnergyDays = checkIns.slice(0, 28).filter(
      (c) => c.energy_level !== null && c.energy_level !== undefined && c.energy_level <= 4
    );
    if (lowEnergyDays.length >= 5) {
      results.push({
        title: "Muitos dias com a bateria baixa",
        body: `Em ${lowEnergyDays.length} dos ultimos 28 dias, sua energia esteve em 4 ou menos. Isso nao e preguica. E sinal de que algo no seu entorno esta drenando mais do que deveria. Vale olhar com carinho para o que esta consumindo voce.`,
        type: "highlight",
      });
    }

    // Padrão 4: Dias com check-in sem refeições (pode indicar sobrecarga)
    const daysWithCIOnly = new Set<string>();
    const daysWithMeals = new Set<string>();
    for (const ci of checkIns.slice(0, 28)) daysWithCIOnly.add(ci.date);
    for (const m of meals) {
      const localDay = getLocalDateFromISO(m.data_hora);
      daysWithMeals.add(localDay);
      daysWithCIOnly.delete(localDay);
    }
    // Remove days that don't have check-in (we only care about days with check-in but no meals)
    const ciDates = new Set(checkIns.slice(0, 28).map((c) => c.date));
    for (const d of [...daysWithCIOnly]) {
      if (!ciDates.has(d)) daysWithCIOnly.delete(d);
    }

    if (daysWithCIOnly.size >= 4) {
      results.push({
        title: "Dias em que comer ficou em segundo plano",
        body: `Em ${daysWithCIOnly.size} dias do ultimo mes, voce fez check-in mas nao registrou refeicoes. As vezes o dia engole a gente e comer bem fica dificil. Isso fala mais sobre o ritmo do seu contexto do que sobre qualquer falha sua.`,
        type: "observation",
      });
    }

    // Se não encontrou nada significativo, retorna vazio
    if (results.length === 0) return [];

    // Limita a 3 insights
    return results.slice(0, 3);
  }, [checkIns, meals, loaded]);

  if (!loaded || insights.length === 0) return null;

  const typeStyles: Record<SystemInsight["type"], { bg: string; border: string; icon: string }> = {
    pattern: { bg: "bg-sky-50/50 dark:bg-sky-950/10", border: "border-sky-200/40 dark:border-sky-800/30", icon: "🔍" },
    observation: { bg: "bg-violet-50/50 dark:bg-violet-950/10", border: "border-violet-200/40 dark:border-violet-800/30", icon: "👁️" },
    highlight: { bg: "bg-amber-50/50 dark:bg-amber-950/10", border: "border-amber-200/40 dark:border-amber-800/30", icon: "💡" },
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="size-4 text-sky-500" />
          <span className="text-sm font-medium">O que o contexto revela</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Nem tudo que acontece com voce e sobre voce. As vezes e sobre o sistema ao redor.
        </p>

        <div className="space-y-2.5">
          {insights.map((insight, i) => {
            const style = typeStyles[insight.type];
            return (
              <div
                key={i}
                className={`p-3 rounded-xl border ${style.bg} ${style.border}`}
              >
                <p className="text-xs font-medium mb-1">
                  {style.icon} {insight.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.body}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Estas observacoes nao sao diagnosticos. Sao convites para olhar para fora — para o que o mundo faz com voce.
        </p>
      </CardContent>
    </Card>
  );
}
