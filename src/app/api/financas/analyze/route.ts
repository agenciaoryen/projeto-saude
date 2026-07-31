import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { callLLM, toImageBlock } from "@/lib/llm";

const EXPENSE_IDS = ["moradia", "alimentacao", "transporte", "saude_beleza", "educacao", "lazer", "pessoal", "servicos_fin", "comunicacao", "doacoes", "pet", "personalizada"];
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
  "subcategory": "subcategoria",
  "description": "descrição curta",
  "date": "YYYY-MM-DD"
}

Categorias de despesa: ${EXPENSE_IDS.join(", ")}
Categorias de receita: ${INCOME_IDS.join(", ")}

Regras:
- type: "despesa" para compras/pagamentos, "receita" para recebimentos
- amount: valor total em número (sem símbolo de moeda)
- category: escolha a categoria mais adequada das listas acima
- subcategory: texto curto descrevendo a subcategoria específica (ex: "Supermercado", "Uber", "Plano de Saúde")
- description: máximo 60 caracteres, texto simples
- date: data do recibo no formato YYYY-MM-DD; se não encontrar, use hoje: ${today}

NUNCA use markdown, apenas o JSON puro.`;

  try {
    const imageDataUrl = `data:${safeMediaType};base64,${cleanBase64}`;

    const text = await callLLM(systemPrompt, [
      { type: "text", text: "Analise este recibo e retorne o JSON." },
      toImageBlock(imageDataUrl),
    ], { maxTokens: 256, temperature: 0.1 });

    try {
      const parsed = JSON.parse(extractJson(text));
      return NextResponse.json({
        type: parsed.type ?? "despesa",
        amount: parsed.amount ?? "",
        category: parsed.category ?? "outros",
        subcategory: parsed.subcategory ?? "",
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
