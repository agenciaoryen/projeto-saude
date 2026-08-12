"use client";

import { useEffect, useState } from "react";
import { Eye, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AREA_CONFIG, AREA_LABELS, ALL_AREAS } from "@/lib/planejamento-constants";
import type { AreaVision } from "@/types";

// Custom labels for vision context (longer than the short labels used in navigation)
const AREA_FULL_LABELS: Record<string, string> = {
  saude: "Saúde", carreira: "Carreira", financas: "Finanças",
  relacionamentos: "Relacionamentos", desenvolvimento: "Mente",
  familia: "Família", lazer: "Lazer", espiritualidade: "Espiritualidade",
};

const AREA_PLACEHOLDERS: Record<string, string> = {
  saude: "Em 5 anos, como você quer estar fisicamente e mentalmente? Que hábitos te sustentam?",
  carreira: "Em 5 anos, qual posição ou impacto profissional você quer ter? O que te realiza?",
  financas: "Em 5 anos, qual sua relação com dinheiro? Que segurança financeira você construiu?",
  relacionamentos: "Em 5 anos, como são suas amizades e vida amorosa? Que tipo de conexões te cercam?",
  desenvolvimento: "Em 5 anos, o que você aprendeu? Que habilidades ou conhecimentos te orgulham?",
  familia: "Em 5 anos, como está sua família? Que tipo de presença você é para eles?",
  lazer: "Em 5 anos, como você se diverte e descansa? O que te recarrega?",
  espiritualidade: "Em 5 anos, qual sua conexão com algo maior? O que te dá sentido e paz?",
};

export function VisionPanel() {
  const [visions, setVisions] = useState<AreaVision[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editStatement, setEditStatement] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchVisions = async () => {
    try {
      const r = await fetch("/api/area-visions");
      const data = await r.json();
      if (Array.isArray(data)) setVisions(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchVisions(); }, []);

  const visionMap: Record<string, AreaVision | undefined> = {};
  for (const v of visions) {
    visionMap[v.area] = v;
  }
  const definedCount = Object.values(visionMap).filter(Boolean).length;

  const openEditor = (area: string) => {
    setEditingArea(area);
    setEditStatement(visionMap[area]?.statement || "");
  };

  const saveVision = async () => {
    if (!editingArea) return;
    setSaving(true);
    try {
      const res = await fetch("/api/area-visions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: editingArea, statement: editStatement }),
      });
      if (res.ok) {
        toast.success(editStatement.trim() ? "Visão salva!" : "Visão removida");
        setEditingArea(null);
        fetchVisions();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  if (loading) {
    return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>Visão 5 Anos</h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6a657a" }}>
          Quem você quer ser em 5 anos em cada área da vida?
        </p>
      </div>

      {/* Progress indicator */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px", borderRadius: 14, marginBottom: 14,
        background: "linear-gradient(135deg, rgba(124,92,255,0.08), rgba(167,139,250,0.04))",
        border: "1px solid rgba(124,92,255,0.1)",
      }}>
        <Eye size={14} color="#A78BFA" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA" }}>
          {definedCount}/8 áreas definidas
        </span>
        <div style={{ flex: 1, height: 4, borderRadius: 9999, background: "rgba(167,139,250,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 9999,
            width: `${Math.round((definedCount / 8) * 100)}%`,
            background: "#A78BFA", transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* 2x4 area grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}>
        {ALL_AREAS.filter(a => a !== "outros").map((area) => {
          const conf = AREA_CONFIG[area] || { emoji: "🎯", hue: 270 };
          const vision = visionMap[area];
          const hasStatement = vision && vision.statement.trim().length > 0;

          return (
            <button
              key={area}
              type="button"
              onClick={() => openEditor(area)}
              style={{
                textAlign: "left",
                padding: "14px",
                borderRadius: 14,
                border: hasStatement
                  ? `1px solid oklch(0.35 0.03 ${conf.hue})`
                  : "1px dashed rgba(167,139,250,0.12)",
                background: hasStatement
                  ? `oklch(0.12 0.01 ${conf.hue})`
                  : "#0f0e1a",
                cursor: "pointer",
                fontFamily: "inherit",
                minHeight: 90,
                display: "flex", flexDirection: "column",
              }}>
              {/* Area label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>{conf.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e0d6ff" }}>
                  {AREA_FULL_LABELS[area] || area}
                </span>
              </div>

              {/* Statement preview or placeholder */}
              {hasStatement ? (
                <p style={{
                  margin: 0, fontSize: 11, color: "#9e96b5",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}>
                  {vision!.statement}
                </p>
              ) : (
                <p style={{
                  margin: 0, fontSize: 11, color: "#5a5470",
                  fontStyle: "italic",
                }}>
                  Definir visão...
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {definedCount === 0 && (
        <p style={{
          margin: "16px 0 0", fontSize: 11, color: "#5a5470",
          textAlign: "center", lineHeight: 1.6,
        }}>
          Clique em qualquer área acima para escrever sua visão de 5 anos.<br />
          A Maya usará essas visões como o norte do seu planejamento.
        </p>
      )}

      {/* ── Edit Modal ──────────────────────────────────────── */}
      {editingArea && (
        <div
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}>
          <div style={{
            width: "100%", maxWidth: 420, maxHeight: "85dvh", overflowY: "auto",
            background: "#151520", borderRadius: 24, padding: 24,
            border: "1px solid rgba(167,139,250,0.15)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 28 }}>
                {AREA_CONFIG[editingArea as keyof typeof AREA_CONFIG]?.emoji || "🎯"}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>
                  {AREA_FULL_LABELS[editingArea] || editingArea}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6a657a" }}>
                  Onde você quer estar em 5 anos nesta área?
                </p>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={editStatement}
              onChange={(e) => setEditStatement(e.target.value)}
              placeholder={AREA_PLACEHOLDERS[editingArea] || "Descreva sua visão de 5 anos para esta área..."}
              rows={6}
              autoFocus
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                border: "1px solid rgba(167,139,250,0.2)", background: "#0B0B10",
                color: "#e0d6ff", fontSize: 13, fontFamily: "inherit",
                outline: "none", resize: "vertical",
                boxSizing: "border-box", marginTop: 14,
                lineHeight: 1.6,
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button type="button" onClick={() => setEditingArea(null)}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 14,
                  border: "1px solid rgba(167,139,250,0.2)", background: "transparent",
                  color: "#9e96b5", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                Cancelar
              </button>
              <button type="button" onClick={saveVision} disabled={saving}
                style={{
                  flex: 2, padding: "14px 0", borderRadius: 14, border: 0,
                  background: "#7C5CFF", color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? (
                  <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Salvando...</>
                ) : (
                  <><Save size={14} /> Salvar visão</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
