"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { ArrowLeft } from "lucide-react";
import type { DiaryEntry } from "@/types";

const MOODS = [
  { value: 1, emoji: "😔", key: "muito_mal" },
  { value: 2, emoji: "😕", key: "mal" },
  { value: 3, emoji: "😐", key: "normal" },
  { value: 4, emoji: "🙂", key: "bem" },
  { value: 5, emoji: "😊", key: "muito_bem" },
];

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function DiarioEntryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation();

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [entryDate, setEntryDate] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/diary?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setEntry(data);
          setEntryDate(data.date || "");
          setTitle(data.title || "");
          setContent(data.content || "");
          setMood(data.mood ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error(t("escreva_algo"));
      return;
    }

    setSaving(true);
    const res = await fetch("/api/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        date: entryDate,
        title: title.trim(),
        content: content.trim(),
        mood,
      }),
    });

    if (!res.ok) {
      toast.error(t("erro_salvar_entrada"));
      setSaving(false);
      return;
    }

    toast.success(t("entrada_atualizada"));
    setEditing(false);
    setSaving(false);
    setEntry((prev) =>
      prev
        ? { ...prev, date: entryDate, title: title.trim(), content: content.trim(), mood }
        : prev
    );
  };

  const handleDelete = async () => {
    if (!confirm(t("confirmar_deletar"))) return;

    const res = await fetch(`/api/diary/${id}`, { method: "DELETE" });

    if (!res.ok) {
      toast.error(t("erro_deletar"));
      return;
    }

    toast.success(t("entrada_deletada"));
    router.push("/diario");
    router.refresh();
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("carregando")}</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-4xl">📔</div>
        <p className="text-muted-foreground">{t("entrada_nao_encontrada")}</p>
        <Button className="rounded-xl" onClick={() => router.push("/diario")}>
          {t("voltar_diario")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/diario")}
            className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
            aria-label={t("voltar")}
          >
            <ArrowLeft className="size-5" />
          </button>
          {editing ? (
            <button
              type="button"
              onClick={openDatePicker}
              className="text-left"
            >
              <h1 className="text-xl font-bold">{formatDisplayDate(entryDate)}</h1>
            </button>
          ) : (
            <div>
              <h1 className="text-xl font-bold">
                {entry.title || t("diario_title")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {formatDisplayDate(entry.date)}
              </p>
            </div>
          )}
          <input
            type="date"
            ref={dateInputRef}
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="sr-only"
          />
        </div>

        {editing ? (
          <Button
            className="rounded-xl"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("salvando") : t("salvar")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditing(true)}
            >
              {t("editar")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={handleDelete}
            >
              {t("deletar")}
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          {/* Mood selector */}
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">{t("humor_dia")}</p>
              <div className="flex justify-between gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-sm transition-colors flex-1 ${
                      mood === m.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px]">{t(m.key)}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Title — placeholder as label */}
          <Input
            placeholder={t("titulo_placeholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl text-base"
          />

          {/* Content — placeholder as label */}
          <Textarea
            placeholder={t("escrever_placeholder")}
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none rounded-xl"
          />

          {/* Cancel */}
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => {
              setEditing(false);
              setTitle(entry.title || "");
              setContent(entry.content || "");
              setMood(entry.mood ?? null);
              setEntryDate(entry.date || "");
            }}
          >
            {t("cancelar")}
          </Button>
        </>
      ) : (
        <>
          {entry.mood && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 text-center">
                <span className="text-4xl">
                  {MOODS.find((m) => m.value === entry.mood)?.emoji}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(MOODS.find((m) => m.value === entry.mood)?.key || "")}
                </p>
              </CardContent>
            </Card>
          )}

          {entry.title && (
            <h2 className="text-lg font-semibold">{entry.title}</h2>
          )}
          {entry.content ? (
            <div className="prose prose-sm dark:prose-invert">
              {entry.content.split("\n").map((line, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed">
                  {line || " "}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic text-center py-8">
              {t("sem_conteudo")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
