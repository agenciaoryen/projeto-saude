import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": process.env.ANTHROPIC_API_KEY!,
  "anthropic-version": "2023-06-01",
};

const EXPENSE_IDS = ["moradia", "alimentacao", "transporte", "saude", "educacao", "lazer", "beleza", "assinaturas", "vestuario", "outros"];
const INCOME_IDS = ["salario", "freelance", "investimentos", "presente", "outros"];

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start >= 0 && end > start) return text.slice(start, end);
  return text;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { photoBase64, mediaType } = await req.json();
  if (!photoBase64) return NextResponse.json({ error: "Foto obrigatória" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const safeMediaType = (mediaType as string) || "image/jpeg";
  const cleanBase64 = (photoBase64 as string).replace(/^data:image\/\w+;base64,/, "");

  const systemPrompt = `Você analisa recibos, notas fiscais e fotos de compras. Retorne APENAS um JSON válido, sem texto adicional.

Formato exato:
{
  "type": "despesa",
  "amount": 0.00,
  "category": "categoria",
  "description": "descrição curta",
  "date": "YYYY-MM-DD"
}

Categorias de despesa: ${EXPENSE_IDS.join(", ")}
Categorias de receita: ${INCOME_IDS.join(", ")}

Regras:
- type: "despesa" para compras/pagamentos, "receita" para recebimentos
- amount: valor total em número (sem símbolo de moeda)
- category: escolha a categoria mais adequada das listas acima
- description: máximo 60 caracteres, texto simples
- date: data do recibo no formato YYYY-MM-DD; se não encontrar, use hoje: ${today}

NUNCA use markdown, apenas o JSON puro.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: CLAUDE_HEADERS,
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 256,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: safeMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: cleanBase64,
                },
              },
              { type: "text", text: "Analise este recibo e retorne o JSON." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Claude API error:", err);
      return NextResponse.json({ error: "Erro ao analisar foto" }, { status: 500 });
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? "";

    try {
      const parsed = JSON.parse(extractJson(text));
      return NextResponse.json({
        type: parsed.type ?? "despesa",
        amount: parsed.amount ?? "",
        category: parsed.category ?? "outros",
        description: parsed.description ?? "",
        date: parsed.date ?? today,
      });
    } catch {
      return NextResponse.json({ error: "Não foi possível interpretar a foto" }, { status: 422 });
    }
  } catch (error) {
    console.error("POST /api/financas/analyze error:", error);
    return NextResponse.json({ error: "Erro ao processar foto" }, { status: 500 });
  }
}
