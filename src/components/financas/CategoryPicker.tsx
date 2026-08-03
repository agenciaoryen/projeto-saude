"use client";

import { Settings } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { t as tFn } from "@/lib/i18n";
import { EXPENSE_CATS, INCOME_CATS, getSubcats, type FinCat, type CustomCat } from "@/lib/financas-categories";

function catLabel(c: FinCat, lang: Lang, customCat: CustomCat | null): string {
  if (c.custom) return customCat?.name ?? tFn(lang, "fin_cat_personalizada");
  return tFn(lang, `fin_cat_${c.id}`);
}

export function CategoryPicker({
  type, category, subcategory, lang, customCat,
  onSelect, onEditCustom,
}: {
  type: "receita" | "despesa";
  category: string;
  subcategory: string;
  lang: Lang;
  customCat: CustomCat | null;
  onSelect: (cat: string, sub: string) => void;
  onEditCustom: () => void;
}) {
  const cats = type === "despesa" ? EXPENSE_CATS : INCOME_CATS;
  const cols = type === "despesa" ? "repeat(4, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))";
  const selectedCat = cats.find((c) => c.id === category);
  const subcats = category ? getSubcats(category, cats, customCat) : [];

  const textSecondary = "#9e96b5";
  const borderDefault = "rgba(167,139,250,0.15)";

  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: textSecondary }}>
        {tFn(lang, "fin_categoria")}
      </p>

      {/* Main category grid */}
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 6 }}>
        {cats.map((c) => {
          const sel = category === c.id;
          const label = catLabel(c, lang, customCat);
          const emoji = c.custom ? (customCat?.emoji ?? c.emoji) : c.emoji;
          return (
            <div key={c.id} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => onSelect(c.id, "")}
                style={{
                  width: "100%", padding: "10px 4px", borderRadius: 12,
                  border: sel ? "2px solid #7C5CFF" : `1px solid ${borderDefault}`,
                  background: sel ? "rgba(124,92,255,0.08)" : "#0B0B10",
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3, transition: "all .12s ease",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, textAlign: "center", lineHeight: 1.2,
                  color: sel ? "#A78BFA" : textSecondary,
                }}>
                  {label}
                </span>
              </button>
              {c.custom && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditCustom(); }}
                  style={{
                    position: "absolute", top: 3, right: 3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(167,139,250,0.15)", border: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Settings size={10} style={{ color: "#9e96b5" }} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Subcategory chips */}
      {subcats.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: textSecondary }}>
            {tFn(lang, "fin_subcategoria")}
          </p>
          <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4 }}>
            {subcats.map((sc) => {
              const selSub = subcategory === sc.label;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onSelect(category, sc.label)}
                  style={{
                    flexShrink: 0, padding: "6px 13px", borderRadius: 20,
                    border: selSub ? "1.5px solid #7C5CFF" : `1.5px solid ${borderDefault}`,
                    background: selSub ? "rgba(124,92,255,0.08)" : "#0B0B10",
                    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                    fontSize: 12, fontWeight: 600,
                    color: selSub ? "#A78BFA" : "#9e96b5",
                    transition: "all .12s ease",
                  }}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
