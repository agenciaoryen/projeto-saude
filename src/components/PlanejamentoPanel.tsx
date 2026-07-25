"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Star, ChevronDown, Clock, X, Check } from "lucide-react";

const AREA_CONFIG: Record<string, { emoji: string; hue: number }> = {
  saude: { emoji: "💚", hue: 160 }, carreira: { emoji: "💼", hue: 220 },
  financas: { emoji: "💰", hue: 85 }, relacionamentos: { emoji: "❤️", hue: 15 },
  desenvolvimento: { emoji: "🧠", hue: 270 }, familia: { emoji: "🏡", hue: 40 },
  lazer: { emoji: "🌊", hue: 185 }, espiritualidade: { emoji: "✨", hue: 300 },
  outros: { emoji: "⚪", hue: 200 },
};

const ALL_AREAS = Object.keys(AREA_CONFIG);

const AREAS_LABELS: Record<string, string> = {
  saude: "Saúde", carreira: "Carreira", financas: "Finanças",
  relacionamentos: "Relac.", desenvolvimento: "Desenv.", familia: "Família",
  lazer: "Lazer", espiritualidade: "Espirit.", outros: "Outros",
};
const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function weekRange() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const M = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  return `${mon.getDate()} ${M[mon.getMonth()]} – ${sun.getDate()} ${M[sun.getMonth()]}`;
}

// ── Mini Radar ──────────────────────────────────────────────────

function MiniRadar({ counts }: { counts: Record<string, number> }) {
  const RADAR = [
    { key: "saude", label: "Saúde", emoji: "💚", hue: 160 },
    { key: "carreira", label: "Carreira", emoji: "💼", hue: 220 },
    { key: "financas", label: "Finanças", emoji: "💰", hue: 85 },
    { key: "relacionamentos", label: "Relac.", emoji: "❤️", hue: 15 },
    { key: "desenvolvimento", label: "Desenv.", emoji: "🧠", hue: 270 },
    { key: "familia", label: "Família", emoji: "🏡", hue: 40 },
    { key: "lazer", label: "Lazer", emoji: "🌊", hue: 185 },
    { key: "espiritualidade", label: "Espirit.", emoji: "✨", hue: 300 },
    { key: "outros", label: "Outros", emoji: "⚪", hue: 200 },
  ];
  const N = RADAR.length, MAX = 5, cx = 160, cy = 160, R = 80;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + R * (Math.min(v, MAX) / MAX) * Math.cos(a), cy + R * (Math.min(v, MAX) / MAX) * Math.sin(a)];
  };
  const points = RADAR.map((a, i) => pt(i, counts[a.key] ?? 0).join(",")).join(" ");
  const covered = RADAR.filter(a => (counts[a.key] ?? 0) > 0).length;

  return (
    <div style={{ background: "#1a1530", borderRadius: 18, border: "1px solid rgba(167,139,250,0.1)", padding: "14px 8px 10px", marginBottom: 16, overflow: "visible" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#A78BFA" }}>Roda das áreas</p>
        <span style={{ fontSize: 10, color: "#9e96b5" }}>{covered}/{N} cobertas</span>
      </div>
      <svg viewBox="0 0 340 350" style={{ width: "100%", display: "block", margin: "0 auto", overflow: "visible" }}>
        {[0.25, 0.5, 0.75, 1].map(r => (
          <polygon key={r} points={RADAR.map((_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
            return `${cx + R * r * Math.cos(a)},${cy + R * r * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="rgba(167,139,250,0.1)" strokeWidth="1" />
        ))}
        <polygon points={points} fill="rgba(124,92,255,0.15)" stroke="#7C5CFF" strokeWidth="1.5" strokeLinejoin="round" />
        {RADAR.map((a, i) => {
          const v = counts[a.key] ?? 0;
          if (v === 0) return null;
          const [x, y] = pt(i, v);
          return <circle key={a.key} cx={x} cy={y} r="2.5" fill="#fff" stroke="#7C5CFF" strokeWidth="1" />;
        })}
        {RADAR.map((a, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
          const lx = cx + (R + 50) * Math.cos(angle), ly = cy + (R + 50) * Math.sin(angle);
          return (
            <g key={a.key}>
              <text x={lx} y={ly - 8} textAnchor="middle" dominantBaseline="middle" fontSize="14">{a.emoji}</text>
              <text x={lx} y={ly + 9} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9e96b5" fontWeight={600}>{a.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────

export function PlanejamentoPanel() {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [avancado, setAvancado] = useState(false);

  // Add task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskArea, setNewTaskArea] = useState("saude");
  const [newTaskDay, setNewTaskDay] = useState(selectedDay);
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskType, setNewTaskType] = useState<"manutencao" | "crescimento">("manutencao");

  // Review form
  const [reviewWin, setReviewWin] = useState("");
  const [reviewBlock, setReviewBlock] = useState("");
  const [reviewLearn, setReviewLearn] = useState("");
  const [reviewScore, setReviewScore] = useState(3);

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
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const res = await fetch("/api/weekly-plans/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(), area: newTaskArea, day_of_week: newTaskDay,
        task_type: newTaskType, scheduled_time: newTaskTime || null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev: any[]) => [...prev, task]);
      setShowAddTask(false); setNewTaskTitle(""); setNewTaskTime("");
    }
  };

  const saveReview = async () => {
    if (!reviewWin.trim()) return;
    await fetch("/api/weekly-plans/review", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biggest_win: reviewWin, blocked_lesson: reviewBlock, main_learning: reviewLearn, week_score: reviewScore }),
    });
    setShowReview(false); fetchPlan();
  };

  const currentPlan = plan?.current ?? null;
  const review = currentPlan?.weekly_reviews?.[0] ?? null;
  const focuses = [currentPlan?.main_focus, currentPlan?.main_focus_2, currentPlan?.main_focus_3].filter(Boolean);
  const doneTasks = tasks.filter((t: any) => t.status === "concluida").length;

  const taskCountsByArea = useMemo(() => {
    const acc: Record<string, number> = {};
    ALL_AREAS.forEach(a => acc[a] = tasks.filter((t: any) => t.area === a).length);
    return acc;
  }, [tasks]);

  const selectedDayTasks = tasks.filter((t: any) => t.day_of_week === selectedDay)
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

  if (loading) return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Stones */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".08em" }}>Pedras</h2>
          {focuses.length > 0 && (
            <button type="button" onClick={() => router.push("/planejamento")}
              style={{ background: "none", border: 0, cursor: "pointer", color: "#A78BFA", fontFamily: "inherit", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Pencil size={11} /> Editar
            </button>
          )}
        </div>
        {focuses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {focuses.map((focus: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.15)", background: "#1a1530" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#A78BFA", fontFamily: "monospace", opacity: 0.4, flexShrink: 0 }}>{["I","II","III"][i]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff", lineHeight: 1.3 }}>{focus}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 20, background: "#1a1530", borderRadius: 14, border: "1px dashed rgba(167,139,250,0.15)" }}>
            <p style={{ margin: "0 0 4px", color: "#9e96b5", fontSize: 13 }}>Nenhuma pedra definida</p>
            <p style={{ margin: 0, color: "#9e96b5", fontSize: 11 }}>Use o planejamento completo para definir</p>
          </div>
        )}
      </div>

      {/* Radar — always visible */}
      <MiniRadar counts={taskCountsByArea} />

      <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9e96b5", fontFamily: "monospace" }}>{weekRange()} · {doneTasks}/{tasks.length} ✓</p>

      {/* Day selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 12 }}>
        {DAY_NAMES.map((d, i) => {
          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const dt = tasks.filter((t: any) => t.day_of_week === i);
          return (
            <button key={i} type="button" onClick={() => setSelectedDay(i)}
              style={{ padding: "8px 2px 6px", borderRadius: 10, border: selectedDay === i ? "1.5px solid rgba(167,139,250,0.4)" : "1.5px solid transparent", background: selectedDay === i ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
              <span style={{ fontSize: 10, fontWeight: i === today ? 700 : 500, color: i === today ? "#A78BFA" : "#9e96b5", textTransform: "uppercase" }}>{d}</span>
              <div style={{ display: "flex", gap: 1.5 }}>{dt.slice(0,4).map((t: any, j: number) => (
                <span key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: t.status === "concluida" ? "#7C5CFF" : "rgba(167,139,250,0.2)" }} />
              ))}</div>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#9e96b5" }}>{dt.filter((t: any) => t.status === "concluida").length}/{dt.length}</span>
            </button>
          );
        })}
      </div>

      {/* Tasks */}
      <div style={{ background: "#1a1530", borderRadius: 16, border: "1px solid rgba(167,139,250,0.1)", padding: "10px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>{DAY_FULL[selectedDay]}</p>
        </div>
        {selectedDayTasks.length === 0 ? (
          <p style={{ color: "#9e96b5", fontSize: 12, textAlign: "center", padding: 8, margin: 0 }}>Nenhuma tarefa</p>
        ) : (
          selectedDayTasks.map((task: any) => {
            const area = AREA_CONFIG[task.area] || AREA_CONFIG.outros;
            const done = task.status === "concluida";
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(167,139,250,0.05)" }}>
                <button type="button" onClick={() => toggleTask(task.id, task.status)}
                  style={{ width: 18, height: 18, borderRadius: task.task_type === "manutencao" ? "50%" : 4, flexShrink: 0, border: done ? "none" : "1.5px solid rgba(167,139,250,0.3)", background: done ? "#7C5CFF" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>}
                </button>
                <span style={{ fontSize: 10 }}>{area.emoji}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: done ? "#5a5470" : "#e0d6ff", textDecoration: done ? "line-through" : "none" }}>{task.title}</span>
                {task.scheduled_time && <span style={{ fontSize: 9, color: "#9e96b5", fontFamily: "monospace" }}>{task.scheduled_time.slice(0,5)}</span>}
              </div>
            );
          })
        )}
      </div>

      {/* Review */}
      {review ? (
        <div style={{ marginBottom: 8, background: "#1a1530", borderRadius: 14, padding: 12, border: "1px solid rgba(167,139,250,0.1)" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#A78BFA", letterSpacing: ".1em" }}>Revisão ✓</p>
          <div style={{ display: "flex", gap: 1, marginTop: 4 }}>{Array.from({length:5}).map((_,i) => <span key={i} style={{ fontSize: 12, color: i < review.week_score ? "#f59e0b" : "rgba(167,139,250,0.15)" }}>★</span>)}</div>
          {review.biggest_win && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9e96b5" }}>🏆 {review.biggest_win.slice(0,80)}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setShowReview(true)}
          style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px dashed rgba(167,139,250,0.2)", background: "transparent", cursor: "pointer", color: "#A78BFA", fontSize: 12, fontWeight: 600, fontFamily: "inherit", marginBottom: 8 }}>
          <Star size={14} /> Fazer revisão da semana
        </button>
      )}

      {/* Avançado toggle */}
      <button type="button" onClick={() => setAvancado(!avancado)}
        style={{ width: "100%", padding: "8px 0", borderRadius: 12, border: 0, background: "transparent", cursor: "pointer", color: "#9e96b5", fontSize: 11, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        {avancado ? "Recolher" : "Avançado"} <ChevronDown size={12} style={{ transform: avancado ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>

      {/* FAB */}
      <button type="button" onClick={() => { setNewTaskDay(selectedDay); setShowAddTask(true); }}
        style={{
          position: "fixed", bottom: 84, right: 20, zIndex: 40,
          width: 56, height: 56, borderRadius: "50%",
          background: "#7C5CFF", border: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(124,92,255,0.4)",
        }}>
        <Plus size={24} color="#fff" />
      </button>

      {avancado && (
        <div style={{ marginTop: 8 }}>
          {/* History */}
          {plan?.history?.length > 0 && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#5a5470" }}>Semanas anteriores</p>
              {plan.history.slice(0, 3).map((h: any) => {
                const d = new Date(h.week_start + "T12:00:00");
                const M = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
                const rev = (h as any).weekly_reviews?.[0];
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(167,139,250,0.05)" }}>
                    <span style={{ flex: 1, fontSize: 11, color: "#9e96b5" }}>{d.getDate()} {M[d.getMonth()]}</span>
                    <span style={{ fontSize: 11, color: "#9e96b5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{h.main_focus || "—"}</span>
                    {rev && <span>{Array.from({length:5}).map((_,i) => <span key={i} style={{ fontSize: 9, color: i < rev.week_score ? "#f59e0b" : "rgba(167,139,250,0.1)" }}>★</span>)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Task Sheet */}
      {showAddTask && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, maxHeight: "80dvh", overflowY: "auto", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>Nova atividade</h3>
            <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Título" autoFocus style={inputS} />
            <p style={{ fontSize: 10, color: "#A78BFA", margin: "12px 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Área</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
              {ALL_AREAS.slice(0,9).map(a => {
                const area = AREA_CONFIG[a];
                return (
                <button key={a} type="button" onClick={() => setNewTaskArea(a)}
                  style={{ padding: "8px 4px", borderRadius: 10, border: newTaskArea === a ? "2px solid #7C5CFF" : "1px solid rgba(167,139,250,0.15)", background: newTaskArea === a ? "rgba(124,92,255,0.1)" : "#0B0B10", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{area?.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: newTaskArea === a ? "#A78BFA" : "#9e96b5" }}>{
                    (AREAS_LABELS as any)[a] || a
                  }</span>
                </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4 }}>Dia</p>
                <div style={{ display: "flex", gap: 2 }}>
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} type="button" onClick={() => setNewTaskDay(i)}
                      style={{ flex: 1, padding: "6px 2px", borderRadius: 8, border: 0, cursor: "pointer", background: newTaskDay === i ? "#7C5CFF" : "rgba(167,139,250,0.08)", color: newTaskDay === i ? "#fff" : "#9e96b5", fontSize: 9, fontWeight: 600, fontFamily: "inherit" }}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => setNewTaskType("manutencao")}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: newTaskType === "manutencao" ? "2px solid #7C5CFF" : "1px solid rgba(167,139,250,0.15)", background: newTaskType === "manutencao" ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer", color: newTaskType === "manutencao" ? "#A78BFA" : "#9e96b5", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>↻ Hábito</button>
              <button type="button" onClick={() => setNewTaskType("crescimento")}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: newTaskType === "crescimento" ? "2px solid #7C5CFF" : "1px solid rgba(167,139,250,0.15)", background: newTaskType === "crescimento" ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer", color: newTaskType === "crescimento" ? "#A78BFA" : "#9e96b5", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>↑ Crescer</button>
            </div>
            <input type="time" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)}
              style={{ ...inputS, marginTop: 12 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setShowAddTask(false)}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button type="button" onClick={addTask} disabled={!newTaskTitle.trim()}
                style={{ flex: 2, padding: 14, borderRadius: 14, border: 0, background: newTaskTitle.trim() ? "#7C5CFF" : "#1e1840", color: newTaskTitle.trim() ? "#fff" : "#9e96b5", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Sheet */}
      {showReview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, maxHeight: "85dvh", overflowY: "auto", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>Revisão da semana</h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9e96b5" }}>{weekRange()}</p>
            <textarea value={reviewWin} onChange={e => setReviewWin(e.target.value)} placeholder="🏆 Qual foi sua maior vitória?" rows={2} style={{ ...inputS, resize: "none", height: 56, marginBottom: 10 }} />
            <textarea value={reviewBlock} onChange={e => setReviewBlock(e.target.value)} placeholder="🔒 O que travou?" rows={2} style={{ ...inputS, resize: "none", height: 56, marginBottom: 10 }} />
            <textarea value={reviewLearn} onChange={e => setReviewLearn(e.target.value)} placeholder="💡 Principal aprendizado" rows={2} style={{ ...inputS, resize: "none", height: 56, marginBottom: 12 }} />
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9e96b5" }}>Nota da semana</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setReviewScore(n)}
                  style={{ fontSize: 28, background: "none", border: 0, cursor: "pointer", filter: n <= reviewScore ? "none" : "grayscale(1) opacity(.3)", transition: "filter .15s" }}>⭐</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowReview(false)}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button type="button" onClick={saveReview} disabled={!reviewWin.trim()}
                style={{ flex: 2, padding: 14, borderRadius: 14, border: 0, background: reviewWin.trim() ? "#7C5CFF" : "#1e1840", color: reviewWin.trim() ? "#fff" : "#9e96b5", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salvar revisão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
  background: "#0B0B10", color: "#e0d6ff", fontSize: 14,
  fontFamily: "inherit", outline: "none",
};
