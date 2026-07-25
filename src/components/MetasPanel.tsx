"use client";

import { useEffect, useState } from "react";
import { GoalCreateSheet } from "@/components/GoalCreateSheet";
import { GoalDetailSheet } from "@/components/GoalDetailSheet";

const AREA_CONFIG: Record<string, { emoji: string; hue: number }> = {
  saude: { emoji: "💚", hue: 160 }, carreira: { emoji: "💼", hue: 220 },
  financas: { emoji: "💰", hue: 85 }, relacionamentos: { emoji: "❤️", hue: 15 },
  desenvolvimento: { emoji: "🧠", hue: 270, label: "Mente" }, familia: { emoji: "🏡", hue: 40 },
  lazer: { emoji: "🌊", hue: 185 }, espiritualidade: { emoji: "✨", hue: 300 },
};

export function MetasPanel() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const r = await fetch("/api/goals");
      const data = await r.json();
      if (Array.isArray(data)) setGoals(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const activeGoals = goals.filter((g: any) => g.status === "ativa" || g.status === "pausada");
  const completedGoals = goals.filter((g: any) => g.status === "concluida");

  if (loading) return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e0d6ff" }}>
          {activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""} ativa{activeGoals.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div style={{ textAlign: "center", padding: 32, background: "#1a1530", borderRadius: 18, border: "1px dashed rgba(167,139,250,0.15)" }}>
          <p style={{ color: "#9e96b5", fontSize: 13, margin: "0 0 12px" }}>Nenhuma meta ainda</p>
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
              <button key={goal.id} type="button" onClick={() => setDetailGoalId(goal.id)}
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
              style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: 0, cursor: "pointer", background: "rgba(124,92,255,0.08)", color: "#A78BFA", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}
              disabled>
              {activeGoals.length} metas ativas
            </button>
          )}
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#5a5470" }}>
            Concluídas ({completedGoals.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {completedGoals.slice(0, 3).map((goal: any) => {
              const area = AREA_CONFIG[goal.area] || { emoji: "🎯", hue: 270 };
              return (
                <div key={goal.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 12,
                  background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.1)",
                  opacity: 0.6,
                }}>
                  <span style={{ fontSize: 18 }}>{area.emoji}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#9e96b5", textDecoration: "line-through" }}>
                    {goal.title}
                  </span>
                  <button type="button" onClick={async () => {
                    await fetch(`/api/goals/${goal.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "arquivada" }),
                    });
                    refresh();
                  }}
                    style={{ background: "none", border: 0, color: "#5a5470", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>
                    Arquivar
                  </button>
                </div>
              );
            })}
            {completedGoals.length > 3 && (
              <p style={{ margin: 0, fontSize: 10, color: "#5a5470", textAlign: "center" }}>
                +{completedGoals.length - 3} concluídas
              </p>
            )}
          </div>
        </div>
      )}

      {showCreate && <GoalCreateSheet onClose={() => setShowCreate(false)} onCreated={refresh} />}
      {detailGoalId && <GoalDetailSheet goalId={detailGoalId} onClose={() => setDetailGoalId(null)} onUpdated={refresh} />}
    </div>
  );
}
