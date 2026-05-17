"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/useTranslation";

const TIERS = [
  { rom: "I",   key: "tier_iniciante", th: 0,  cls: { color: "#71717a", border: "#a1a1aa66", bg: "linear-gradient(180deg,#fafafa,#f4f4f5)" } },
  { rom: "II",  key: "tier_bronze",    th: 3,  cls: { color: "#a16207", border: "#ca8a0466", bg: "linear-gradient(180deg,#fef3c7,#fde68a)" } },
  { rom: "III", key: "tier_prata",     th: 7,  cls: { color: "#52525b", border: "#a1a1aa66", bg: "linear-gradient(180deg,#fafafa,#e4e4e7)" } },
  { rom: "IV",  key: "tier_ouro",      th: 14, cls: { color: "#b45309", border: "#f59e0b88", bg: "linear-gradient(180deg,#fef9c3,#fde047)" } },
  { rom: "V",   key: "tier_diamante",  th: 30, cls: { color: "#0e7490", border: "#22d3ee88", bg: "linear-gradient(180deg,#ecfeff,#a5f3fc)" } },
  { rom: "VI",  key: "tier_lendario",  th: 60, cls: { color: "#92400e", border: "#b45309aa", bg: "linear-gradient(180deg,#fef3c7,#fbbf24)" } },
];

interface ProgressoProps {
  streak: number;
  totalCheckIns: number;
}

export function Progresso({ streak, totalCheckIns }: ProgressoProps) {
  const { t } = useTranslation();

  const curIdx = TIERS.reduce((acc, tier, i) => (streak >= tier.th ? i : acc), 0);
  const cur = TIERS[curIdx];
  const next = TIERS[curIdx + 1];
  const progress = next ? Math.min(((streak - cur.th) / (next.th - cur.th)) * 100, 100) : 100;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{t("progresso_titulo")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("progresso_subtitle", { n: String(totalCheckIns) })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-1.5 mb-3.5">
          {TIERS.map((tier, i) => {
            const isActive = i === curIdx;
            const isLocked = i > curIdx;

            return (
              <div
                key={tier.rom}
                className={`relative border rounded-xl px-1 pt-3 pb-2 text-center transition-all ${
                  isLocked ? "opacity-55" : ""
                }`}
                style={{
                  borderColor: isActive ? "oklch(.5 .12 160 / .55)" : "var(--border)",
                  background: isActive
                    ? "linear-gradient(180deg,oklch(.5 .12 160 / .06),transparent)"
                    : "var(--card)",
                  boxShadow: isActive ? "0 4px 14px -8px oklch(.5 .12 160 / .35)" : "none",
                }}
              >
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full">
                    {t("atual")}
                  </span>
                )}

                <div
                  className="w-[30px] h-[30px] rounded-full mx-auto mb-1 flex items-center justify-center font-extrabold text-xs tabular-nums"
                  style={{
                    color: tier.cls.color,
                    border: `1.5px solid ${tier.cls.border}`,
                    background: tier.cls.bg,
                    boxShadow: isActive ? "0 0 0 3px oklch(.5 .12 160 / .12)" : "none",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tier.rom}
                </div>

                <div className="text-[9.5px] font-semibold leading-tight">{t(tier.key)}</div>
                <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{tier.th} d</div>
              </div>
            );
          })}
        </div>

        {next && (
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>
                <strong className="text-foreground">{t(cur.key)}</strong> · {streak} dias
              </span>
              <span>{next.th - streak} dias até {t(next.key)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
