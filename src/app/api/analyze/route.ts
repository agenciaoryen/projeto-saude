import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildAnalysisPrompt, buildFactExtractionPrompt } from "@/lib/analyzer";
import { calculateStreak } from "@/lib/utils";
import { NextResponse } from "next/server";

async function callAnthropic(prompt: string, system: string, maxTokens = 500): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature: 0.7,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();

    const [prefsRes, checkInsRes, diaryRes, memoriesRes] = await Promise.all([
      admin.from("user_preferences").select("context, enabled_questions").eq("user_id", user.id).single(),
      admin.from("check_ins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
      admin.from("diary_entries").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
      admin.from("user_memories").select("fact").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    const context = (prefsRes.data?.context || {}) as Record<string, unknown>;
    const checkIns = checkInsRes.data || [];
    const diaryEntries = diaryRes.data || [];
    const memories = (memoriesRes.data || []).map((m: { fact: string }) => m.fact);

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

    const streak = calculateStreak(checkIns.map((c: Record<string, unknown>) => c.date as string));

    const analysisPrompt = buildAnalysisPrompt({
      profile: {
        name: (user.user_metadata?.name as string) || "",
        gender: (context.gender as string) || "nao_dizer",
        has_medication: context.has_medication === true,
        has_faith: context.has_faith === true,
        has_creative_hobby: context.has_creative_hobby === true,
      },
      checkIns,
      diaryEntries,
      memories,
      streak,
      totalCheckIns: checkIns.length,
      positiveRate,
    });

    const analysis = await callAnthropic(
      analysisPrompt,
      "Você é Maya, uma companheira gentil que ajuda pessoas a se conhecerem melhor através de check-ins diários, diário e hábitos. Você fala português brasileiro com naturalidade e afeto.",
      500
    );

    // Extract new facts from the analysis (fire and forget)
    const userName = (user.user_metadata?.name as string) || "";
    const factPrompt = buildFactExtractionPrompt(analysis, { name: userName });

    callAnthropic(factPrompt, "Extraia fatos pessoais como JSON array. Responda APENAS com o array JSON.", 150)
      .then((raw) => {
        try {
          const jsonStart = raw.indexOf("[");
          const jsonEnd = raw.lastIndexOf("]") + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const facts: string[] = JSON.parse(raw.slice(jsonStart, jsonEnd));
            for (const fact of facts) {
              if (fact && fact.trim().length >= 3) {
                admin.from("user_memories").insert({
                  user_id: user.id,
                  fact: fact.trim(),
                }).then(() => {}).catch(() => {});
              }
            }
          }
        } catch {
          // silent — fact extraction is best-effort
        }
      })
      .catch(() => {});

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar dados", detail: String(error) },
      { status: 500 }
    );
  }
}
