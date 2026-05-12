"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";
import type { DiaryEntry } from "@/types";

const MOOD_EMOJIS: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

export default function DiarioPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/diary")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          <h1 className="text-2xl font-bold">{t("diario_title")}</h1>
          <p className="text-muted-foreground text-sm">{t("diario_subtitle")}</p>
        </div>
        <Button size="sm" className="rounded-xl" onClick={() => router.push("/diario/novo")}>
          {t("nova_entrada")}
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-4xl">📔</div>
            <div>
              <p className="font-medium">{t("nenhuma_entrada")}</p>
              <p className="text-sm text-muted-foreground">{t("comece_diario")}</p>
            </div>
            <Button className="rounded-xl" onClick={() => router.push("/diario/novo")}>
              {t("escrever_primeira")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/diario/${entry.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {entry.mood && (
                        <span className="text-sm">{MOOD_EMOJIS[entry.mood]}</span>
                      )}
                    </div>
                    {entry.title && (
                      <p className="font-medium text-sm truncate">{entry.title}</p>
                    )}
                    {entry.content && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {entry.content.slice(0, 100)}
                        {entry.content.length > 100 ? "..." : ""}
                      </p>
                    )}
                    {!entry.title && !entry.content && (
                      <p className="text-sm text-muted-foreground italic">{t("sem_conteudo")}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
