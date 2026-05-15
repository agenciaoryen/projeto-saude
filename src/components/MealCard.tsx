"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mealTypeEmoji, mealTypeLabel, classificationLabel, classificationColor } from "@/lib/meal-utils";
import { getPhoto, isCloudPath, photoUrl } from "@/lib/photo-storage";
import { Clock } from "lucide-react";
import type { Meal } from "@/types";

export function MealCard({ meal, onClick }: { meal: Meal; onClick?: () => void }) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  const primaryPhoto = meal.fotos?.length ? meal.fotos[0] : meal.foto_path;

  useEffect(() => {
    if (primaryPhoto) {
      if (isCloudPath(primaryPhoto)) {
        setPhotoSrc(photoUrl(primaryPhoto));
      } else {
        getPhoto(primaryPhoto).then(setPhotoSrc);
      }
    }
  }, [primaryPhoto]);

  const hora = new Date(meal.data_hora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const calLabel = meal.macros ? `${meal.macros.calorias_kcal} kcal` : null;
  const hasItems = meal.itens && meal.itens.length > 0;
  const isPending = meal.status_analise === "pendente";

  return (
    <Card
      className={`rounded-2xl overflow-hidden transition-colors ${onClick ? "cursor-pointer hover:bg-muted/20" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex gap-3.5">
          {/* Foto maior — 88x88 */}
          <div className="size-[88px] rounded-xl overflow-hidden shrink-0 bg-muted relative">
            {photoSrc ? (
              <img src={photoSrc} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-3xl">
                {mealTypeEmoji(meal.tipo_refeicao)}
              </div>
            )}
            {isPending && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded-full">Analisar</span>
              </div>
            )}
          </div>

          {/* Detalhes */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
            {/* Linha 1: Tipo + horário + badge de status */}
            <div className="flex items-center gap-2">
              <span className="text-sm">{mealTypeEmoji(meal.tipo_refeicao)}</span>
              <span className="text-sm font-medium">{mealTypeLabel(meal.tipo_refeicao)}</span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="size-3" />
                {hora}
              </span>
              {isPending && (
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full ml-auto">
                  Pendente
                </span>
              )}
            </div>

            {/* Itens */}
            {hasItems && (
              <div className="flex flex-wrap gap-1">
                {meal.itens!.slice(0, 4).map((item, i) => (
                  <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {item.nome}
                  </span>
                ))}
                {meal.itens!.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{meal.itens!.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Macros + classificação */}
            <div className="flex items-center gap-2 flex-wrap">
              {calLabel && (
                <span className="text-sm font-semibold tabular-nums">{calLabel}</span>
              )}
              {meal.classificacao && (
                <Badge className={`text-[10px] px-1.5 py-0 leading-relaxed ${classificationColor(meal.classificacao)}`}>
                  {classificationLabel(meal.classificacao)}
                </Badge>
              )}
            </div>

            {/* Observação ou texto livre */}
            {(meal.observacao || (meal.texto_livre && !hasItems)) && (
              <p className="text-[11px] text-muted-foreground leading-snug truncate">
                {(meal.observacao || meal.texto_livre).slice(0, 80)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
