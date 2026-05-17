import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getLocalDate } from "@/lib/utils";

interface CheckIn {
  id: string;
  date: string;
  energy_level: number | null;
  feeling: string | null;
  gratitude: string | null;
  slept_well: boolean | null;
  positives: string[];
}

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood: number | null;
}

interface Meal {
  id: string;
  data_hora: string;
  descricao: string | null;
  items: string[];
  classificacao: string | null;
  macros: {
    calorias_kcal: number;
    proteinas_g: number;
    carboidratos_g: number;
    gorduras_g: number;
  } | null;
}

interface Memory {
  id: string;
  fact: string;
  created_at: string;
}

interface Porque {
  id: string;
  text: string;
  photo_path: string | null;
}

function buildMonthlyPortraitPrompt(context: {
  name: string;
  gender: string;
  checkIns: CheckIn[];
  diary: DiaryEntry[];
  meals: Meal[];
  memories: Memory[];
  porques: Porque[];
  streak: number;
  totalCheckIns: number;
}): string {
  const { name, gender, checkIns, diary, meals, memories, porques, streak, totalCheckIns } = context;

  const nameLine = name ? `Nome: ${name}` : "";
  const genderLabel = gender === "masculino" ? "masculino" : gender === "feminino" ? "feminino" : "nao informado";

  const checkInSummary = checkIns.length > 0
    ? checkIns.map(c => {
        const energyStr = c.energy_level !== null ? `energia ${c.energy_level}/10` : "";
        const sleepStr = c.slept_well !== null ? (c.slept_well ? "dormiu bem" : "dormiu mal") : "";
        const feelStr = c.feeling ? `"${c.feeling.slice(0, 80)}"` : "";
        return `${c.date}: ${[energyStr, sleepStr, feelStr].filter(Boolean).join(" | ")}`;
      }).join("\n")
    : "sem check-ins no periodo";

  const diarySummary = diary.length > 0
    ? diary.map(d => `${d.date}: ${d.content.slice(0, 150)}`).join("\n")
    : "sem diario no periodo";

  const mealSummary = meals.length > 0
    ? `${meals.length} refeicoes registradas. ` +
      meals.filter(m => m.classificacao === "saudavel").length + " saudaveis, " +
      meals.filter(m => m.classificacao === "alta_acucar" || m.classificacao === "alta_gordura").length + " com alerta."
    : "sem refeicoes no periodo";

  const memoriesBlock = memories.length > 0
    ? memories.map(m => `- ${m.fact}`).join("\n")
    : "";

  const porquesBlock = porques.length > 0
    ? `Razoes que movem esta pessoa:\n${porques.map(p => `- ${p.text}`).join("\n")}`
    : "";

  return `Voce e um artesao de narrativas — alguem que olha para os dados de uma pessoa e devolve um retrato sensivel de quem ela esta se tornando. Voce NAO e terapeuta, NAO e analista, NAO da conselhos. Voce apenas reflete.

## IDENTIDADE DA PESSOA
${nameLine}
Genero: ${genderLabel}
Streak atual: ${streak} dias
Total de check-ins: ${totalCheckIns}

## DADOS DOS ULTIMOS 30 DIAS

### CHECK-INS
${checkInSummary}

### DIARIO
${diarySummary}

### ALIMENTACAO
${mealSummary}

${memoriesBlock ? `### O QUE EU SEI SOBRE ELA\n${memoriesBlock}` : ""}

${porquesBlock ? `### PORQUES\n${porquesBlock}` : ""}

## SUA TAREFA

Escreva um retrato de 2-3 paragrafos sobre quem esta pessoa esta se tornando. NAO e um relatorio do que ela fez. E um espelho de identidade — padroes que emergem, valores que aparecem nas escolhas, o que os dados sugerem sobre o carater e a direcao dela.

Foque em:
1. O que as escolhas revelam sobre o que ela valoriza
2. Que qualidades de carater os dados sugerem (mesmo que ela nao perceba)
3. A direcao que esses padroes apontam — nao como previsao, mas como possibilidade

**REGRAS DE OURO:**
- NUNCA use markdown, travessoes, ou formatacao
- Apenas texto plano com paragrafos
- Tom poetico mas simples — como a fala de um artesao, nao de um academico
- NUNCA diga "voce deveria" ou "e importante que voce"
- NUNCA diagnostique ou rotule
- Fale diretamente com a pessoa ("voce")
- Se houver poucos dados, seja honesto sobre isso sem ser frio
- Termine com uma pergunta aberta que convide a pessoa a se reconhecer (ou nao) no retrato

**IMPORTANTE:** Seu texto deve ser curto. No maximo 3 paragrafos. Nada de introducoes ou conclusoes longas.`;
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await admin.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextNextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();

    // 30 dias de dados
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = getLocalDate(thirtyDaysAgo);

    // Check-ins
    const { data: checkIns } = await admin
      .from("check_ins")
      .select("id, date, energy_level, feeling, gratitude, slept_well, positives")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(31);

    const recentCheckIns = (checkIns || []).filter((c: CheckIn) => c.date >= cutoff);

    // Diario
    const { data: diary } = await admin
      .from("diary_entries")
      .select("id, date, content, mood")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(15);

    const recentDiary = (diary || []).filter((d: DiaryEntry) => d.date >= cutoff);

    // Refeicoes
    const { data: meals } = await admin
      .from("meals")
      .select("id, data_hora, descricao, items, classificacao, macros")
      .eq("user_id", user.id)
      .gte("data_hora", thirtyDaysAgo.toISOString())
      .order("data_hora", { ascending: false });

    // Preferencias
    const { data: prefs } = await admin
      .from("preferences")
      .select("context")
      .eq("user_id", user.id)
      .single();

    const ctx = (prefs?.context as Record<string, unknown>) || {};
    const name = (ctx.name as string) || "";
    const gender = (ctx.gender as string) || "nao_dizer";

    // Memorias
    const { data: memories } = await admin
      .from("memories")
      .select("id, fact, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Porques
    const { data: porques } = await admin
      .from("porques")
      .select("id, text, photo_path")
      .eq("user_id", user.id);

    // Streak
    const { data: allCheckIns } = await admin
      .from("check_ins")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const dates = (allCheckIns || []).map((c: { date: string }) => c.date);
    let streak = 0;
    const today = getLocalDate();
    const checkDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    for (let i = 0; i < dates.length; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (dates.includes(checkDate(d))) streak++;
      else break;
    }

    const systemPrompt = buildMonthlyPortraitPrompt({
      name,
      gender,
      checkIns: recentCheckIns,
      diary: recentDiary,
      meals: meals || [],
      memories: memories || [],
      porques: porques || [],
      streak,
      totalCheckIns: dates.length,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: "user", content: "Escreva o retrato." }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Monthly portrait AI error:", errText);
      return NextResponse.json({ narrative: null });
    }

    const aiData = await response.json();
    const text = aiData?.content?.[0]?.text?.trim() || "";

    return NextResponse.json({ narrative: text || null });

  } catch (error) {
    console.error("Monthly portrait error:", error);
    return NextResponse.json({ narrative: null });
  }
}
