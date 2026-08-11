"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { cachedFetch, invalidateFetchCache } from "@/lib/fetch-cache";
import { Plus, X, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ShoppingItem } from "@/types";

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const BORDER = "rgba(167,139,250,0.15)";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";
const DARK_CARD = "oklch(.17 .015 270 / .6)";

export function ShoppingList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadItems = async () => {
    try {
      const data = await cachedFetch<ShoppingItem[]>("/api/shopping-list");
      if (Array.isArray(data)) setItems(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async () => {
    const name = input.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: name }),
      });
      if (!res.ok) throw new Error();
      setInput("");
      invalidateFetchCache("/api/shopping-list");
      await loadItems();
      inputRef.current?.focus();
    } catch {
      toast.error("Erro ao adicionar");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
    );
    try {
      const res = await fetch("/api/shopping-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, checked: !item.checked }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i))
      );
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/shopping-list?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Erro ao remover");
      loadItems(); // refresh
    }
  };

  const handleClearChecked = async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    setItems((prev) => prev.filter((i) => !i.checked));
    try {
      const res = await fetch("/api/shopping-list?clearChecked=true", { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Erro ao limpar");
      loadItems();
    }
  };

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Input ─────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, padding: "0 0 12px", flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("lista_input_placeholder")}
          style={{
            flex: 1, height: 44, borderRadius: 12, border: `1px solid ${BORDER}`,
            background: "oklch(.18 .015 270 / .5)", color: FOREGROUND,
            fontSize: 14, fontFamily: "inherit", padding: "0 14px", outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 12, border: 0, cursor: "pointer",
            background: input.trim() ? PURPLE_HEX : "oklch(.22 .015 270 / .5)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            opacity: input.trim() ? 1 : 0.4, flexShrink: 0,
          }}
        >
          <Plus style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ── Count ─────────────────────────────────────────── */}
      {!loading && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: MUTED }}>
            {uncheckedCount} {uncheckedCount === 1 ? "pendente" : "pendentes"}
            {checkedCount > 0 && ` · ${checkedCount} concluído${checkedCount > 1 ? "s" : ""}`}
          </span>
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={handleClearChecked}
              style={{
                background: "none", border: 0, cursor: "pointer",
                fontSize: 11, color: MUTED, fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              {t("lista_limpar")}
            </button>
          )}
        </div>
      )}

      {/* ── List ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: MUTED, fontSize: 13, padding: "24px 0" }}>
            Carregando...
          </p>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "32px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          }}>
            <ShoppingCart style={{ width: 40, height: 40, color: MUTED, opacity: 0.5 }} />
            <div>
              <p style={{ fontWeight: 500, color: FOREGROUND, fontSize: 14, margin: 0 }}>
                {t("lista_vazia")}
              </p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, margin: "4px 0 0" }}>
                {t("lista_vazia_desc")}
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: item.checked ? "transparent" : DARK_CARD,
                  border: item.checked ? "1px solid transparent" : `1px solid ${BORDER}`,
                  transition: "all 0.2s",
                }}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: item.checked ? "none" : `1.5px solid ${BORDER}`,
                    background: item.checked ? PURPLE_HEX : "transparent",
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {item.checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Name */}
                <span style={{
                  flex: 1, fontSize: 14, minWidth: 0,
                  color: item.checked ? MUTED : FOREGROUND,
                  textDecoration: item.checked ? "line-through" : "none",
                  transition: "all 0.2s",
                }}>
                  {item.item_name}
                </span>

                {/* Category tag (only if not 'geral') */}
                {item.category !== "geral" && (
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 9999,
                    background: "oklch(.58 .18 270 / .10)",
                    color: "oklch(.58 .18 270)",
                    textTransform: "uppercase", letterSpacing: ".04em",
                  }}>
                    {item.category}
                  </span>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: "none", border: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0.4,
                  }}
                >
                  <X style={{ width: 14, height: 14, color: MUTED }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
