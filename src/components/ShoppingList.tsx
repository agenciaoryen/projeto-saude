"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { cachedFetch, invalidateFetchCache } from "@/lib/fetch-cache";
import { Plus, X, ShoppingCart, Trash2, CheckSquare, Square, Minus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { ShoppingItem } from "@/types";

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const BORDER = "rgba(167,139,250,0.15)";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";
const DARK_CARD = "oklch(.17 .015 270 / .6)";

// ── Helpers ────────────────────────────────────────────────────

/** Reorder an array by moving an item from one index to another */
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/** Reassign sequential positions and persist to API */
async function persistOrder(items: ShoppingItem[]) {
  const payload = items.map((item, i) => ({ id: item.id, position: i }));
  try {
    await fetch("/api/shopping-list", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: payload }),
    });
  } catch {
    // silent
  }
}

export function ShoppingList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await cachedFetch<ShoppingItem[]>("/api/shopping-list");
      if (Array.isArray(data)) setItems(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Add ────────────────────────────────────────────────────

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

  // ── Toggle (checked ↔ unchecked) + auto-reorder ────────────

  const handleToggle = async (item: ShoppingItem) => {
    if (selectionMode) return;

    const newChecked = !item.checked;
    // Optimistic: update checked state
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === item.id ? { ...i, checked: newChecked } : i
      );
      // Sort: unchecked first (by position), then checked (by position)
      const unchecked = updated.filter((i) => !i.checked);
      const checked = updated.filter((i) => i.checked);
      return [...unchecked, ...checked];
    });

    try {
      const res = await fetch("/api/shopping-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, checked: newChecked }),
      });
      if (!res.ok) throw new Error();

      // Persist the new order
      const unchecked = items
        .filter((i) => i.id !== item.id && !i.checked)
        .concat(newChecked ? [] : [{ ...item, checked: false }]);
      const checked = items
        .filter((i) => i.id !== item.id && i.checked)
        .concat(newChecked ? [{ ...item, checked: true }] : []);
      await persistOrder([...unchecked, ...checked]);
    } catch {
      loadItems(); // rollback on error
    }
  };

  // ── Delete ─────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/shopping-list?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Erro ao remover");
      loadItems();
    }
  };

  // ── Limpar concluídos (uncheck only) ───────────────────────

  const handleClearChecked = async () => {
    const checked = items.filter((i) => i.checked);
    if (checked.length === 0) return;

    setItems((prev) => prev.map((i) => (i.checked ? { ...i, checked: false } : i)));

    let failed = false;
    for (const item of checked) {
      try {
        const res = await fetch("/api/shopping-list", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, checked: false }),
        });
        if (!res.ok) failed = true;
      } catch {
        failed = true;
      }
    }
    if (failed) {
      toast.error("Erro ao desmarcar alguns itens");
      loadItems();
    }
  };

  // ── Drag & drop ────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (selectionMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragOverIndex = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIndex.current = index;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    dragOverIndex.current = null;

    if (from === null || from === index) return;

    const reordered = reorder(items, from, index);
    const withPositions = reordered.map((item, i) => ({ ...item, position: i }));
    setItems(withPositions);
    persistOrder(withPositions);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    dragOverIndex.current = null;
  };

  // ── Selection mode ─────────────────────────────────────────

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const toDelete = [...selectedIds];

    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);

    let failed = false;
    for (const id of toDelete) {
      try {
        const res = await fetch(`/api/shopping-list?id=${id}`, { method: "DELETE" });
        if (!res.ok) failed = true;
      } catch {
        failed = true;
      }
    }
    if (failed) {
      toast.error("Erro ao remover alguns itens");
      loadItems();
    } else {
      toast.success(`${toDelete.length} item(ns) removido(s)`);
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Input */}
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

      {/* Toolbar */}
      {!loading && items.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 8, flexShrink: 0, gap: 8, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, color: MUTED }}>
            {uncheckedCount} {uncheckedCount === 1 ? "pendente" : "pendentes"}
            {checkedCount > 0 && ` · ${checkedCount} concluído${checkedCount > 1 ? "s" : ""}`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {!selectionMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectionMode(true)}
                  style={{
                    background: "none", border: 0, cursor: "pointer",
                    fontSize: 11, color: MUTED, fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <CheckSquare style={{ width: 12, height: 12 }} />
                  Selecionar
                </button>
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
                    <Minus style={{ width: 12, height: 12 }} />
                    Limpar concluídos
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={allSelected ? deselectAll : selectAll}
                  style={{
                    background: "none", border: 0, cursor: "pointer",
                    fontSize: 11, color: MUTED, fontFamily: "inherit",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                  <Square style={{ width: 12, height: 12 }} />
                  {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                </button>
                {selectedIds.size > 0 && (
                  <button type="button" onClick={deleteSelected}
                    style={{
                      background: "none", border: 0, cursor: "pointer",
                      fontSize: 11, color: "oklch(0.55 0.18 15)", fontFamily: "inherit",
                      display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600,
                    }}>
                    <Trash2 style={{ width: 12, height: 12 }} />
                    Excluir ({selectedIds.size})
                  </button>
                )}
                <button type="button" onClick={exitSelection}
                  style={{
                    background: "none", border: 0, cursor: "pointer",
                    fontSize: 11, color: "#A78BFA", fontFamily: "inherit", fontWeight: 600,
                  }}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* List */}
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
            {items.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const isDragging = dragIndex.current === index;
              const isDragOver = dragOverIndex.current === index && dragIndex.current !== index;

              return (
                <div
                  key={item.id}
                  draggable={!selectionMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOverIndex(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 10px 10px 6px", borderRadius: 12,
                    background: isSelected
                      ? `${PURPLE_HEX}20`
                      : item.checked
                        ? "transparent"
                        : DARK_CARD,
                    border: isSelected
                      ? `1px solid ${PURPLE_HEX}`
                      : isDragOver
                        ? `1px dashed ${PURPLE_HEX}`
                        : item.checked
                          ? "1px solid transparent"
                          : `1px solid ${BORDER}`,
                    opacity: isDragging ? 0.4 : 1,
                    transition: "all 0.15s",
                    cursor: selectionMode ? "default" : "grab",
                  }}
                >
                  {/* Drag handle (grip icon) — only outside selection mode */}
                  {!selectionMode && (
                    <div
                      style={{
                        width: 18, height: 28, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "grab", color: MUTED, opacity: 0.5,
                        touchAction: "none",
                      }}
                    >
                      <GripVertical style={{ width: 14, height: 14 }} />
                    </div>
                  )}

                  {/* Selection checkbox */}
                  {selectionMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelection(item.id)}
                      style={{
                        width: 22, height: 22, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "none", border: 0, cursor: "pointer", padding: 0,
                      }}
                    >
                      {isSelected ? (
                        <CheckSquare style={{ width: 20, height: 20, color: PURPLE_HEX }} />
                      ) : (
                        <Square style={{ width: 20, height: 20, color: MUTED }} />
                      )}
                    </button>
                  )}

                  {/* Completed checkbox */}
                  {!selectionMode && (
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
                  )}

                  {/* Name */}
                  <span
                    onClick={() => !selectionMode && handleToggle(item)}
                    style={{
                      flex: 1, fontSize: 14, minWidth: 0,
                      color: item.checked ? MUTED : FOREGROUND,
                      textDecoration: item.checked ? "line-through" : "none",
                      transition: "all 0.2s",
                      cursor: selectionMode ? "default" : "pointer",
                    }}
                  >
                    {item.item_name}
                  </span>

                  {/* Category tag */}
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

                  {/* Delete (outside selection mode) */}
                  {!selectionMode && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      style={{
                        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                        background: "none", border: 0, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0.4,
                      }}
                    >
                      <X style={{ width: 14, height: 14, color: MUTED }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
