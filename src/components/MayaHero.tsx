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
  mayaNudge?: { message: string; action?: { label: string; href: string } } | null;
  todayTasks?: { status: string; day_of_week?: number }[];
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
  mayaNudge,
  todayTasks,
  loading,
}: MayaHeroProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const timeGreeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return { saudacao: "Boa noite", icon: "🌙" };
    if (h < 12) return { saudacao: "Bom dia", icon: "☀️" };
    if (h < 18) return { saudacao: "Boa tarde", icon: "🌤️" };
    return { saudacao: "Boa noite", icon: "🌙" };
  }, []);

  const mayaMessage = useMemo(() => {
    if (!firstName) return null;
    const sleepQuality = recentSleep?.quality ?? null;
    const sleepBad = sleepQuality != null && sleepQuality <= 2;
    const sleepGood = sleepQuality != null && sleepQuality >= 4;
    const spendingPct =
      todaySpending !== null && spendingLimit > 0
        ? Math.round((todaySpending / spendingLimit) * 100)
        : null;

    const tasks = todayTasks || [];
    const todayDone = tasks.filter(t => t.status === "concluida").length;
    const todayTotal = tasks.length;
    const { saudacao } = timeGreeting;

    // Priority: nudge from API (already contextual)
    if (mayaNudge?.message) return mayaNudge.message;

    if (!todayCheckIn) {
      let msg = `${saudacao}, ${firstName}! `;
      if (sleepBad && spendingPct && spendingPct > 60) {
        msg += `Você dormiu mal e já gastou ${spendingPct}% do orçamento. Como pretende virar esse jogo hoje?`;
      } else if (sleepBad && todayTotal > 0) {
        msg += `Dormiu mal essa noite e tem ${todayTotal} tarefa${todayTotal > 1 ? "s" : ""} planejada${todayTotal > 1 ? "s" : ""}. Quer ajustar pra algo mais leve hoje?`;
      } else if (sleepGood && todayTotal > 0) {
        msg += `Que bom que descansou bem! Tem ${todayTotal} tarefa${todayTotal > 1 ? "s" : ""} pra hoje. Bora fazer valer?`;
      } else if (todayTotal > 0) {
        msg += `Tem ${todayTotal} tarefa${todayTotal > 1 ? "s" : ""} planejada${todayTotal > 1 ? "s" : ""} pra hoje. Registre como está pra eu personalizar melhor.`;
      } else {
        msg += `Registre como está hoje. Quanto mais você me conta, mais eu posso te ajudar.`;
      }
      return msg;
    }

    if (lastMood && NEGATIVE_MOODS.has(lastMood)) {
      return `Sei que "${formatMood(lastMood, userGender)}" não é fácil, ${firstName}. Quer conversar sobre o que está pesando?`;
    }

    // Post-check-in: contextual based on plan progress
    if (todayTotal > 0 && todayDone === 0) {
      return `${saudacao}, ${firstName}! Nenhuma tarefa concluída ainda — quer começar pela mais rápida?`;
    }
    if (todayTotal > 0 && todayDone === todayTotal) {
      return `Uau, ${firstName}! 🎉 Todas as ${todayTotal} tarefas de hoje concluídas. Isso merece uma comemoração!`;
    }
    if (todayTotal > 0 && todayDone > 0) {
      return `${todayDone}/${todayTotal} tarefas feitas hoje, ${firstName}. Tá indo bem! Quer conversar sobre o que ainda falta?`;
    }

    const pergunta = timeGreeting.saudacao === "Boa noite" ? "Como foi seu dia?" : "Como está sendo seu dia?";
    return `${saudacao}, ${firstName}. ${pergunta}`;
  }, [firstName, todayCheckIn, recentSleep, todaySpending, spendingLimit, lastMood, mayaNudge, userGender, todayTasks, timeGreeting]);

  // Default CTA when no nudge action
  const defaultAction = useMemo(() => {
    if (mayaNudge?.action) return mayaNudge.action;
    const tasks = todayTasks || [];
    const todayTotal = tasks.length;
    const todayDone = tasks.filter(t => t.status === "concluida").length;
    // If there are pending tasks, CTA = go to agenda
    if (todayTotal > 0 && todayDone < todayTotal) {
      return { label: "Ver tarefas do dia", href: "/agenda" };
    }
    // Default: chat with Maya
    return { label: t("conversar_com_maya"), href: "/insights" };
  }, [mayaNudge, todayTasks, t]);

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

      {/* CTA Button — adapts to context */}
      {(() => {
        const action = defaultAction;
        const label = action.label;
        const href = action.href;
        const isChat = href.startsWith("/insights") && mayaMessage;
        // If going to chat, carry Maya's message as context
        const finalHref = isChat
          ? `/insights?context=${encodeURIComponent(mayaMessage)}`
          : href;

        return (
          <button
            type="button"
            onClick={() => router.push(finalHref)}
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
            {label}
          </button>
        );
      })()}
    </div>
  );
}
