import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";
import { sumMacros } from "@/lib/meal-utils";

function buildWeeklyPrompt(data: {
  checkIns: Record<string, unknown>[];
  meals: Record<string, unknown>[];
  diary: Record<string, unknown>[];
  userName: string;
}): string {
  const parts: string[] = [];

  // Check-ins da semana
  if (data.checkIns.length > 0) {
    const ciLines = data.checkIns.map((c: Record<string, unknown>) => {
      const segs: string[] = [];
      if (c.feeling) segs.push(`sentimento: "${c.feeling}"`);
      if (c.energy_level != null) segs.push(`energia: ${c.energy_level}/10`);
      if (c.slept_well != null) segs.push(`dormiu bem: ${c.slept_well ? "sim" : "não"}`);
      if (c.stress_level != null) segs.push(`estresse: ${c.stress_level}/10`);
      return `${c.date}: ${segs.join(", ") || "sem detalhes"}`;
    });
    parts.push("CHECK-INS:\n" + ciLines.join("\n"));
  }

  // Refeições
  const analyzedMeals = data.meals.filter((m: Record<string, unknown>) => m.macros && m.status_analise === "analisado");
  if (analyzedMeals.length > 0) {
    const total = sumMacros(analyzedMeals as { macros: { carboidratos_g: number; proteinas_g: number; gorduras_g: number; calorias_kcal: number } | null }[]);
    const foods = new Set(
      analyzedMeals.flatMap((m: Record<string, unknown>) =>
        ((m.itens as { nome: string }[]) || []).map((i) => i.nome.toLowerCase())
      )
    );
    parts.push(
      `REFEICOES: ${analyzedMeals.length} analisadas na semana. ` +
      `Total: ${Math.round(total.calorias_kcal)} kcal. ` +
      `Alimentos: ${[...foods].slice(0, 15).join(", ")}.`
    );
  } else {
    parts.push("REFEICOES: Poucas ou nenhuma refeição analisada na semana.");
  }

  // Diário
  if (data.diary.length > 0) {
    const dLines = data.diary.map((d: Record<string, unknown>) =>
      `${d.date}: ${(d.content as string).slice(0, 120)}`
    );
    parts.push("DIARIO:\n" + dLines.join("\n"));
  }

  const nome = data.userName || "usuário";

  return `Você é um ESPELHO — você reflete de volta o que vê, sem julgar, sem prescrever, sem dar conselhos.

Seu trabalho: escrever uma narrativa curta sobre a semana de ${nome} baseada nos dados abaixo.

REGRAS:
- NUNCA diga o que a pessoa "deve" ou "precisa" fazer
- NUNCA julgue os dados como bons ou ruins
- APENAS reflita padrões: "quando X aconteceu, Y apareceu"
- Use o nome da pessoa naturalmente
- Tom: cálido, humano, como quem se importa
- Escreva 3-5 parágrafos curtos
- Use português brasileiro natural
- NUNCA use markdown, asteriscos, travessões
- Apenas pontuação comum: vírgula, ponto final, dois pontos
- Comece com um parágrafo que acolhe a semana como um todo

DADOS DE ${nome}:

${parts.join("\n\n")}

Escreva o espelho da semana de ${nome}:`;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = getLocalDate();

    const [mealsRes, checkInsRes, diaryRes, prefsRes] = await Promise.all([
      admin.from("meals").select("*").eq("user_id", user.id).gte("data_hora", sevenDaysAgo.toISOString()).order("data_hora"),
      admin.from("check_ins").select("*").eq("user_id", user.id).gte("date", sevenDaysAgo.toISOString().slice(0, 10)).order("date"),
      admin.from("diary_entries").select("*").eq("user_id", user.id).gte("date", sevenDaysAgo.toISOString().slice(0, 10)).order("date").limit(5),
      admin.from("preferences").select("context").eq("user_id", user.id).single(),
    ]);

    const userName = (prefsRes.data?.context as Record<string, unknown>)?.name as string || "";

    const prompt = buildWeeklyPrompt({
      checkIns: checkInsRes.data || [],
      meals: mealsRes.data || [],
      diary: diaryRes.data || [],
      userName,
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
        max_tokens: 600,
        temperature: 0.7,
        system: prompt,
        messages: [{ role: "user", content: "Gere o espelho da semana." }],
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    return NextResponse.json({ narrative: data.content?.[0]?.text || "" });
  } catch (error) {
    console.error("POST /api/reflect/weekly error:", error);
    return NextResponse.json({ error: "Erro ao gerar espelho" }, { status: 500 });
  }
}
