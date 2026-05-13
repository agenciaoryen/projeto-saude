import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function callClaudeVision(base64: string, description: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      temperature: 0.3,
      system: `Você é um analisador nutricional. Analise fotos de refeições e retorne APENAS um JSON válido, sem texto adicional.

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
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64.replace(/^data:image\/\w+;base64,/, ""),
              },
            },
            {
              type: "text",
              text: description
                ? `Analise esta refeição. Descrição do usuário: "${description}". Retorne APENAS o JSON.`
                : "Analise esta refeição. Retorne APENAS o JSON.",
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
    const { photoBase64, description } = body;

    if (!mealId || !photoBase64) {
      return NextResponse.json({ error: "mealId e photoBase64 obrigatorios" }, { status: 400 });
    }

    const raw = await callClaudeVision(photoBase64, description || "");
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
