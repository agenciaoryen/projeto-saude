"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";
import type { UserAchievement } from "@/types";

const GARDEN_PLANTS = ["🌱", "🌿", "🪴", "🌷", "🌸", "🌻", "🌺", "🌳", "🍀", "💐"];

interface GardenViewProps {
  streak: number;
  achievements: UserAchievement[];
  totalCheckIns: number;
}

export function GardenView({ streak, achievements, totalCheckIns }: GardenViewProps) {
  const { t } = useTranslation();
  const plantIndex = Math.min(Math.floor(streak / 3), GARDEN_PLANTS.length - 1);
  const plant = GARDEN_PLANTS[plantIndex];

  const achievementIcons = achievements.map(
    (a) => (a.metadata as { icon?: string }).icon || "⭐"
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{t("seu_jardim")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("cultiva_jardim")}</p>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <span className="text-6xl block mb-2">{plant}</span>
          <p className="text-sm text-muted-foreground">
            {streak === 0
              ? t("plante_semente")
              : streak < 3
              ? t("semente_brotando")
              : streak < 7
              ? t("planta_crescendo")
              : streak < 14
              ? t("flores_aparecendo")
              : streak < 30
              ? t("jardim_florido")
              : t("jardim_lendario")}
          </p>
          {streak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {streak} {streak !== 1 ? t("dias_consecutivos_garden") : t("dia_consecutivo")}
              {totalCheckIns > 0 && ` · ${totalCheckIns} ${totalCheckIns !== 1 ? t("checkins_total") : t("checkin_total")}`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {achievementIcons.slice(0, 8).map((icon, i) => (
            <span
              key={i}
              className="text-2xl bg-muted/50 rounded-xl w-10 h-10 flex items-center justify-center"
              title={icon}
            >
              {icon}
            </span>
          ))}
          {achievementIcons.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("desbloquear_conquistas")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
