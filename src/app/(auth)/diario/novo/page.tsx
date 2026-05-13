"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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

export default function NovoDiarioPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entryDate, setEntryDate] = useState(() => getLocalDate());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

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

    toast.success(t("entrada_salva"));
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Top bar: back + date + save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
            aria-label={t("voltar")}
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={openDatePicker}
            className="text-left"
          >
            <h1 className="text-xl font-bold">{formatDisplayDate(entryDate)}</h1>
          </button>
          <input
            type="date"
            ref={dateInputRef}
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="sr-only"
          />
        </div>
        <Button
          className="rounded-xl"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("salvando") : t("salvar")}
        </Button>
      </div>

      {/* Mood selector */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">{t("como_esta_hoje")}</p>
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
        onClick={() => router.back()}
      >
        {t("cancelar")}
      </Button>
    </div>
  );
}
