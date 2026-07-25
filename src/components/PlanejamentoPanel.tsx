"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Star } from "lucide-react";

const AREA_CONFIG: Record<string, { emoji: string; hue: number }> = {
  saude: { emoji: "💚", hue: 160 }, carreira: { emoji: "💼", hue: 220 },
  financas: { emoji: "💰", hue: 85 }, relacionamentos: { emoji: "❤️", hue: 15 },
  desenvolvimento: { emoji: "🧠", hue: 270 }, familia: { emoji: "🏡", hue: 40 },
  lazer: { emoji: "🌊", hue: 185 }, espiritualidade: { emoji: "✨", hue: 300 },
  outros: { emoji: "⚪", hue: 200 },
};

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function weekRange() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  return `${mon.getDate()} ${MONTHS[mon.getMonth()]} – ${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
}

export function PlanejamentoPanel() {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay(); return d === 0 ? 6 : d - 1;
  });

  const fetchPlan = async () => {
    try {
      const res = await fetch("/api/weekly-plans");
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setTasks(data.current?.weekly_tasks || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPlan(); }, []);

  const toggleTask = async (taskId: string, current: string) => {
    const next = current === "concluida" ? "pendente" : "concluida";
    setTasks((prev: any[]) => prev.map(t => t.id === taskId ? { ...t, status: next } : t));
    await fetch(`/api/weekly-plans/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const currentPlan = plan?.current ?? null;
  const review = currentPlan?.weekly_reviews?.[0] ?? null;
  const focuses = [currentPlan?.main_focus, currentPlan?.main_focus_2, currentPlan?.main_focus_3].filter(Boolean);
  const doneTasks = tasks.filter((t: any) => t.status === "concluida").length;
  const totalTasks = tasks.length;

  const selectedDayTasks = tasks
    .filter((t: any) => t.day_of_week === selectedDay)
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
  const doneSelected = selectedDayTasks.filter((t: any) => t.status === "concluida").length;

  if (loading) return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Stones */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Pedras da semana
          </h2>
          <button type="button" onClick={() => router.push("/planejamento")}
            style={{ background: "none", border: 0, cursor: "pointer", color: "#A78BFA", fontFamily: "inherit", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Pencil size={11} /> {focuses.length > 0 ? "Editar" : "Definir"}
          </button>
        </div>
        {focuses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {focuses.map((focus: string, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 14,
                border: "1px solid rgba(167,139,250,0.15)", background: "#1a1530",
              }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#A78BFA", fontFamily: "monospace", opacity: 0.4, flexShrink: 0 }}>
                  {["I", "II", "III"][i]}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff", lineHeight: 1.3 }}>{focus}</span>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => router.push("/planejamento")}
            style={{ width: "100%", padding: 16, borderRadius: 14, border: "2px dashed rgba(167,139,250,0.2)", background: "rgba(124,92,255,0.04)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Plus size={16} /> Definir pedras da semana
          </button>
        )}
      </div>

      <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9e96b5", fontFamily: "monospace" }}>{weekRange()} · {doneTasks}/{totalTasks} ✓</p>

      {/* Day selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 12 }}>
        {DAY_NAMES.map((d, i) => {
          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const dt = tasks.filter((t: any) => t.day_of_week === i);
          return (
            <button key={i} type="button" onClick={() => setSelectedDay(i)}
              style={{
                padding: "8px 2px 6px", borderRadius: 10, border: selectedDay === i ? "1.5px solid rgba(167,139,250,0.4)" : "1.5px solid transparent",
                background: selectedDay === i ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit",
              }}>
              <span style={{ fontSize: 10, fontWeight: i === today ? 700 : 500, color: i === today ? "#A78BFA" : "#9e96b5", textTransform: "uppercase" }}>{d}</span>
              <div style={{ display: "flex", gap: 1.5 }}>
                {dt.slice(0, 4).map((t: any, j: number) => (
                  <span key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: t.status === "concluida" ? "#7C5CFF" : "rgba(167,139,250,0.2)" }} />
                ))}
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#9e96b5" }}>{dt.filter((t: any) => t.status === "concluida").length}/{dt.length}</span>
            </button>
          );
        })}
      </div>

      {/* Selected day tasks */}
      <div style={{
        background: "#1a1530", borderRadius: 16, border: "1px solid rgba(167,139,250,0.1)",
        padding: "10px 14px", marginBottom: 8,
      }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>
          {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][selectedDay]} · {doneSelected}/{selectedDayTasks.length}
        </p>
        {selectedDayTasks.length === 0 ? (
          <p style={{ color: "#9e96b5", fontSize: 12, textAlign: "center", padding: 8, margin: 0 }}>Nenhuma tarefa</p>
        ) : (
          selectedDayTasks.map((task: any) => {
            const area = AREA_CONFIG[task.area] || AREA_CONFIG.outros;
            const done = task.status === "concluida";
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(167,139,250,0.05)" }}>
                <button type="button" onClick={() => toggleTask(task.id, task.status)}
                  style={{
                    width: 18, height: 18, borderRadius: task.task_type === "manutencao" ? "50%" : 4, flexShrink: 0,
                    border: done ? "none" : "1.5px solid rgba(167,139,250,0.3)", background: done ? "#7C5CFF" : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>
                  )}
                </button>
                <span style={{ fontSize: 10 }}>{area.emoji}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: done ? "#5a5470" : "#e0d6ff", textDecoration: done ? "line-through" : "none" }}>
                  {task.title}
                </span>
                {task.scheduled_time && <span style={{ fontSize: 9, color: "#9e96b5", fontFamily: "monospace" }}>{task.scheduled_time.slice(0, 5)}</span>}
              </div>
            );
          })
        )}
      </div>

      <button type="button" onClick={() => router.push("/planejamento")}
        style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: 0, cursor: "pointer", background: "rgba(124,92,255,0.1)", color: "#A78BFA", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        Abrir planejamento completo →
      </button>

      {/* Review */}
      {review && (
        <div style={{ marginTop: 12, background: "#1a1530", borderRadius: 14, padding: 14, border: "1px solid rgba(167,139,250,0.1)" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#A78BFA", letterSpacing: ".1em" }}>Revisão ✓</p>
          <div style={{ display: "flex", gap: 1, marginTop: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ fontSize: 12, color: i < review.week_score ? "#f59e0b" : "rgba(167,139,250,0.15)" }}>★</span>
            ))}
          </div>
          {review.biggest_win && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9e96b5", lineHeight: 1.3 }}>🏆 {review.biggest_win.slice(0, 80)}</p>}
        </div>
      )}
    </div>
  );
}
