import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";

function spDate(ms: number): string {
  const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
  const d = new Date(ms + SP_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hoursNow(): number {
  const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
  const d = new Date(Date.now() + SP_OFFSET_MS);
  return d.getUTCHours();
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const today = getLocalDate();
  const nudges: { id: string; message: string }[] = [];

  try {
    // 1. Check-in hoje?
    const { data: checkIns } = await admin
      .from("check_ins")
      .select("date, feeling")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7);

    const todayCheckIn = checkIns?.find((c: { date: string }) => c.date === today);
    const yesterday = spDate(Date.now() - 24 * 60 * 60 * 1000);
    const hadYesterdayCheckIn = checkIns?.find((c: { date: string }) => c.date === yesterday);

    // Não fez check-in hoje
    if (!todayCheckIn && hoursNow() >= 10) {
      if (hadYesterdayCheckIn) {
        nudges.push({
          id: "checkin_miss",
          message: `Ei, ainda não te vi hoje por aqui... queria saber como você está. ${hadYesterdayCheckIn.feeling ? `Ontem você falou que estava "${hadYesterdayCheckIn.feeling.slice(0, 40)}". Continua assim?` : "Faz um check-in rapidinho?"}`,
        });
      } else {
        nudges.push({
          id: "checkin_gone",
          message: "Faz um tempinho que não faz check-in... não precisa ser nada elaborado, só quero saber como você está. Topa?",
        });
      }
    }

    // 2. Refeições hoje
    const { data: todayMeals } = await admin
      .from("meals")
      .select("data_hora, tipo_refeicao")
      .eq("user_id", user.id)
      .order("data_hora", { ascending: false })
      .limit(20);

    const mealsToday = todayMeals?.filter((m: { data_hora: string }) => {
      return spDate(new Date(m.data_hora).getTime()) === today;
    }) || [];

    const h = hoursNow();
    if (mealsToday.length === 0) {
      if (h >= 9 && h < 11) {
        nudges.push({
          id: "breakfast_miss",
          message: "Bom dia! Já tomou seu café da manhã? Se ainda não registrou, tira uma foto rapidinho — ajuda a manter o hábito.",
        });
      } else if (h >= 12 && h < 14) {
        nudges.push({
          id: "lunch_miss",
          message: "Hora do almoço! O que você vai comer hoje? Registrar as refeições me ajuda a acompanhar seu bem-estar.",
        });
      } else if (h >= 18 && h < 21) {
        nudges.push({
          id: "dinner_miss",
          message: "Já pensou no jantar? Se quiser, registra aí — mesmo que seja algo simples. Toda refeição conta.",
        });
      } else if (h >= 21) {
        nudges.push({
          id: "meals_day_end",
          message: "Não registrou nenhuma refeição hoje... tudo bem, amanhã é um novo dia. Mas se comeu algo e esqueceu de registrar, ainda dá tempo.",
        });
      }
    }

    // 3. Diário — dias sem escrever
    const { data: diaryEntries } = await admin
      .from("diary_entries")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(5);

    const diaryDates = diaryEntries?.map((d: { date: string }) => d.date) || [];
    const daysSinceLastDiary = diaryDates.length > 0
      ? Math.floor((Date.now() - new Date(diaryDates[0] + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24))
      : 7; // no entries at all → treat as 7+ days

    if (daysSinceLastDiary >= 3 && daysSinceLastDiary < 5) {
      nudges.push({
        id: "diary_miss_3",
        message: "Faz 3 dias que você não escreve no diário... às vezes colocar os pensamentos no papel ajuda a clarear a mente. Que tal hoje?",
      });
    } else if (daysSinceLastDiary >= 5) {
      nudges.push({
        id: "diary_miss_5",
        message: "Já faz quase uma semana sem registro no diário. Sei que às vezes a correria atropela, mas escrever nem que seja uma linha já faz diferença. 💙",
      });
    }

    // 4. Humor melhorando
    if (checkIns && checkIns.length >= 3) {
      const todayMoodIdx = checkIns.findIndex((c: { date: string; feeling: string }) => c.date === today && c.feeling);
      if (!todayCheckIn && checkIns.length >= 4) {
        // Só verifica tendência se a pessoa não fez check-in hoje (senão a Maya do chat já comenta)
        const recentFeelings = checkIns.slice(0, 4).filter((c: { feeling: string }) => c.feeling);
        if (recentFeelings.length >= 3) {
          nudges.push({
            id: "checkin_streak_remind",
            message: `Você tem feito check-ins regularmente — isso é incrível. Sua consistência faz toda diferença. Já fez o de hoje?`,
          });
        }
      }
    }

    return NextResponse.json({ nudges });
  } catch (error) {
    console.error("GET /api/maya/nudge error:", error);
    return NextResponse.json({ nudges: [] });
  }
}
