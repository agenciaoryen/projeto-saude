import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": process.env.ANTHROPIC_API_KEY!,
  "anthropic-version": "2023-06-01",
};

const SYSTEM_JSON = `Você é um analisador nutricional. Retorne APENAS um JSON válido, sem texto adicional.

Formato exato:
{
  "itens_identificados": ["item1", "item2"],
  "macros_estimados": {
    "carboidratos_g": 0,
    "proteinas_g": 0,
    "gorduras_g": 0,
    "calorias_kcal": 0
  },
  "classificacao": "equilibrada",
  "observacao_curta": "breve observação em português"
}

Classificação deve ser uma de: "equilibrada", "leve_proteina", "alta_acucar", "alta_gordura", "vegetais_baixo"
Se não conseguir identificar, classifique como "nao_identificada".
Observação em português, 1-2 frases, tom acolhedor.`;

async function callClaudeVision(photos: string[], description: string): Promise<string> {
  const imageBlocks = photos.map((b64) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: b64.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));

  const hasMultiple = photos.length > 1;

  const system = `${SYSTEM_JSON}
${hasMultiple ? `ATENÇÃO: Você receberá ${photos.length} fotos da MESMA refeição. Se mostrarem ITENS DIFERENTES, some todos. Se forem ângulos do MESMO item, NÃO duplique.` : ""}`;

  const prompt = description
    ? `Analise ${hasMultiple ? `estas ${photos.length} fotos da refeição` : "esta refeição"}. Descrição do usuário: "${description}". ${hasMultiple ? "Fotos de itens DIFERENTES = somar tudo. Fotos do MESMO item = contar uma vez." : ""} Retorne APENAS o JSON.`
    : `Analise ${hasMultiple ? `estas ${photos.length} fotos da refeição` : "esta refeição"}. ${hasMultiple ? "Fotos de itens DIFERENTES = somar tudo. Fotos do MESMO item = contar uma vez." : ""} Retorne APENAS o JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: CLAUDE_HEADERS,
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.3,
      system,
      messages: [{ role: "user", content: [...imageBlocks, { type: "text", text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

async function callClaudeText(description: string, items: string[]): Promise<string> {
  const itemsStr = items.length > 0
    ? `Itens informados: ${items.join(", ")}. `
    : "";

  const prompt = items.length > 0
    ? `Analise esta refeição. ${itemsStr}${description ? `Descrição adicional: "${description}". ` : ""}Estime os macros e calorias baseado nos itens e quantidades típicas. Retorne APENAS o JSON.`
    : description
      ? `Analise esta refeição baseado na descrição: "${description}". Estime os macros e calorias. Retorne APENAS o JSON.`
      : `Analise esta refeição. Sem detalhes específicos, faça a melhor estimativa possível. Retorne APENAS o JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: CLAUDE_HEADERS,
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      temperature: 0.3,
      system: SYSTEM_JSON,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start >= 0 && end > start) return text.slice(start, end);
  return text;
}

function parseAnalysis(raw: string) {
  const jsonStr = extractJson(raw);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  return {
    itens: (parsed.itens_identificados || []).map((nome: string) => ({ nome })),
    macros: parsed.macros_estimados || null,
    classificacao: parsed.classificacao || "nao_identificada",
    observacao: parsed.observacao_curta || "",
    status_analise: "analisado" as const,
  };
}

async function markFailed(mealId: string, userId: string) {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("meals").update({ status_analise: "falha" }).eq("id", mealId).eq("user_id", userId);
  } catch { /* best-effort */ }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  let mealId = "";

  try {
    const body = await request.json();
    mealId = body.mealId || "";
    const { photosBase64, description, items } = body;

    const hasPhotos = photosBase64 && photosBase64.length > 0;
    const hasDescription = description && description.trim().length > 0;
    const hasItems = items && items.length > 0;

    if (!mealId) {
      return NextResponse.json({ error: "mealId obrigatorio" }, { status: 400 });
    }

    if (!hasPhotos && !hasDescription && !hasItems) {
      return NextResponse.json({ error: "photosBase64, description ou items obrigatorios" }, { status: 400 });
    }

    let raw: string;
    if (hasPhotos) {
      raw = await callClaudeVision(photosBase64, description || "");
    } else {
      const itemNames = items || [];
      raw = await callClaudeText(description || "", itemNames);
    }

    const analysis = parseAnalysis(raw);
    if (!analysis) {
      await markFailed(mealId, user.id);
      return NextResponse.json({ error: "Falha ao interpretar resposta da IA", raw }, { status: 422 });
    }

    const admin = getSupabaseAdmin();
    const { data: updated, error: updateError } = await admin
      .from("meals")
      .update({
        itens: analysis.itens,
        macros: analysis.macros,
        classificacao: analysis.classificacao,
        observacao: analysis.observacao,
        status_analise: "analisado",
      })
      .eq("id", mealId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/meals/analyze error:", error);
    await markFailed(mealId, user.id);
    return NextResponse.json(
      { error: "Erro ao analisar refeicao", detail: String(error) },
      { status: 500 }
    );
  }
}
