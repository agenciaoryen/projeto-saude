"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const AREA_CONFIG: Record<string, { emoji: string; hue: number }> = {
  saude: { emoji: "💚", hue: 160 }, carreira: { emoji: "💼", hue: 220 },
  financas: { emoji: "💰", hue: 85 }, relacionamentos: { emoji: "❤️", hue: 15 },
  desenvolvimento: { emoji: "🧠", hue: 270 }, familia: { emoji: "🏡", hue: 40 },
  lazer: { emoji: "🌊", hue: 185 }, espiritualidade: { emoji: "✨", hue: 300 },
};

export function MetasPanel() {
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goals")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGoals(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const activeGoals = goals.filter((g: any) => g.status === "ativa");
  const pausedGoals = goals.filter((g: any) => g.status === "pausada");

  if (loading) return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e0d6ff" }}>
          {activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""} ativa{activeGoals.length !== 1 ? "s" : ""}
        </h2>
        <button type="button" onClick={() => router.push("/metas/nova")}
          style={{ background: "none", border: 0, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#A78BFA", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
          <Plus size={14} /> Nova meta
        </button>
      </div>

      {activeGoals.length === 0 && pausedGoals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, background: "#1a1530", borderRadius: 18, border: "1px dashed rgba(167,139,250,0.15)" }}>
          <p style={{ color: "#9e96b5", fontSize: 13, margin: "0 0 12px" }}>Nenhuma meta ainda</p>
          <button type="button" onClick={() => router.push("/metas/nova")}
            style={{ padding: "8px 16px", borderRadius: 10, border: 0, cursor: "pointer", background: "#7C5CFF", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
            + Criar primeira meta
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeGoals.slice(0, 5).map((goal: any) => {
            const area = AREA_CONFIG[goal.area] || { emoji: "🎯", hue: 270 };
            const totalStages = goal.goal_stages?.length || 0;
            const doneStages = goal.goal_stages?.filter((s: any) => s.status === "concluida").length || 0;
            const pct = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;
            const daysInactive = goal.daysInactive || 0;

            return (
              <button key={goal.id} type="button" onClick={() => router.push(`/metas/${goal.id}`)}
                style={{
                  textAlign: "left", padding: "14px 16px", borderRadius: 14,
                  border: "1px solid rgba(167,139,250,0.15)", background: "#1a1530", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{area.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e0d6ff" }}>{goal.title}</p>
                    {daysInactive >= 7 && (
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 9999, background: "rgba(255,92,92,0.15)", color: "#FF5C5C", fontWeight: 600 }}>
                        {daysInactive}d parada
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 5, height: 3, borderRadius: 9999, background: "rgba(167,139,250,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#7C5CFF", borderRadius: 9999, transition: "width .3s" }} />
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "#9e96b5" }}>
                    {doneStages}/{totalStages} etapas · {pct}%
                  </p>
                </div>
              </button>
            );
          })}
          {activeGoals.length > 5 && (
            <button type="button" onClick={() => router.push("/metas")}
              style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: 0, cursor: "pointer", background: "rgba(124,92,255,0.08)", color: "#A78BFA", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              Ver todas as {activeGoals.length} metas →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
