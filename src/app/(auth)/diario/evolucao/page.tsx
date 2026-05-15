"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalDate } from "@/lib/utils";
import { ArrowLeft, ChevronDown } from "lucide-react";

const QUESTIONS = [
  { key: "q1", label: "Três coisas boas que aconteceram hoje", rows: 3 },
  { key: "q2", label: "O que você fez para que elas acontecessem?", rows: 2 },
  { key: "q3", label: "Qual qualidade sua você mais usou hoje?", rows: 2 },
  { key: "q4", label: "O que faria diferente hoje?", rows: 2 },
  { key: "q5", label: "Uma gentileza que você fez ou recebeu hoje", rows: 2 },
  { key: "q6", label: "O que você se compromete a fazer amanhã?", rows: 3 },
];

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function DiarioEvolucaoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [entryDate, setEntryDate] = useState(() => getLocalDate());
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const updateAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const answered = QUESTIONS.filter((q) => answers[q.key]?.trim());
    if (answered.length === 0) {
      toast.error("Responda pelo menos uma pergunta");
      return;
    }

    setSaving(true);

    // Build formatted content
    const content = QUESTIONS
      .filter((q) => answers[q.key]?.trim())
      .map((q) => `${q.label}\n${answers[q.key].trim()}`)
      .join("\n\n");

    const title = "Diário de Evolução";

    const res = await fetch("/api/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: entryDate,
        title,
        content,
        photos: [],
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

  const answeredCount = QUESTIONS.filter((q) => answers[q.key]?.trim()).length;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Top bar */}
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
          <div className="relative">
            <button
              type="button"
              onClick={openDatePicker}
              className="flex items-center gap-1 text-left hover:opacity-80 transition-opacity"
            >
              <h1 className="text-xl font-bold">{formatDisplayDate(entryDate)}</h1>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <input
              type="date"
              ref={dateInputRef}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <Button
          className="rounded-xl"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("salvando") : t("salvar")}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>🌱</span>
        <span>{answeredCount}/{QUESTIONS.length} respondidas</span>
      </div>

      <div className="space-y-5">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="space-y-2">
            <label className="text-sm font-medium">{q.label}</label>
            <Textarea
              placeholder="Escreva aqui..."
              rows={q.rows}
              value={answers[q.key] || ""}
              onChange={(e) => updateAnswer(q.key, e.target.value)}
              className="resize-none rounded-xl"
            />
          </div>
        ))}
      </div>

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
