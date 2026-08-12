import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const GUTENDEX_BASE = "https://gutendex.com";

// Cache por 5 min server-side (Gutendex é estável, livros não mudam com frequência)
const serverCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 300_000; // 5 min

function cachedFetchGutendex(url: string) {
  const cached = serverCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCacheGutendex(url: string, data: unknown) {
  serverCache.set(url, { data, ts: Date.now() });
}

// GET /api/leitura/gutendex
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "search";

  try {
    let gutendexUrl: string;

    switch (action) {
      case "book": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
        gutendexUrl = `${GUTENDEX_BASE}/books/${id}/`;
        break;
      }
      case "popular": {
        const topic = searchParams.get("topic") || "";
        const search = searchParams.get("search") || "";
        const lang = searchParams.get("lang") || "";
        const page = searchParams.get("page") || "1";
        const params = new URLSearchParams();
        if (topic) params.set("topic", topic);
        if (search) params.set("search", search);
        if (lang) params.set("languages", lang);
        params.set("sort", "popular");
        params.set("page", page);
        gutendexUrl = `${GUTENDEX_BASE}/books/?${params.toString()}`;
        break;
      }
      case "categories": {
        // Categorias curadas — usam search (topic=self+help não existe no Gutendex)
        return NextResponse.json([
          { key: "conduct of life", label: "🧠 Autodesenvolvimento" },
          { key: "philosophy", label: "🏛️ Filosofia" },
          { key: "success", label: "💼 Sucesso", type: "search" },
          { key: "finance money", label: "💰 Finanças" },
          { key: "stoicism", label: "🗿 Estoicismo" },
          { key: "psychology", label: "🧠 Psicologia" },
        ]);
      }
      case "search":
      default: {
        const q = searchParams.get("q") || "";
        const lang = searchParams.get("lang") || "";
        const page = searchParams.get("page") || "1";
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        if (lang) params.set("languages", lang);
        params.set("page", page);
        gutendexUrl = `${GUTENDEX_BASE}/books/?${params.toString()}`;
        break;
      }
    }

    // Check cache
    const cached = cachedFetchGutendex(gutendexUrl);
    if (cached) return NextResponse.json(cached);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(gutendexUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Maya/1.0 (Reading Module)",
          "Accept": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`Gutendex error ${res.status}: ${body.slice(0, 300)}`);
        throw new Error(`Gutendex HTTP ${res.status}`);
      }
      const data = await res.json();
      setCacheGutendex(gutendexUrl, data);
      return NextResponse.json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("GET /api/leitura/gutendex error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar livros", detail: String(error) },
      { status: 500 }
    );
  }
}
