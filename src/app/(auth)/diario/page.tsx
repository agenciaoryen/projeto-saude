"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";
import { Plus, ImageIcon } from "lucide-react";
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
      <div>
        <h1 className="text-2xl font-bold">{t("diario_title")}</h1>
        <p className="text-muted-foreground text-sm">{t("diario_subtitle")}</p>
      </div>

      {entries.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-primary/50 bg-primary/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-4xl">📔</div>
            <div>
              <p className="font-medium">{t("nenhuma_entrada")}</p>
              <p className="text-sm text-muted-foreground">{t("comece_diario")}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t("toque_no_mais")}</p>
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
                      {entry.photos && entry.photos.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <ImageIcon className="size-3" />
                          {entry.photos.length}
                        </span>
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
      <button
        onClick={() => router.push("/diario/novo")}
        className="fixed bottom-20 right-5 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
        aria-label={t("nova_entrada")}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
