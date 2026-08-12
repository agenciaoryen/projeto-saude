"use client";

import { BookOpen, Check, Edit3, Trash2, RotateCcw } from "lucide-react";
import type { ReadingBook } from "@/types";

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const BORDER = "rgba(167,139,250,0.15)";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";
const CARD_BG = "oklch(.17 .015 270 / .6)";

const STATUS_LABEL: Record<ReadingBook["status"], { label: string; color: string }> = {
  lendo: { label: "Lendo", color: "#A78BFA" },
  quero_ler: { label: "Quero ler", color: MUTED },
  concluido: { label: "Concluído", color: "oklch(0.55 0.15 160)" },
  abandonado: { label: "Abandonado", color: "oklch(0.6 0.12 20)" },
};

interface Props {
  book: ReadingBook;
  onLogSession: (book: ReadingBook) => void;
  onComplete: (book: ReadingBook) => void;
  onReopen: (book: ReadingBook) => void;
  onEdit: (book: ReadingBook) => void;
  onDelete: (book: ReadingBook) => void;
}

export function ReadingBookCard({ book, onLogSession, onComplete, onReopen, onEdit, onDelete }: Props) {
  const status = STATUS_LABEL[book.status];
  const hasTotal = book.total_pages && book.total_pages > 0;
  const pct = hasTotal
    ? Math.min(100, Math.round((book.current_page / (book.total_pages as number)) * 100))
    : 0;

  return (
    <div style={{
      padding: 14, borderRadius: 14,
      background: CARD_BG, border: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", gap: 12 }}>
        {/* Emoji cover */}
        <div style={{
          width: 46, height: 60, borderRadius: 8, flexShrink: 0,
          background: "oklch(.22 .015 270 / .5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
        }}>
          {book.emoji || "📖"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <h4 style={{
              margin: 0, fontSize: 14, fontWeight: 600, color: FOREGROUND,
              lineHeight: 1.3, flex: 1, minWidth: 0,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              {book.title}
            </h4>
            <span style={{
              fontSize: 10, fontWeight: 700, color: status.color,
              background: "oklch(.22 .015 270 / .6)", borderRadius: 9999,
              padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {status.label}
            </span>
          </div>

          {(book.author || book.genre) && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED }}>
              {[book.author, book.genre].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Progresso */}
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                flex: 1, height: 4, borderRadius: 9999,
                background: "oklch(.22 .015 270 / .5)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 9999, background: PURPLE_HEX,
                  width: `${pct}%`, transition: "width 0.4s ease",
                }} />
              </div>
              <span style={{ fontSize: 10, color: PURPLE_HEX, fontWeight: 700, whiteSpace: "nowrap" }}>
                {hasTotal
                  ? `${book.current_page}/${book.total_pages} pág`
                  : book.current_page > 0
                    ? `${book.current_page} pág`
                    : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notas */}
      {book.notes && (
        <p style={{
          margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.4, opacity: 0.85,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as React.CSSProperties}>
          💭 {book.notes}
        </p>
      )}

      {/* Ações */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {book.status !== "concluido" ? (
          <button type="button" onClick={() => onLogSession(book)}
            style={{
              fontSize: 11, fontWeight: 600, color: "#fff", background: PURPLE_HEX,
              border: 0, borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
            <BookOpen style={{ width: 12, height: 12 }} />
            {book.status === "lendo" ? "Registrar leitura" : "Começar"}
          </button>
        ) : (
          <button type="button" onClick={() => onReopen(book)}
            style={{
              fontSize: 11, fontWeight: 600, color: "#A78BFA", background: `${PURPLE_HEX}15`,
              border: 0, borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
            <RotateCcw style={{ width: 12, height: 12 }} /> Reabrir
          </button>
        )}

        <div style={{ flex: 1 }} />

        {book.status !== "concluido" && (
          <IconBtn title="Concluir" onClick={() => onComplete(book)} color="oklch(0.55 0.15 160)">
            <Check style={{ width: 14, height: 14 }} />
          </IconBtn>
        )}
        <IconBtn title="Editar" onClick={() => onEdit(book)} color={MUTED}>
          <Edit3 style={{ width: 14, height: 14 }} />
        </IconBtn>
        <IconBtn title="Remover" onClick={() => onDelete(book)} color={MUTED}>
          <Trash2 style={{ width: 14, height: 14 }} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, color, children }: {
  title: string;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 8, cursor: "pointer",
        background: "transparent", border: 0, color,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
      {children}
    </button>
  );
}
