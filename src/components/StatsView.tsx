"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";
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

function getTierKey(streak: number): string {
  if (streak >= 60) return "tier_lendario";
  if (streak >= 30) return "tier_diamante";
  if (streak >= 14) return "tier_ouro";
  if (streak >= 7) return "tier_prata";
  if (streak >= 3) return "tier_bronze";
  return "tier_iniciante";
}

const TIER_COLORS: Record<string, string> = {
  tier_lendario: "text-yellow-400",
  tier_diamante: "text-cyan-400",
  tier_ouro: "text-amber-400",
  tier_prata: "text-zinc-300",
  tier_bronze: "text-orange-600",
  tier_iniciante: "text-muted-foreground",
};

const TIER_EMOJIS: Record<string, string> = {
  tier_lendario: "👑",
  tier_diamante: "💎",
  tier_ouro: "🥇",
  tier_prata: "🥈",
  tier_bronze: "🥉",
  tier_iniciante: "⚔️",
};

export function StatsView({ streak, achievements, totalCheckIns }: StatsViewProps) {
  const { t } = useTranslation();
  const { level, progress, required } = getLevel(totalCheckIns);
  const xpPercent = Math.min((progress / required) * 100, 100);
  const tierKey = getTierKey(streak);

  const achievementIcons = achievements.map(
    (a) => (a.metadata as { icon?: string }).icon || "⭐"
  );

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-zinc-900/10 to-amber-950/10 border-zinc-700/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {t("estatisticas")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("cada_checkin_forte")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-center">
          <div className="text-5xl font-black tabular-nums">{level}</div>
          <div className="text-sm text-muted-foreground mt-1">{t("nivel")}</div>
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
              {t("xp_para_nivel", { xp: String(required - progress), level: String(level + 1) })}
            </p>
          </div>
        </div>

        <div className="text-center p-3 bg-muted/50 rounded-xl">
          <div className="text-3xl font-bold tabular-nums">🔥 {streak}</div>
          <div className="text-xs text-muted-foreground">{t("dias_consecutivos")}</div>
          <div className={`text-sm font-semibold mt-1 ${TIER_COLORS[tierKey]}`}>
            {TIER_EMOJIS[tierKey]} {t(tierKey)}
          </div>
          {streak > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {totalCheckIns} check-in{totalCheckIns !== 1 ? "s" : ""} total
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">{t("conquistas")}</p>
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
              <p className="text-xs text-muted-foreground">{t("desbloquear_stats")}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
