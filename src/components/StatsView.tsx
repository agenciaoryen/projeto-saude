"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserAchievement } from "@/types";

interface StatsViewProps {
  streak: number;
  achievements: UserAchievement[];
  totalCheckIns: number;
}

function getLevel(totalCheckIns: number) {
  let level = 1;
  let required = 5;
  let acc = 5;
  while (totalCheckIns >= acc) {
    level++;
    required = Math.floor(required * 1.4);
    acc += required;
  }
  const currentStart = acc - required;
  const progress = totalCheckIns - currentStart;
  return { level, progress, required };
}

function getTier(streak: number) {
  if (streak >= 60) return { name: "Lendário", emoji: "👑", color: "text-yellow-400" };
  if (streak >= 30) return { name: "Diamante", emoji: "💎", color: "text-cyan-400" };
  if (streak >= 14) return { name: "Ouro", emoji: "🥇", color: "text-amber-400" };
  if (streak >= 7) return { name: "Prata", emoji: "🥈", color: "text-zinc-300" };
  if (streak >= 3) return { name: "Bronze", emoji: "🥉", color: "text-orange-600" };
  return { name: "Iniciante", emoji: "⚔️", color: "text-muted-foreground" };
}

export function StatsView({ streak, achievements, totalCheckIns }: StatsViewProps) {
  const { level, progress, required } = getLevel(totalCheckIns);
  const xpPercent = Math.min((progress / required) * 100, 100);
  const tier = getTier(streak);

  const achievementIcons = achievements.map(
    (a) => (a.metadata as { icon?: string }).icon || "⭐"
  );

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-zinc-900/10 to-amber-950/10 border-zinc-700/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          ⚡ Estatísticas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cada check-in te deixa mais forte
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Level & XP */}
        <div className="text-center">
          <div className="text-5xl font-black tabular-nums">{level}</div>
          <div className="text-sm text-muted-foreground mt-1">Nível</div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>XP</span>
              <span>
                {progress}/{required}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Faltam {required - progress} XP para o nível {level + 1}
            </p>
          </div>
        </div>

        {/* Streak & Tier */}
        <div className="text-center p-3 bg-muted/50 rounded-xl">
          <div className="text-3xl font-bold tabular-nums">🔥 {streak}</div>
          <div className="text-xs text-muted-foreground">dias consecutivos</div>
          <div className={`text-sm font-semibold mt-1 ${tier.color}`}>
            {tier.emoji} {tier.name}
          </div>
          {streak > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {totalCheckIns} check-in{totalCheckIns !== 1 ? "s" : ""} total
            </p>
          )}
        </div>

        {/* Achievements */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Conquistas</p>
          <div className="flex flex-wrap gap-2">
            {achievementIcons.slice(0, 8).map((icon, i) => (
              <span
                key={i}
                className="text-xl bg-zinc-800/50 rounded-lg w-9 h-9 flex items-center justify-center"
                title={icon}
              >
                {icon}
              </span>
            ))}
            {achievementIcons.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Complete check-ins para desbloquear
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
