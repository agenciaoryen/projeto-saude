import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";

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
    // Fetch user language preference
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("context")
      .eq("user_id", user.id)
      .single();

    const lang: Lang = (prefs?.context?.language as Lang) || "pt";

    // 1. Check-in hoje?
    const { data: checkIns } = await admin
      .from("check_ins")
      .select("date, feeling")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(7);

    // New user — no check-ins at all → welcome message
    if (!checkIns || checkIns.length === 0) {
      nudges.push({
        id: "boas_vindas",
        message: t(lang, "nudge_boas_vindas"),
      });
      return NextResponse.json({ nudges });
    }

    const todayCheckIn = checkIns?.find((c: { date: string }) => c.date === today);
    const yesterday = spDate(Date.now() - 24 * 60 * 60 * 1000);
    const hadYesterdayCheckIn = checkIns?.find((c: { date: string }) => c.date === yesterday);

    // Não fez check-in hoje
    if (!todayCheckIn && hoursNow() >= 10) {
      if (hadYesterdayCheckIn) {
        const feeling = hadYesterdayCheckIn.feeling?.slice(0, 40);
        nudges.push({
          id: "checkin_miss",
          message: feeling
            ? t(lang, "nudge_checkin_miss_feeling", { feeling })
            : t(lang, "nudge_checkin_miss_nofeel"),
        });
      } else {
        nudges.push({
          id: "checkin_gone",
          message: t(lang, "nudge_checkin_gone"),
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
        nudges.push({ id: "breakfast_miss", message: t(lang, "nudge_cafe") });
      } else if (h >= 12 && h < 14) {
        nudges.push({ id: "lunch_miss", message: t(lang, "nudge_almoco") });
      } else if (h >= 18 && h < 21) {
        nudges.push({ id: "dinner_miss", message: t(lang, "nudge_jantar") });
      } else if (h >= 21) {
        nudges.push({ id: "meals_day_end", message: t(lang, "nudge_sem_refeicao") });
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
      : 7;

    if (daysSinceLastDiary >= 3 && daysSinceLastDiary < 5) {
      nudges.push({ id: "diary_miss_3", message: t(lang, "nudge_diario_3") });
    } else if (daysSinceLastDiary >= 5) {
      nudges.push({ id: "diary_miss_5", message: t(lang, "nudge_diario_5") });
    }

    // 4. Humor melhorando / streak
    if (checkIns && checkIns.length >= 3) {
      if (!todayCheckIn && checkIns.length >= 4) {
        const recentFeelings = checkIns.slice(0, 4).filter((c: { feeling: string }) => c.feeling);
        if (recentFeelings.length >= 3) {
          nudges.push({
            id: "checkin_streak_remind",
            message: t(lang, "nudge_streak"),
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
