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
import { compressImage, uploadToCloud, photoUrl } from "@/lib/photo-storage";
import { ArrowLeft, ChevronDown, ImageIcon, X } from "lucide-react";

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
  const [moodOpen, setMoodOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
        photos,
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

  const handlePhotoAdd = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const path = await uploadToCloud(compressed, "diary");
      setPhotos((prev) => [...prev, path]);
    } catch {
      toast.error("Erro ao processar imagem");
    }
  };

  const removePhoto = (path: string) => {
    setPhotos((prev) => prev.filter((p) => p !== path));
  };

  const selectedMoodEmoji = mood ? MOODS.find((m) => m.value === mood)?.emoji : "😶";

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

      {/* Mood — discreet, right-aligned */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMoodOpen(!moodOpen)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-2xl">{selectedMoodEmoji}</span>
            <ChevronDown
              className={`size-4 transition-transform ${moodOpen ? "rotate-180" : ""}`}
            />
          </button>

          {moodOpen && (
            <div className="absolute right-0 top-full mt-2 z-30 bg-popover border border-border rounded-xl p-2 shadow-lg">
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setMood(m.value);
                      setMoodOpen(false);
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-sm transition-colors ${
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
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <Input
        placeholder={t("titulo_placeholder")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-xl text-base"
      />

      {/* Content + photo */}
      <div className="relative">
        <Textarea
          placeholder={t("escrever_placeholder")}
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="resize-none rounded-xl pr-12 pb-12"
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="absolute bottom-3 right-3 size-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground"
          aria-label="Adicionar foto"
        >
          <ImageIcon className="size-4" />
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handlePhotoAdd(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              <PhotoThumbnail photoPath={p} />
              <button
                type="button"
                onClick={() => removePhoto(p)}
                className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

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

/** Small component to display a photo from cloud storage. */
function PhotoThumbnail({ photoPath }: { photoPath: string }) {
  if (!photoPath) return null;
  const src = photoUrl(photoPath);
  return <img src={src!} alt="" className="w-full h-full object-cover" />;
}
