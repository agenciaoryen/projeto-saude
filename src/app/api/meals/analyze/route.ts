import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      temperature: 0.3,
      system: `Você é um analisador nutricional. Analise fotos de uma refeição e retorne APENAS um JSON válido, sem texto adicional.

${hasMultiple ? `ATENÇÃO: Você receberá ${photos.length} fotos da MESMA refeição. Elas podem mostrar:
- Itens diferentes (ex: foto 1 = prato principal, foto 2 = salada, foto 3 = sobremesa)
- Ou o mesmo item de ângulos diferentes

Seu trabalho:
- Se as fotos mostram ITENS DIFERENTES, some todos eles na análise
- Se são o MESMO item de ângulos diferentes, NÃO duplique — conte uma só vez
- Use o bom senso: se uma foto tem um prato e outra tem uma fruta, são itens diferentes` : ""}

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
Se não conseguir identificar, classifique como "nao_identificada" e explique na observação.
Observação em português, 1-2 frases, tom acolhedor.`,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: description
                ? `Analise ${hasMultiple ? `estas ${photos.length} fotos da refeição` : "esta refeição"}. Descrição do usuário: "${description}". ${hasMultiple ? "Lembre: fotos de ângulos diferentes do MESMO item = contar uma vez. Fotos de itens DIFERENTES = somar tudo." : ""} Retorne APENAS o JSON.`
                : `Analise ${hasMultiple ? `estas ${photos.length} fotos da refeição` : "esta refeição"}. ${hasMultiple ? "Lembre: fotos de ângulos diferentes do MESMO item = contar uma vez. Fotos de itens DIFERENTES = somar tudo." : ""} Retorne APENAS o JSON.`,
            },
          ],
        },
      ],
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

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  // Salva mealId antes de consumir o body, para usar no catch
  let mealId = "";

  try {
    const body = await request.json();
    mealId = body.mealId || "";
    const { photosBase64, description } = body;

    if (!mealId || !photosBase64 || photosBase64.length === 0) {
      return NextResponse.json({ error: "mealId e photosBase64 (array) obrigatorios" }, { status: 400 });
    }

    const raw = await callClaudeVision(photosBase64, description || "");
    const jsonStr = extractJson(raw);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Marca como falha para não travar o cliente
      const admin = getSupabaseAdmin();
      await admin.from("meals").update({ status_analise: "falha" }).eq("id", mealId).eq("user_id", user.id);
      return NextResponse.json({
        error: "Falha ao interpretar resposta da IA",
        raw,
      }, { status: 422 });
    }

    const analysis = {
      itens: (parsed.itens_identificados || []).map((nome: string) => ({ nome })),
      macros: parsed.macros_estimados || null,
      classificacao: parsed.classificacao || "nao_identificada",
      observacao: parsed.observacao_curta || "",
      status_analise: "analisado" as const,
    };

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

    // Marca como falha para destravar o cliente
    if (mealId) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from("meals").update({ status_analise: "falha" }).eq("id", mealId).eq("user_id", user.id);
      } catch { /* best-effort */ }
    }

    return NextResponse.json(
      { error: "Erro ao analisar refeicao", detail: String(error) },
      { status: 500 }
    );
  }
}
