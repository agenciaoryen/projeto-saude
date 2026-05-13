"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mealTypeEmoji, mealTypeLabel, classificationLabel, classificationColor } from "@/lib/meal-utils";
import { getPhoto } from "@/lib/photo-storage";
import { Clock } from "lucide-react";
import type { Meal } from "@/types";

export function MealCard({ meal, onClick }: { meal: Meal; onClick?: () => void }) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);

  useEffect(() => {
    if (meal.foto_path) {
      getPhoto(meal.foto_path).then(setPhotoSrc);
    }
  }, [meal.foto_path]);

  const hora = new Date(meal.data_hora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const calLabel = meal.macros ? `${meal.macros.calorias_kcal} kcal` : null;

  return (
    <Card
      className={`rounded-2xl overflow-hidden transition-colors ${onClick ? "cursor-pointer hover:bg-muted/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Thumbnail */}
          <div className="size-16 rounded-xl overflow-hidden shrink-0 bg-muted">
            {photoSrc ? (
              <img src={photoSrc} alt="" className="size-full object-cover" />
            ) : (
              <div className="size-full flex items-center justify-center text-2xl">
                🍽️
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{mealTypeEmoji(meal.tipo_refeicao)}</span>
              <span className="text-sm font-medium">{mealTypeLabel(meal.tipo_refeicao)}</span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="size-3" />
                {hora}
              </span>
              {meal.status_analise === "pendente" && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full ml-auto">
                  ⏳
                </span>
              )}
            </div>

            {/* Itens */}
            {meal.itens && meal.itens.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {meal.itens.slice(0, 4).map((item, i) => (
                  <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {item.nome}
                  </span>
                ))}
                {meal.itens.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{meal.itens.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Info extra */}
            <div className="flex items-center gap-2 flex-wrap">
              {calLabel && (
                <span className="text-xs font-medium">{calLabel}</span>
              )}
              {meal.classificacao && (
                <Badge className={`text-[10px] px-1.5 py-0 leading-relaxed ${classificationColor(meal.classificacao)}`}>
                  {classificationLabel(meal.classificacao)}
                </Badge>
              )}
              {meal.texto_livre && !meal.itens?.length && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                  {meal.texto_livre}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
