"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { ArrowLeft, Check } from "lucide-react";

const MOODS = [
  { value: 1, emoji: "😔", key: "muito_mal" },
  { value: 2, emoji: "😕", key: "mal" },
  { value: 3, emoji: "😐", key: "normal" },
  { value: 4, emoji: "🙂", key: "bem" },
  { value: 5, emoji: "😊", key: "muito_bem" },
];

export default function NovoDiarioPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
          <div>
            <h1 className="text-xl font-bold">{t("nova_entrada_title")}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="rounded-full size-10"
          onClick={handleSave}
          disabled={saving}
          aria-label={t("salvar_entrada")}
        >
          <Check className="size-4" />
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

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("titulo")}</Label>
        <Input
          id="title"
          placeholder={t("titulo_placeholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">{t("o_que_escrever")}</Label>
        <Textarea
          id="content"
          placeholder={t("escrever_placeholder")}
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="resize-none rounded-xl"
        />
      </div>

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
