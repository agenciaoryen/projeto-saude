"use client";

import { BookmarkPlus, BookmarkCheck, BookOpen, Star } from "lucide-react";
import type { GutendexBook, UserBook } from "@/types";

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const BORDER = "rgba(167,139,250,0.15)";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";
const CARD_BG = "oklch(.17 .015 270 / .6)";

interface Props {
  book: GutendexBook;
  saved?: UserBook | null;
  onSave: (book: GutendexBook) => void;
  onRead: (book: GutendexBook) => void;
  onRemove: (saved: UserBook) => void;
}

export function BookCard({ book, saved, onSave, onRead, onRemove }: Props) {
  const coverUrl = book.formats?.["image/jpeg"] || null;
  const author = book.authors?.[0]?.name || null;
  const summary = book.summaries?.[0]?.slice(0, 200) || "";
  const lang = book.languages?.[0]?.toUpperCase() || "";

  return (
    <div
      onClick={() => onRead(book)}
      style={{
        display: "flex", gap: 12, padding: 12, borderRadius: 14,
        background: saved ? `${PURPLE_HEX}10` : CARD_BG,
        border: `1px solid ${saved ? `${PURPLE_HEX}40` : BORDER}`,
        transition: "border-color 0.2s, background 0.2s",
        cursor: "pointer",
      }}
    >
      {/* Cover */}
      <div
        style={{
          width: 72, height: 100, borderRadius: 8, flexShrink: 0,
          background: "oklch(.22 .015 270 / .5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", position: "relative",
        }}
      >
        {coverUrl ? (
          <img src={coverUrl} alt={book.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy" />
        ) : (
          <span style={{ fontSize: 28 }}>📖</span>
        )}
        {lang && (
          <span style={{
            position: "absolute", bottom: 3, right: 3,
            fontSize: 9, fontWeight: 700, color: FOREGROUND,
            background: "rgba(0,0,0,0.6)", borderRadius: 4,
            padding: "1px 5px", letterSpacing: ".03em",
          }}>
            {lang}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            margin: 0, fontSize: 14, fontWeight: 600, color: FOREGROUND,
            lineHeight: 1.3, overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          } as React.CSSProperties}>
            {book.title}
          </h4>
          {author && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED }}>
              {author}
            </p>
          )}
        </div>

        {summary && (
          <p style={{
            margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.4,
            opacity: 0.8, overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          } as React.CSSProperties}>
            {summary}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 10, color: MUTED, display: "flex", alignItems: "center", gap: 3,
          }}>
            <Star style={{ width: 10, height: 10 }} />
            {book.download_count?.toLocaleString("pt-BR") || 0}
          </span>

          <div style={{ flex: 1 }} />

          {/* Saved status or Save button */}
          {saved ? (
            <>
              {saved.status === "want_to_read" && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRead(book); }}
                  style={{
                    fontSize: 11, fontWeight: 600, color: "#fff", background: PURPLE_HEX,
                    border: 0, borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                    fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                  <BookOpen style={{ width: 12, height: 12 }} /> Ler
                </button>
              )}
              {saved.status === "reading" && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onRead(book); }}
                  style={{
                    fontSize: 11, fontWeight: 600, color: "#A78BFA", background: `${PURPLE_HEX}20`,
                    border: 0, borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                    fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                  <BookOpen style={{ width: 12, height: 12 }} /> Continuar ({Math.round(saved.progress)}%)
                </button>
              )}
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(saved); }}
                style={{
                  fontSize: 11, fontWeight: 600, color: MUTED, background: "transparent",
                  border: 0, borderRadius: 8, padding: "5px 8px", cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                <BookmarkCheck style={{ width: 14, height: 14, color: PURPLE_HEX }} />
              </button>
            </>
          ) : (
            <button type="button" onClick={(e) => { e.stopPropagation(); onSave(book); }}
              style={{
                fontSize: 11, fontWeight: 600, color: "#A78BFA",
                background: `${PURPLE_HEX}15`, border: 0,
                borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
              }}>
              <BookmarkPlus style={{ width: 12, height: 12 }} /> Salvar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
