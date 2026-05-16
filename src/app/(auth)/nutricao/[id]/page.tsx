"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "@/lib/useTranslation";
import {
  mealTypeEmoji,
  mealTypeLabel,
  classificationLabel,
  classificationColor,
} from "@/lib/meal-utils";
import { compressImage, uploadToCloud, photoUrl } from "@/lib/photo-storage";
import { ArrowLeft, Camera, ImageIcon, X, Trash2, Plus, Loader2, Sparkles } from "lucide-react";
import type { MealType, MealItem, Macros, MealClassification, Meal } from "@/types";

const MEAL_TYPES: MealType[] = [
  "cafe_da_manha",
  "almoco",
  "lanche",
  "jantar",
  "lanche_noturno",
];

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MealDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { t } = useTranslation();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Edit form state
  const [mealType, setMealType] = useState<MealType>("almoco");
  const [dateTime, setDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [items, setItems] = useState<MealItem[]>([]);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [classif, setClassif] = useState<MealClassification | null>(null);
  const [obs, setObs] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const MAX_PHOTOS = 3;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/meals?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setMeal(data);
          setMealType(data.tipo_refeicao);
          setDateTime(toDatetimeLocal(data.data_hora));
          setDescription(data.texto_livre || "");
          setPhotoPaths(data.fotos || []);
          setItems(data.itens || []);
          setMacros(data.macros);
          setClassif(data.classificacao);
          setObs(data.observacao || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(t("confirmar_deletar"))) return;
    const res = await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao deletar refeição");
      return;
    }
    toast.success("Refeição deletada");
    router.push("/nutricao");
    router.refresh();
  };

  const handleAnalyze = async () => {
    if (!meal) return;
    setAnalyzing(true);
    try {
      const hasPhotos = meal.fotos && meal.fotos.length > 0;
      // Carregar as fotos como base64 se existirem (do cloud storage)
      let photosBase64: string[] = [];
      if (hasPhotos) {
        const loaded: string[] = [];
        for (const path of meal.fotos!) {
          const url = photoUrl(path);
          if (url) {
            try {
              const resp = await fetch(url);
              const blob = await resp.blob();
              const b64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              loaded.push(b64);
            } catch { /* skip photo that fails to load */ }
          }
        }
        photosBase64 = loaded;
      }

      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId: meal.id,
          ...(photosBase64.length > 0 ? { photosBase64 } : {}),
          description: meal.texto_livre || "",
          items: (meal.itens || []).map((i) => i.nome),
        }),
      });

      if (!res.ok) throw new Error();
      const analyzed = await res.json();
      setMeal((prev) =>
        prev
          ? {
              ...prev,
              itens: analyzed.itens || [],
              macros: analyzed.macros || null,
              classificacao: analyzed.classificacao || "nao_identificada",
              observacao: analyzed.observacao || "",
              status_analise: "analisado",
            }
          : prev
      );
      setItems(analyzed.itens || []);
      setMacros(analyzed.macros || null);
      setClassif(analyzed.classificacao || "nao_identificada");
      setObs(analyzed.observacao || "");
      toast.success("Refeição analisada!");
    } catch {
      toast.error("Erro ao analisar refeição");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          data_hora: new Date(dateTime).toISOString(),
          tipo_refeicao: mealType,
          foto_path: photoPaths.length > 0 ? photoPaths[0] : null,
          fotos: photoPaths,
          texto_livre: description.trim(),
          itens: items,
          macros,
          classificacao: classif,
          observacao: obs,
          status_analise: meal?.status_analise || "pendente",
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Refeição atualizada");
      setEditing(false);
      setMeal((prev) =>
        prev
          ? {
              ...prev,
              tipo_refeicao: mealType,
              data_hora: new Date(dateTime).toISOString(),
              texto_livre: description.trim(),
              foto_path: photoPaths.length > 0 ? photoPaths[0] : null,
              fotos: photoPaths,
              itens: items,
              macros,
              classificacao: classif,
              observacao: obs,
            }
          : prev
      );
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoAdd = async (file: File) => {
    if (photos.length + photoPaths.length >= MAX_PHOTOS) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos por refeição`);
      return;
    }
    try {
      const compressed = await compressImage(file);
      const path = await uploadToCloud(compressed, "meals");
      setPhotos((prev) => [...prev, compressed]);
      setPhotoPaths((prev) => [...prev, path]);
    } catch {
      toast.error("Erro ao processar imagem");
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPaths((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    const nome = newItemName.trim();
    if (!nome) return;
    setItems((prev) => [...prev, { nome }]);
    setNewItemName("");
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemName = (idx: number, nome: string) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, nome } : item)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-4xl">🍽️</div>
        <p className="text-muted-foreground">Refeição não encontrada</p>
        <Button className="rounded-xl" onClick={() => router.push("/nutricao")}>
          Voltar
        </Button>
      </div>
    );
  }

  // Display URLs: prefer base64 previews, fallback to cloud URLs
  const displayPhotos = photos.length > 0
    ? photos
    : photoPaths.map((p) => photoUrl(p)).filter(Boolean) as string[];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/nutricao")}
            className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">
              {mealTypeEmoji(meal.tipo_refeicao)} {mealTypeLabel(meal.tipo_refeicao)}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatDateTime(meal.data_hora)}
            </p>
          </div>
        </div>

        {editing ? (
          <Button className="rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        ) : (
          <div className="flex gap-2">
            {meal.status_analise === "pendente" && (
              <Button
                variant="default"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Analisar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditing(true)}
            >
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={handleDelete}
            >
              Deletar
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <>
          {/* Photos (até 3) */}
          <Card className="rounded-2xl overflow-hidden">
            {displayPhotos.length > 0 ? (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {displayPhotos.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt={`Refeição ${i + 1}`} className="w-full aspect-[4/3] object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {displayPhotos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                    >
                      <Plus className="size-5" />
                      <span className="text-[10px]">Adicionar</span>
                    </button>
                  )}
                </div>
                {displayPhotos.length < MAX_PHOTOS && (
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={() => cameraInputRef.current?.click()}>
                      <Camera className="size-3.5" /> Câmera
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="size-3.5" /> Galeria
                    </Button>
                  </div>
                )}
                <p className="text-[11px] text-center text-muted-foreground">
                  {displayPhotos.length} de {MAX_PHOTOS} fotos
                </p>
              </div>
            ) : (
              <CardContent className="py-8 text-center space-y-3">
                <div className="text-4xl">📸</div>
                <p className="text-sm text-muted-foreground">Adicionar foto</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="size-4" /> Câmera
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="size-4" /> Galeria
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoAdd(e.target.files[0])} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handlePhotoAdd(e.target.files[0]); e.target.value = ""; }} />

          {/* Tipo de refeição */}
          <div className="space-y-2">
            <button type="button" onClick={() => setShowTypePicker(!showTypePicker)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {mealTypeEmoji(mealType)} {mealTypeLabel(mealType)}
              <span className="text-xs underline">Alterar tipo</span>
            </button>
            {showTypePicker && (
              <div className="flex gap-1.5 flex-wrap">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt} type="button"
                    onClick={() => { setMealType(mt); setShowTypePicker(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${mt === mealType ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
                  >
                    {mealTypeEmoji(mt)} {mealTypeLabel(mt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} className="w-full rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />

          <Textarea placeholder="Descreva a refeição..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none rounded-xl" />

          {/* Itens */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Itens</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted rounded-full text-xs">
                    <input
                      value={item.nome}
                      onChange={(e) => updateItemName(idx, e.target.value)}
                      className="bg-transparent border-none outline-none w-20 text-xs"
                    />
                    <button type="button" onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar item"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  className="h-8 text-xs rounded-lg"
                />
                <Button size="sm" variant="outline" className="rounded-lg shrink-0" onClick={addItem}>
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Macros */}
          {macros && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Macros</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {([
                    { key: "carboidratos_g", label: "Carboidratos", suffix: "g" },
                    { key: "proteinas_g", label: "Proteínas", suffix: "g" },
                    { key: "gorduras_g", label: "Gorduras", suffix: "g" },
                    { key: "calorias_kcal", label: "Calorias", suffix: " kcal" },
                  ] as const).map(({ key, label, suffix }) => (
                    <div key={key} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground text-xs">{label}</span>
                      <input
                        type="number"
                        value={macros[key] ?? ""}
                        onChange={(e) => setMacros((prev) => prev ? { ...prev, [key]: Number(e.target.value) } : prev)}
                        className="w-16 text-right bg-transparent border-none outline-none text-sm font-medium"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Classificação */}
          {classif && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Classificação:</span>
              <Badge className={classificationColor(classif)}>
                {classificationLabel(classif)}
              </Badge>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => {
              setEditing(false);
              if (meal) {
                setMealType(meal.tipo_refeicao);
                setDateTime(toDatetimeLocal(meal.data_hora));
                setDescription(meal.texto_livre || "");
                setPhotos([]);
                setPhotoPaths(meal.fotos || []);
                setItems(meal.itens || []);
                setMacros(meal.macros);
                setClassif(meal.classificacao);
                setObs(meal.observacao || "");
              }
            }}
          >
            Cancelar
          </Button>
        </>
      ) : (
        <>
          {/* Photos */}
          {meal.fotos && meal.fotos.length > 0 && (
            <div className={`grid gap-2 ${meal.fotos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {meal.fotos.map((p, i) => {
                const src = photoUrl(p);
                return src ? (
                  <img key={i} src={src} alt={`Refeição ${i + 1}`} className="w-full aspect-[4/3] object-cover rounded-2xl" />
                ) : null;
              })}
            </div>
          )}

          {/* Meal type badge */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mealTypeEmoji(meal.tipo_refeicao)}</span>
            <span className="font-medium">{mealTypeLabel(meal.tipo_refeicao)}</span>
            {meal.classificacao && (
              <Badge className={classificationColor(meal.classificacao)}>
                {classificationLabel(meal.classificacao)}
              </Badge>
            )}
          </div>

          {/* Items */}
          {meal.itens && meal.itens.length > 0 && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">Itens</p>
                <div className="flex flex-wrap gap-1.5">
                  {meal.itens.map((item, i) => (
                    <span key={i} className="px-2.5 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      {item.nome}
                      {item.quantidade ? ` (${item.quantidade})` : ""}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Macros */}
          {meal.macros && (
            <Card className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Macros</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Carboidratos</span>
                    <span className="font-medium">{meal.macros.carboidratos_g}g</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Proteínas</span>
                    <span className="font-medium">{meal.macros.proteinas_g}g</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Gorduras</span>
                    <span className="font-medium">{meal.macros.gorduras_g}g</span>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">Calorias</span>
                    <span className="font-medium">{meal.macros.calorias_kcal} kcal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {meal.texto_livre && (
            <div className="prose prose-sm dark:prose-invert">
              {meal.texto_livre.split("\n").map((line, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed">
                  {line || " "}
                </p>
              ))}
            </div>
          )}

          {/* Observation */}
          {meal.observacao && (
            <p className="text-sm text-muted-foreground italic bg-muted/40 rounded-xl p-3">
              {meal.observacao}
            </p>
          )}

          {!meal.itens?.length && !meal.macros && !meal.texto_livre && (
            <p className="text-muted-foreground italic text-center py-8">
              Nenhum detalhe registrado
            </p>
          )}
        </>
      )}
    </div>
  );
}
