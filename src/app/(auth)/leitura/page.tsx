"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { cachedFetch } from "@/lib/fetch-cache";
import { BookOpen, Search, Library } from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { BookReader } from "@/components/BookReader";
import { toast } from "sonner";
import type { GutendexBook, GutendexResponse, UserBook } from "@/types";

// ── Design tokens ──────────────────────────────────────────────
const BG_GRADIENT: React.CSSProperties = {
  background: `
    radial-gradient(ellipse 100% 55% at 80% 0%, oklch(.58 .18 270 / .15) 0%, transparent 55%),
    radial-gradient(ellipse 70% 40% at 0% 100%, oklch(.58 .18 270 / .1) 0%, transparent 50%),
    linear-gradient(180deg, oklch(.12 .012 270) 0%, oklch(.15 .015 270) 100%)
  `,
  fontFamily: "var(--font-sans)",
  color: "#e0d6ff",
  minHeight: "100dvh",
};

const MUTED = "#9e96b5";
const BORDER = "rgba(167,139,250,0.15)";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";
const CARD_BG = "oklch(.17 .015 270 / .6)";

const CATEGORIES = [
  { key: "conduct of life", label: "🧠 Autodesenvolvimento" },
  { key: "philosophy", label: "🏛️ Filosofia" },
  { key: "success money", label: "💰 Sucesso & Finanças" },
  { key: "stoicism", label: "🗿 Estoicismo" },
  { key: "psychology", label: "🔍 Psicologia" },
  { key: "portuguese", label: "🇧🇷 Em português", lang: "pt" },
];

// ── Page ────────────────────────────────────────────────────────

export default function LeituraPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"explorar" | "biblioteca">("explorar");
  const [search, setSearch] = useState("");
  const [books, setBooks] = useState<GutendexBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Biblioteca
  const [savedBooks, setSavedBooks] = useState<UserBook[]>([]);
  const [savedMap, setSavedMap] = useState<Map<number, UserBook>>(new Map());

  // Detail modal
  const [detailBook, setDetailBook] = useState<GutendexBook | null>(null);

  // Reader
  const [reader, setReader] = useState<{
    htmlUrl: string;
    title: string;
    bookId: number;
    savedId?: string;
    progress: number;
  } | null>(null);

  // ── Load saved books ──────────────────────────────────────────

  const loadSaved = useCallback(async () => {
    try {
      const data = await cachedFetch<UserBook[]>("/api/leitura/biblioteca");
      if (Array.isArray(data)) {
        setSavedBooks(data);
        const map = new Map<number, UserBook>();
        data.forEach((b) => map.set(b.book_id, b));
        setSavedMap(map);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  // ── Search / Browse ──────────────────────────────────────────

  const doSearch = useCallback(async (query: string, category?: string | null) => {
    setLoading(true);
    setSearched(true);
    try {
      // Chamada direta à Gutendex (API pública) — evita bloqueio da Cloudflare contra IPs da Vercel
      let url: string;
      if (category) {
        if (category === "portuguese") {
          url = "https://gutendex.com/books/?languages=pt&sort=popular";
        } else {
          url = `https://gutendex.com/books/?search=${encodeURIComponent(category)}&sort=popular`;
        }
      } else if (query.trim()) {
        url = `https://gutendex.com/books/?search=${encodeURIComponent(query.trim())}`;
      } else {
        url = "https://gutendex.com/books/?topic=philosophy&sort=popular";
      }
      const data = await cachedFetch<GutendexResponse>(url);
      if (data && Array.isArray(data.results)) {
        setBooks(data.results);
      }
    } catch {
      toast.error("Erro ao buscar livros");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    doSearch("", null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search on Enter
  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setActiveCategory(null);
      doSearch(search, null);
    }
  };

  const handleCategory = (cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat.key);
    setSearch("");
    doSearch("", cat.key);
  };

  // ── Book actions ──────────────────────────────────────────────

  const handleSave = async (book: GutendexBook) => {
    try {
      const author = book.authors?.[0]?.name || null;
      const coverUrl = book.formats?.["image/jpeg"] || null;
      const res = await fetch("/api/leitura/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: book.id, title: book.title, author, cover_url: coverUrl, status: "want_to_read" }),
      });
      if (res.ok) {
        toast.success("Livro salvo!");
        await loadSaved();
      }
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const handleRemove = async (saved: UserBook) => {
    try {
      const res = await fetch(`/api/leitura/biblioteca?id=${saved.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Livro removido");
        await loadSaved();
      }
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleRead = (book: GutendexBook) => {
    // Usar URL direto do cache HTTPS — o /ebooks/{id}.html.images redireciona pra HTTP (bloqueado)
    // Padrão: https://www.gutenberg.org/cache/epub/{bookId}/pg{bookId}-images.html
    const htmlUrl = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}-images.html`;
    const saved = savedMap.get(book.id);
    setReader({
      htmlUrl,
      title: book.title,
      bookId: book.id,
      savedId: saved?.id,
      progress: saved?.progress || 0,
    });
  };

  const handleProgress = async (progress: number) => {
    const saved = reader?.savedId;
    if (!saved) return;
    try {
      await fetch("/api/leitura/biblioteca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: saved, progress }),
      });
    } catch { /* silent */ }
  };

  const handleStartReading = async () => {
    if (!reader?.savedId) return;
    try {
      await fetch("/api/leitura/biblioteca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reader.savedId, status: "reading" }),
      });
      await loadSaved();
    } catch { /* silent */ }
  };

  const handleCloseReader = async () => {
    // Save final progress before closing
    if (reader?.savedId) {
      try {
        await fetch("/api/leitura/biblioteca", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: reader.savedId, progress: reader.progress }),
        });
      } catch { /* silent */ }
    }
    setReader(null);
    await loadSaved();
  };

  const handleMarkComplete = async (saved: UserBook) => {
    try {
      await fetch("/api/leitura/biblioteca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: saved.id, status: "completed" }),
      });
      await loadSaved();
      toast.success("Leitura concluída! 🎉");
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  // ── Filtered saved ────────────────────────────────────────────

  const wantToRead = savedBooks.filter((b) => b.status === "want_to_read");
  const reading = savedBooks.filter((b) => b.status === "reading");
  const completed = savedBooks.filter((b) => b.status === "completed");

  // ── Render ────────────────────────────────────────────────────

  return (
    <div style={{ ...BG_GRADIENT, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "22px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={24} color="#A78BFA" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: FOREGROUND }}>
            Leitura
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 6 }}>
        {(["explorar", "biblioteca"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 9999, border: 0, cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 600,
              background: tab === t ? PURPLE_HEX : CARD_BG,
              color: tab === t ? "#fff" : MUTED,
              display: "flex", alignItems: "center", gap: 6,
            }}>
            {t === "explorar" ? <Search style={{ width: 14, height: 14 }} /> : <Library style={{ width: 14, height: 14 }} />}
            {t === "explorar" ? "Explorar" : "Minha Biblioteca"}
          </button>
        ))}
      </div>

      {/* ── Explorar ────────────────────────────────────────────── */}
      {tab === "explorar" && (
        <div style={{ padding: "0 20px" }}>
          {/* Search bar */}
          <div style={{
            display: "flex", gap: 8, marginBottom: 12,
            background: CARD_BG, borderRadius: 14, padding: "4px 4px 4px 16px",
            border: `1px solid ${BORDER}`, alignItems: "center",
          }}>
            <Search style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Buscar livros..."
              style={{
                flex: 1, height: 40, background: "transparent", border: 0,
                color: FOREGROUND, fontSize: 14, fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          {/* Categories */}
          <div style={{
            display: "flex", gap: 8, marginBottom: 16, overflowX: "auto",
            paddingBottom: 4, scrollbarWidth: "none",
          }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.key} type="button"
                onClick={() => handleCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 9999, border: 0, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600,
                  background: activeCategory === cat.key ? `${PURPLE_HEX}25` : "oklch(.20 .015 270 / .5)",
                  color: activeCategory === cat.key ? "#A78BFA" : MUTED,
                  whiteSpace: "nowrap", flexShrink: 0,
                  border: activeCategory === cat.key ? `1px solid ${PURPLE_HEX}40` : "1px solid transparent",
                }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  height: 120, borderRadius: 14, background: CARD_BG,
                  border: `1px solid ${BORDER}`, animation: "pulse 2s infinite",
                }} />
              ))}
            </div>
          ) : books.length === 0 && searched ? (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <span style={{ fontSize: 48 }}>📚</span>
              <p style={{ color: MUTED, fontSize: 14, marginTop: 12 }}>Nenhum livro encontrado</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  saved={savedMap.get(book.id) || null}
                  onSave={handleSave}
                  onRead={handleRead}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Biblioteca Tabs ─────────────────────────────────────── */}
      {tab === "biblioteca" && (
        <div style={{ padding: "0 20px" }}>
          {savedBooks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <span style={{ fontSize: 48 }}>📖</span>
              <p style={{ color: FOREGROUND, fontSize: 15, fontWeight: 600, margin: "12px 0 4px" }}>
                Sua estante está vazia
              </p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
                Explore a aba "Explorar" e salve livros que você quer ler
              </p>
            </div>
          ) : (
            <>
              {/* Lendo */}
              {reading.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#A78BFA", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen style={{ width: 14, height: 14 }} /> Lendo ({reading.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {reading.map((saved) => (
                      <SavedBookCard key={saved.id} saved={saved}
                        onRead={() => {
                          // Cache HTTPS direto — evita redirect HTTP do /ebooks/
                          const htmlUrl = `https://www.gutenberg.org/cache/epub/${saved.book_id}/pg${saved.book_id}-images.html`;
                          setReader({ htmlUrl, title: saved.title, bookId: saved.book_id, savedId: saved.id, progress: saved.progress });
                        }}
                        onRemove={handleRemove}
                        onComplete={handleMarkComplete}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quero Ler */}
              {wantToRead.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: MUTED, margin: "0 0 8px" }}>
                    Quero Ler ({wantToRead.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {wantToRead.map((saved) => (
                      <SavedBookCard key={saved.id} saved={saved}
                        onRead={() => {
                          const htmlUrl = `https://www.gutenberg.org/cache/epub/${saved.book_id}/pg${saved.book_id}-images.html`;
                          setReader({ htmlUrl, title: saved.title, bookId: saved.book_id, savedId: saved.id, progress: 0 });
                        }}
                        onRemove={handleRemove}
                        onComplete={() => handleMarkComplete(saved)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Concluídos */}
              {completed.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: MUTED, margin: "0 0 8px" }}>
                    Concluídos ({completed.length})
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {completed.map((saved) => (
                      <SavedBookCard key={saved.id} saved={saved}
                        onRemove={handleRemove}
                        isCompleted
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Reader ──────────────────────────────────────────────── */}
      {reader && (
        <BookReader
          htmlUrl={reader.htmlUrl}
          title={reader.title}
          bookId={reader.bookId}
          savedId={reader.savedId}
          initialProgress={reader.progress}
          onProgress={handleProgress}
          onStart={handleStartReading}
          onClose={handleCloseReader}
        />
      )}
    </div>
  );
}

// ── Saved Book Mini Card ────────────────────────────────────────

function SavedBookCard({
  saved,
  onRead,
  onRemove,
  onComplete,
  isCompleted,
}: {
  saved: UserBook;
  onRead?: () => void;
  onRemove: (saved: UserBook) => void;
  onComplete?: (saved: UserBook) => void;
  isCompleted?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12,
      background: CARD_BG, border: `1px solid ${BORDER}`,
    }}>
      {/* Cover thumbnail */}
      <div style={{
        width: 44, height: 60, borderRadius: 6, flexShrink: 0,
        background: "oklch(.22 .015 270 / .5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {saved.cover_url ? (
          <img src={saved.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 20 }}>📖</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: FOREGROUND, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {saved.title}
        </p>
        {saved.author && <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>{saved.author}</p>}

        {/* Progress bar for reading */}
        {saved.status === "reading" && saved.progress > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <div style={{
              flex: 1, maxWidth: 100, height: 3, borderRadius: 9999,
              background: "oklch(.22 .015 270 / .5)", overflow: "hidden",
            }}>
              <div style={{ height: "100%", borderRadius: 9999, background: PURPLE_HEX, width: `${Math.min(saved.progress, 100)}%` }} />
            </div>
            <span style={{ fontSize: 10, color: PURPLE_HEX, fontWeight: 700 }}>{saved.progress}%</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isCompleted && (
        <div style={{ display: "flex", gap: 4 }}>
          {onRead && (
            <button type="button" onClick={onRead}
              style={{
                fontSize: 11, fontWeight: 600, color: "#fff", background: PURPLE_HEX,
                border: 0, borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
              {saved.status === "reading" ? "Continuar" : "Ler"}
            </button>
          )}
          {onComplete && (
            <button type="button" onClick={() => onComplete(saved)}
              style={{
                fontSize: 11, fontWeight: 600, color: MUTED,
                background: "transparent", border: 0,
                padding: "5px 6px", cursor: "pointer", fontFamily: "inherit",
              }}>
              ✓
            </button>
          )}
          <button type="button" onClick={() => onRemove(saved)}
            style={{
              fontSize: 11, fontWeight: 600, color: MUTED,
              background: "transparent", border: 0,
              padding: "5px 6px", cursor: "pointer", fontFamily: "inherit",
            }}>
            ✕
          </button>
        </div>
      )}
      {isCompleted && (
        <span style={{ fontSize: 11, color: "oklch(0.45 0.15 160)", fontWeight: 600 }}>✓ Lido</span>
      )}
    </div>
  );
}
