"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserAchievement } from "@/types";

const GARDEN_PLANTS = ["🌱", "🌿", "🪴", "🌷", "🌸", "🌻", "🌺", "🌳", "🍀", "💐"];

interface GardenViewProps {
  streak: number;
  achievements: UserAchievement[];
  totalCheckIns: number;
}

export function GardenView({ streak, achievements, totalCheckIns }: GardenViewProps) {
  const plantIndex = Math.min(Math.floor(streak / 3), GARDEN_PLANTS.length - 1);
  const plant = GARDEN_PLANTS[plantIndex];

  const achievementIcons = achievements.map(
    (a) => (a.metadata as { icon?: string }).icon || "⭐"
  );

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Seu jardim</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cada dia de check-in cultiva seu jardim
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <span className="text-6xl block mb-2">{plant}</span>
          <p className="text-sm text-muted-foreground">
            {streak === 0
              ? "Plante sua primeira semente hoje"
              : streak < 3
              ? "Sua semente está brotando..."
              : streak < 7
              ? "Sua planta está crescendo!"
              : streak < 14
              ? "Flores aparecendo!"
              : streak < 30
              ? "Jardim florido!"
              : "Jardim lendario!"}
          </p>
          {streak > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {streak} dia{streak !== 1 ? "s" : ""} consecutivo{streak !== 1 ? "s" : ""}
              {totalCheckIns > 0 && ` · ${totalCheckIns} check-in${totalCheckIns !== 1 ? "s" : ""} total`}
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
            <p className="text-xs text-muted-foreground">
              Complete check-ins para desbloquear conquistas
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
