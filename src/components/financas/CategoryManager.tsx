"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { t as tFn } from "@/lib/i18n";
import { EXPENSE_CATS, INCOME_CATS, type UserCategory, type CustomCat } from "@/lib/financas-categories";
import { CategoryFormModal } from "./CategoryFormModal";

const SURFACE = "#151520";
const CARD = "#1a1530";
const BORDER = "rgba(167,139,250,0.15)";
const ACCENT = "#7C5CFF";
const TEXT = "#e0d6ff";
const TEXT_SEC = "#9e96b5";
const RED = "#FF5C5C";

export function CategoryManager({
  type, hiddenIds, userCategories, customCat, lang,
  onHiddenChange, onCategoriesChange, onClose,
}: {
  type: "receita" | "despesa";
  hiddenIds: string[];
  userCategories: UserCategory[];
  customCat: CustomCat | null;
  lang: Lang;
  onHiddenChange: (ids: string[]) => void;
  onCategoriesChange: () => void;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState<"receita" | "despesa">(type);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<UserCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaults = selectedType === "despesa" ? EXPENSE_CATS : INCOME_CATS;
  const filteredUserCats = userCategories.filter((c) => c.type === selectedType);

  const toggleHidden = async (catId: string) => {
    const next = hiddenIds.includes(catId)
      ? hiddenIds.filter((id) => id !== catId)
      : [...hiddenIds, catId];
    onHiddenChange(next);
    // Persist
    const prefsRes = await fetch("/api/preferences").then((r) => r.json());
    const ctx = prefsRes.context ?? {};
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context: { ...ctx, hidden_fin_cats: next } }),
    });
  };

  const handleDelete = async (catId: string) => {
    setSaving(true);
    await fetch(`/api/financas/categories/${catId}`, { method: "DELETE" });
    setSaving(false);
    setDeleteConfirm(null);
    onCategoriesChange();
  };

  const handleCreate = async (data: { name: string; emoji: string; hue: number; subcats: string[] }) => {
    await fetch("/api/financas/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, type: selectedType }),
    });
    setShowForm(false);
    onCategoriesChange();
  };

  const handleEdit = async (data: { name: string; emoji: string; hue: number; subcats: string[] }) => {
    if (!editCat) return;
    await fetch(`/api/financas/categories/${editCat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditCat(null);
    onCategoriesChange();
  };

  const sectionTitle: React.CSSProperties = {
    margin: "0 0 10px", fontSize: 10, fontWeight: 700,
    letterSpacing: ".1em", textTransform: "uppercase", color: "#A78BFA",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 85, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 95,
        borderRadius: "24px 24px 0 0", background: SURFACE,
        padding: "20px 20px calc(env(safe-area-inset-bottom) + 28px)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
        maxHeight: "90dvh", overflowY: "auto",
        border: `1px solid ${BORDER}`,
      }}>
        {/* Handle + Header */}
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: "rgba(167,139,250,0.2)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TEXT }}>Gerenciar categorias</h2>
          <button type="button" onClick={onClose} style={{ border: 0, background: "#0B0B10", borderRadius: 10, padding: 8, cursor: "pointer" }}>
            <X size={18} style={{ color: TEXT_SEC }} />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["despesa", "receita"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setSelectedType(t)} style={{
              flex: 1, padding: "10px", borderRadius: 12, border: 0, cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              background: selectedType === t ? "rgba(124,92,255,0.1)" : "#0B0B10",
              color: selectedType === t ? ACCENT : TEXT_SEC,
              transition: "all .15s ease",
            }}>
              {t === "despesa" ? "Despesas" : "Receitas"}
            </button>
          ))}
        </div>

        {/* Default categories */}
        <p style={sectionTitle}>Categorias padrão</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {defaults.filter((c) => !c.custom && !c.system).map((c) => {
            const hidden = hiddenIds.includes(c.id);
            return (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: CARD, border: `1px solid ${BORDER}`,
                opacity: hidden ? 0.45 : 1,
              }}>
                <span style={{ fontSize: 18 }}>{c.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT }}>
                  {tFn(lang, `fin_cat_${c.id}`)}
                </span>
                <button type="button" onClick={() => toggleHidden(c.id)} style={{
                  border: 0, background: "transparent", cursor: "pointer", padding: 6,
                  color: hidden ? TEXT_SEC : ACCENT,
                }}>
                  {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            );
          })}

          {/* Legacy personalizada */}
          {customCat && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12,
              background: CARD, border: `1px solid ${BORDER}`,
              opacity: 0.5,
            }}>
              <span style={{ fontSize: 18 }}>{customCat.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT }}>
                {customCat.name} <span style={{ fontSize: 10, color: TEXT_SEC }}>(legado)</span>
              </span>
            </div>
          )}
        </div>

        {/* User categories */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={sectionTitle}>Suas categorias</p>
          <button type="button" onClick={() => setShowForm(true)} style={{
            border: 0, background: "transparent", cursor: "pointer", padding: 2,
            color: ACCENT, display: "flex", alignItems: "center", gap: 4,
            fontFamily: "inherit", fontSize: 12, fontWeight: 700,
          }}>
            <Plus size={14} /> Nova
          </button>
        </div>

        {filteredUserCats.length === 0 ? (
          <p style={{ fontSize: 12, color: TEXT_SEC, fontStyle: "italic", textAlign: "center", padding: "16px 0", margin: 0 }}>
            Nenhuma categoria criada ainda
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredUserCats.map((uc) => (
              <div key={uc.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12,
                background: CARD, border: `1px solid ${BORDER}`,
              }}>
                <span style={{ fontSize: 18 }}>{uc.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT }}>{uc.name}</span>
                <button type="button" onClick={() => setEditCat(uc)} style={{
                  border: 0, background: "transparent", cursor: "pointer", padding: 6, color: TEXT_SEC,
                }}>
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => setDeleteConfirm(uc.id)} style={{
                  border: 0, background: "transparent", cursor: "pointer", padding: 6, color: RED,
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CategoryFormModal
          mode="create"
          type={selectedType}
          lang={lang}
          onClose={() => setShowForm(false)}
          onSaved={handleCreate}
        />
      )}

      {/* Edit form */}
      {editCat && (
        <CategoryFormModal
          mode="edit"
          type={editCat.type}
          initial={{ name: editCat.name, emoji: editCat.emoji, hue: editCat.hue, subcats: editCat.subcats }}
          lang={lang}
          onClose={() => setEditCat(null)}
          onSaved={handleEdit}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              width: "100%", maxWidth: 320, background: SURFACE, borderRadius: 20, padding: 24,
              border: `1px solid ${BORDER}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: TEXT }}>Excluir categoria?</h3>
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: TEXT_SEC, lineHeight: 1.5 }}>
                As transações desta categoria serão movidas para "Outros". Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setDeleteConfirm(null)} style={{
                  flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`,
                  background: "transparent", color: TEXT_SEC, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancelar
                </button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} disabled={saving} style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 0,
                  background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? "..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
