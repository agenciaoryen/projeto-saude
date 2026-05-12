import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildAnalysisPrompt } from "@/lib/analyzer";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();

    const [prefsRes, checkInsRes, diaryRes] = await Promise.all([
      admin.from("user_preferences").select("context, enabled_questions").eq("user_id", user.id).single(),
      admin.from("check_ins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
      admin.from("diary_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
    ]);

    const context = (prefsRes.data?.context || {}) as Record<string, unknown>;
    const checkIns = checkInsRes.data || [];
    const diaryEntries = diaryRes.data || [];

    // Calculate positive rate
    const enabledKeys = prefsRes.data?.enabled_questions || [];
    const nonSuicidal = enabledKeys.filter((k: string) => k !== "suicidal_thoughts");

    let totalPositive = 0;
    let totalOpportunities = 0;
    for (const ci of checkIns.slice(0, 14)) {
      for (const key of nonSuicidal) {
        totalOpportunities++;
        if ((ci as Record<string, unknown>)[key] === true) totalPositive++;
      }
    }
    const positiveRate = totalOpportunities > 0 ? (totalPositive / totalOpportunities) * 100 : 0;

    // Calculate streak
    const streak = calculateStreakFromCheckIns(checkIns);

    const prompt = buildAnalysisPrompt({
      profile: {
        name: (user.user_metadata?.name as string) || "",
        gender: (context.gender as string) || "nao_dizer",
        has_medication: context.has_medication === true,
        has_faith: context.has_faith === true,
        has_creative_hobby: context.has_creative_hobby === true,
      },
      checkIns,
      diaryEntries,
      streak,
      totalCheckIns: checkIns.length,
      positiveRate,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        temperature: 0.7,
        system: "Você é Maya, uma companheira gentil que ajuda pessoas a se conhecerem melhor através de check-ins diários, diário e hábitos. Você fala português brasileiro com naturalidade e afeto.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json(
        { error: "Erro ao gerar análise", detail: err },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    return NextResponse.json({ analysis: content });
  } catch (error) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar dados", detail: String(error) },
      { status: 500 }
    );
  }
}

function calculateStreakFromCheckIns(checkIns: { date: string }[]): number {
  if (checkIns.length === 0) return 0;
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const latest = sorted[0]?.date;
  if (latest !== today && latest !== yesterday) return 0;

  let streak = 0;
  let checkDate = new Date(today);
  for (const ci of sorted) {
    const ciDate = ci.date;
    const expected = checkDate.toISOString().split("T")[0];
    if (ciDate === expected) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}
