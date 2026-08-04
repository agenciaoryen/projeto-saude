"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/useTranslation";
import { MayaAvatar } from "@/components/MayaAvatar";
import { getMoodLabel, getMoodById } from "@/lib/checkin-moods";
import type { CheckIn, SleepLog } from "@/types";

const NEGATIVE_MOODS = new Set([
  "ansiosa", "triste", "cansada", "sobrecarregada", "irritada", "frustrada",
]);

function formatMood(moodId: string, gender: string): string {
  const chip = getMoodById(moodId);
  return chip ? getMoodLabel(chip, gender) : moodId;
}

interface MayaHeroProps {
  firstName: string;
  userGender: string;
  todayCheckIn: CheckIn | null;
  recentSleep: SleepLog | null;
  todaySpending: number | null;
  spendingLimit: number;
  lastMood: string;
  mayaNudgeText: string | null;
  loading?: boolean;
}

export function MayaHero({
  firstName,
  userGender,
  todayCheckIn,
  recentSleep,
  todaySpending,
  spendingLimit,
  lastMood,
  mayaNudgeText,
  loading,
}: MayaHeroProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const mayaMessage = useMemo(() => {
    if (!firstName) return null;
    const sleepQuality = recentSleep?.quality ?? null;
    const sleepBad = sleepQuality != null && sleepQuality <= 2;
    const sleepGood = sleepQuality != null && sleepQuality >= 4;
    const spendingPct =
      todaySpending !== null && spendingLimit > 0
        ? Math.round((todaySpending / spendingLimit) * 100)
        : null;

    if (!todayCheckIn) {
      let msg = `Oi ${firstName}! `;
      if (sleepBad && spendingPct && spendingPct > 60) {
        msg += `Você dormiu mal e já gastou ${spendingPct}% do orçamento. Como pretende virar esse jogo hoje?`;
      } else if (sleepGood) {
        msg += `Que bom que descansou bem. Bora fazer hoje valer?`;
      } else {
        msg += `Registre como está hoje. Quanto mais você me conta, mais eu posso te ajudar.`;
      }
      return msg;
    }

    if (lastMood && NEGATIVE_MOODS.has(lastMood)) {
      return `Sei que "${formatMood(lastMood, userGender)}" não é fácil, ${firstName}. Quer conversar sobre o que está pesando?`;
    }

    const h = new Date().getHours();
    const saudacao = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    const pergunta = h >= 18 ? "Como foi seu dia?" : "Como está sendo seu dia?";
    return mayaNudgeText || `${saudacao}, ${firstName}. ${pergunta}`;
  }, [firstName, todayCheckIn, recentSleep, todaySpending, spendingLimit, lastMood, mayaNudgeText, userGender]);

  return (
    <div className="relative flex flex-col items-center" style={{ paddingTop: 0, paddingBottom: 24 }}>
      {/* Background aura */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40,
          width: 340,
          height: 340,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,92,255,0.15) 0%, rgba(94,234,212,0.05) 35%, transparent 65%)",
        }}
      />

      {/* Maya — full image, no circle */}
      <div style={{ marginBottom: 8, position: "relative" }}>
        <MayaAvatar state="hero" size={280} />
      </div>

      {/* Message */}
      <div
        style={{
          maxWidth: 340,
          textAlign: "center",
          paddingInline: 24,
          marginBottom: 20,
        }}
      >
        {loading || mayaMessage === null ? (
          <div className="space-y-2 flex flex-col items-center">
            <div
              className="h-4 rounded-full animate-pulse w-[260px]"
              style={{ background: "oklch(0.22 0.02 270)" }}
            />
            <div
              className="h-4 rounded-full animate-pulse w-[200px]"
              style={{ background: "oklch(0.22 0.02 270)" }}
            />
            <div
              className="h-4 rounded-full animate-pulse w-[160px]"
              style={{ background: "oklch(0.22 0.02 270)" }}
            />
          </div>
        ) : (
          <p
            className="text-[16px] leading-[1.5] font-medium tracking-tight whitespace-pre-wrap"
            style={{ color: "#e0d6ff" }}
          >
            {mayaMessage}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={() => router.push("/insights")}
        className="inline-flex items-center justify-center h-12 px-8 rounded-2xl border-0 cursor-pointer font-[inherit] text-[15px] font-bold text-white transition-transform duration-150 ease-out"
        style={{
          background: "linear-gradient(135deg, #7C5CFF, #A78BFA)",
          boxShadow: "0 4px 20px rgba(124,92,255,0.4)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(124,92,255,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,92,255,0.4)";
        }}
      >
        {t("conversar_com_maya")}
      </button>
    </div>
  );
}
