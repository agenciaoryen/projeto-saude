"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Star, ChevronDown, Clock, X, Check } from "lucide-react";
import type { TaskArea } from "@/types";
import {
  AREA_CONFIG, ALL_AREAS, AREA_LABELS, DAY_NAMES, DAY_FULL,
  weekRangeFromDate as weekRange,
} from "@/lib/planejamento-constants";

// ── Mini Radar ──────────────────────────────────────────────────

function MiniRadar({ done, totals }: { done: Record<string, number>; totals: Record<string, number> }) {
  const RADAR = [
    { key: "saude", label: "Saúde", emoji: "💚", hue: 160 },
    { key: "carreira", label: "Carreira", emoji: "💼", hue: 220 },
    { key: "financas", label: "Finanças", emoji: "💰", hue: 85 },
    { key: "relacionamentos", label: "Relac.", emoji: "❤️", hue: 15 },
    { key: "desenvolvimento", label: "Mente", emoji: "🧠", hue: 270 },
    { key: "familia", label: "Família", emoji: "🏡", hue: 40 },
    { key: "lazer", label: "Lazer", emoji: "🌊", hue: 185 },
    { key: "espiritualidade", label: "Espirit.", emoji: "✨", hue: 300 },
    { key: "outros", label: "Outros", emoji: "⚪", hue: 200 },
  ];
  const N = RADAR.length, MAX = 100, cx = 140, cy = 140, R = 85;
  const progress = RADAR.map(a => {
    const t = totals[a.key] ?? 0;
    const d = done[a.key] ?? 0;
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });
  const hasAnyData = progress.some(p => p > 0);
  const fullDone = RADAR.filter((_, i) => progress[i] >= 100).length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const pt = (i: number, pct: number) => {
    const a = angle(i);
    const r = R * (Math.min(pct, MAX) / MAX);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPt = (i: number, ratio: number) => {
    const a = angle(i);
    return [cx + R * ratio * Math.cos(a), cy + R * ratio * Math.sin(a)];
  };
  const polyPoints = RADAR.map((_, i) => pt(i, progress[i]).join(",")).join(" ");

  return (
    <div style={{ background: "#1a1530", borderRadius: 18, border: "1px solid rgba(167,139,250,0.1)", padding: "16px 14px 14px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#A78BFA" }}>Roda das áreas</p>
        <span style={{ fontSize: 10, color: "#9e96b5" }}>{fullDone}/{N} 100%</span>
      </div>
      <svg viewBox="0 0 280 280" style={{ width: "100%", display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,92,255,0.3)" />
            <stop offset="100%" stopColor="rgba(124,92,255,0.05)" />
          </radialGradient>
        </defs>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(r => (
          <polygon key={r} points={RADAR.map((_, i) => ringPt(i, r).join(",")).join(" ")}
            fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="1" strokeDasharray={r === 1 ? "none" : "3,3"} />
        ))}
        {/* Axis lines */}
        {RADAR.map((_, i) => {
          const [ex, ey] = ringPt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(167,139,250,0.08)" strokeWidth="0.5" />;
        })}
        {/* Data polygon */}
        {hasAnyData && (
          <polygon points={polyPoints} fill="url(#radarGrad)" stroke="rgba(124,92,255,0.7)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {/* Dots at vertices */}
        {RADAR.map((a, i) => {
          const pct = progress[i];
          if (pct === 0) return null;
          const [x, y] = pt(i, pct);
          return (
            <g key={a.key}>
              <circle cx={x} cy={y} r="6" fill="rgba(124,92,255,0.2)" />
              <circle cx={x} cy={y} r="3.5" fill="#fff" stroke="#7C5CFF" strokeWidth="1.5" />
              <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#A78BFA">{pct}%</text>
            </g>
          );
        })}
        {/* Area labels */}
        {RADAR.map((a, i) => {
          const a2 = angle(i);
          const lx = cx + (R + 34) * Math.cos(a2), ly = cy + (R + 34) * Math.sin(a2);
          const pct = progress[i];
          const inactive = pct === 0 && !hasAnyData ? false : pct === 0;
          return (
            <g key={a.key}>
              <text x={lx} y={ly - 7} textAnchor="middle" dominantBaseline="middle" fontSize="15" opacity={inactive ? 0.35 : 1}>{a.emoji}</text>
              <text x={lx} y={ly + 9} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="700" fill={inactive ? "#4a4560" : "#A78BFA"} letterSpacing=".01em">{a.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Panel ───────────────────────────────────────────────────────

export function PlanejamentoPanel({ selectedDate }: { selectedDate?: string }) {
  const [plan, setPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Start at 0 (Monday) to avoid hydration crash, client useEffect corrects it
  const [selectedDay, setSelectedDay] = useState(0);
  const [dayReady, setDayReady] = useState(false);
  useEffect(() => {
    const d = new Date().getDay();
    setSelectedDay(d === 0 ? 6 : d - 1);
    setDayReady(true);
  }, []);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showReview, setShowReview] = useState(false);
  // Client-only current time
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i); }, []);
  const clientTodayDow = now ? (now.getDay() === 0 ? 6 : now.getDay() - 1) : -1;

  // Compute the Monday of the week containing selectedDate (or today)
  const currentWeekStart = useMemo(() => {
    const d = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
  }, [selectedDate]);

  // Add task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskArea, setNewTaskArea] = useState("saude");
  const [newTaskDay, setNewTaskDay] = useState(selectedDay);
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskType, setNewTaskType] = useState<"manutencao" | "crescimento">("manutencao");
  const [newIsStone, setNewIsStone] = useState(false);
  const [newStoneRank, setNewStoneRank] = useState(1);

  // Review form
  const [reviewWin, setReviewWin] = useState("");
  const [reviewBlock, setReviewBlock] = useState("");
  const [reviewLearn, setReviewLearn] = useState("");
  const [reviewScore, setReviewScore] = useState(3);
  const [editingPlanTask, setEditingPlanTask] = useState<any>(null);
  const [planEditTitle, setPlanEditTitle] = useState("");
  const [planEditDay, setPlanEditDay] = useState(0);
  const [planEditArea, setPlanEditArea] = useState("saude");
  const [planEditType, setPlanEditType] = useState<"manutencao" | "crescimento">("manutencao");
  const [planEditStone, setPlanEditStone] = useState(false);
  const [planEditStoneRank, setPlanEditStoneRank] = useState(1);
  const [planEditTime, setPlanEditTime] = useState("");
  const [planShowMore, setPlanShowMore] = useState(false);
  const [showStoneEditor, setShowStoneEditor] = useState(false);
  const [stone1, setStone1] = useState("");
  const [stone2, setStone2] = useState("");
  const [stone3, setStone3] = useState("");
  const [editingStoneIndex, setEditingStoneIndex] = useState(0); // 0=I, 1=II, 2=III

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/weekly-plans?week=${currentWeekStart}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setTasks(data.current?.weekly_tasks || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchPlan();
  }, [selectedDate]);

  // Lock body scroll when editor is open
  useEffect(() => {
    if (editingPlanTask || showStoneEditor || showAddTask) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [editingPlanTask]);

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

    // Create task
    const res = await fetch("/api/weekly-plans/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(), area: newTaskArea, day_of_week: newTaskDay === -1 ? null : newTaskDay,
        task_type: newTaskType, scheduled_time: newTaskTime || null,
        week_start: currentWeekStart,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev: any[]) => [...prev, task]);
    } else {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      console.error("addTask error:", err);
      alert(`Erro ao criar tarefa:\n${err.error || err.message || JSON.stringify(err)}\nweek: ${currentWeekStart}`);
    }

    // Define as pedra da semana
    if (newIsStone && currentPlan) {
      const stoneField = newStoneRank === 1 ? "main_focus" : newStoneRank === 2 ? "main_focus_2" : "main_focus_3";
      await fetch("/api/weekly-plans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [stoneField]: newTaskTitle.trim(), week_start: currentWeekStart }),
      });
    }

    setShowAddTask(false); setNewTaskTitle(""); setNewTaskTime(""); setNewIsStone(false); setNewStoneRank(1);
    fetchPlan();
  };

  const saveReview = async () => {
    if (!reviewWin.trim()) return;
    await fetch("/api/weekly-plans/review", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biggest_win: reviewWin, blocked_lesson: reviewBlock, main_learning: reviewLearn, week_score: reviewScore, week_start: currentWeekStart }),
    });
    setShowReview(false); fetchPlan();
  };

  const currentPlan = plan?.current ?? null;
  const review = currentPlan?.weekly_reviews?.[0] ?? null;
  const focuses = [currentPlan?.main_focus, currentPlan?.main_focus_2, currentPlan?.main_focus_3].filter(Boolean);
  const doneTasks = tasks.filter((t: any) => t.status === "concluida").length;

  const taskCountsByArea = useMemo(() => {
    const acc: Record<string, number> = {};
    ALL_AREAS.forEach(a => acc[a] = tasks.filter((t: any) => t.area === a && t.status === "concluida").length);
    return acc;
  }, [tasks]);
  const taskTotalByArea = useMemo(() => {
    const acc: Record<string, number> = {};
    ALL_AREAS.forEach(a => acc[a] = tasks.filter((t: any) => t.area === a).length);
    return acc;
  }, [tasks]);

  const selectedDayTasks = tasks.filter((t: any) => t.day_of_week === selectedDay)
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
  const openTasks = tasks.filter((t: any) => t.day_of_week == null || t.day_of_week === -1);

  const assignToToday = async (task: any) => {
    const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const res = await fetch(`/api/weekly-plans/tasks/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day_of_week: today }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev: any[]) => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  if (loading) return <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 20 }}>Carregando...</p>;

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Stones */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".08em" }}>Pedras</h2>
        {focuses.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {focuses.map((focus: string, i: number) => (
              <button key={i} type="button"
                onClick={() => {
                  // Open the same task editor, pre-filled as a stone
                  setEditingPlanTask({ id: null, title: focus, stoneRank: i + 1, isStone: true });
                  setPlanEditTitle(focus || "");
                  setPlanEditDay(-1);
                  setPlanEditArea("saude");
                  setPlanEditType("crescimento");
                  setPlanEditTime("");
                  setPlanEditStone(true);
                  setPlanEditStoneRank(i + 1);
                  setPlanShowMore(false);
                }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.15)", background: "#1a1530", cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#A78BFA", fontFamily: "monospace", opacity: 0.4, flexShrink: 0 }}>{["I","II","III"][i]}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff", lineHeight: 1.3 }}>{focus}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 20, background: "#1a1530", borderRadius: 14, border: "1px dashed rgba(167,139,250,0.15)" }}>
            <p style={{ margin: "0 0 6px", color: "#9e96b5", fontSize: 13 }}>Nenhuma pedra definida</p>
            <p style={{ margin: 0, color: "#9e96b5", fontSize: 11 }}>Toque no + para criar uma atividade e defini-la como pedra</p>
          </div>
        )}
      </div>

      {/* Radar — always visible */}
      <MiniRadar done={taskCountsByArea} totals={taskTotalByArea} />

      <p style={{ margin: "0 0 6px", fontSize: 11, color: "#9e96b5", fontFamily: "monospace" }}>{weekRange(selectedDate)} · {doneTasks}/{tasks.length} ✓</p>

      {/* Day selector */}
      <div suppressHydrationWarning style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 12 }}>
        {DAY_NAMES.map((d, i) => {
          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const dt = tasks.filter((t: any) => t.day_of_week === i);
          const isToday = i === today;
          return (
            <button key={i} type="button" onClick={() => setSelectedDay(i)}
              style={{ padding: "8px 2px 6px", borderRadius: 10, border: isToday ? "1.5px solid rgba(167,139,250,0.4)" : "1.5px solid transparent", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
              <span style={{ fontSize: 10, fontWeight: isToday ? 700 : 500, color: isToday ? "#A78BFA" : "#9e96b5", textTransform: "uppercase" }}>{d}</span>
              <div style={{ display: "flex", gap: 1.5 }}>{dt.slice(0,4).map((t: any, j: number) => (
                <span key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: t.status === "concluida" ? "#7C5CFF" : "rgba(167,139,250,0.2)" }} />
              ))}</div>
              <span style={{ fontSize: 9, fontWeight: 600, color: "#9e96b5" }}>{dt.filter((t: any) => t.status === "concluida").length}/{dt.length}</span>
            </button>
          );
        })}
      </div>

      {/* Em aberto */}
      {openTasks.length > 0 && (
        <div style={{ background: "#1a1530", borderRadius: 16, border: "1px solid rgba(167,139,250,0.1)", padding: "10px 14px", marginBottom: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#A78BFA" }}>📋 Em aberto</p>
          {openTasks.map((task: any) => {
            const area = AREA_CONFIG[task.area as TaskArea] || AREA_CONFIG.outros;
            const done = task.status === "concluida";
            return (
              <div key={task.id}
                onClick={() => {
                  setEditingPlanTask(task);
                  setPlanEditTitle(task.title || "");
                  setPlanEditDay(task.day_of_week ?? -1);
                  setPlanEditArea(task.area || "saude");
                  setPlanEditType(task.task_type || "manutencao");
                  setPlanEditTime(task.scheduled_time?.slice(0, 5) || "");
                  setPlanEditStone(!!task.stone_rank);
                  setPlanEditStoneRank(task.stone_rank || 1);
                  setPlanShowMore(false);
                }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(167,139,250,0.05)", cursor: "pointer" }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.status); }}
                  style={{ width: 18, height: 18, borderRadius: task.task_type === "manutencao" ? "50%" : 4, flexShrink: 0, border: done ? "none" : "1.5px solid rgba(167,139,250,0.3)", background: done ? "#7C5CFF" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>}
                </button>
                <span style={{ fontSize: 10 }}>{area.emoji}</span>
                {task.stone_rank && (
                  <span style={{ fontSize: 8, fontWeight: 800, color: "#A78BFA", background: "rgba(167,139,250,0.12)", padding: "1px 4px", borderRadius: 4, fontFamily: "monospace", flexShrink: 0 }}>
                    {["I","II","III"][task.stone_rank - 1]}
                  </span>
                )}
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: done ? "#5a5470" : "#e0d6ff", textDecoration: done ? "line-through" : "none" }}>{task.title}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); assignToToday(task); }}
                  style={{ padding: "3px 8px", borderRadius: 9999, border: "1px solid rgba(167,139,250,0.25)", background: "rgba(124,92,255,0.08)", color: "#A78BFA", fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  Hoje →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tasks */}
      <div style={{ background: "#1a1530", borderRadius: 16, border: "1px solid rgba(167,139,250,0.1)", padding: "10px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p suppressHydrationWarning style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9e96b5" }}>{DAY_FULL[selectedDay]}</p>
        </div>
        {/* Current time indicator (today only) */}
        {selectedDay === clientTodayDow && now && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "5px 10px", borderRadius: 8, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF5050", flexShrink: 0, boxShadow: "0 0 0 3px rgba(255,80,80,0.25)", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "#FF7070" }}>Agora · {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}
        {selectedDayTasks.length === 0 ? (
          <p style={{ color: "#9e96b5", fontSize: 12, textAlign: "center", padding: 8, margin: 0 }}>Nenhuma tarefa</p>
        ) : (
          selectedDayTasks.map((task: any) => {
            const area = AREA_CONFIG[task.area as TaskArea] || AREA_CONFIG.outros;
            const done = task.status === "concluida";
            return (
              <div key={task.id}
                onClick={() => {
                  setEditingPlanTask(task);
                  setPlanEditTitle(task.title || "");
                  setPlanEditDay(task.day_of_week ?? 0);
                  setPlanEditArea(task.area || "saude");
                  setPlanEditType(task.task_type || "manutencao");
                  setPlanEditTime(task.scheduled_time?.slice(0, 5) || "");
                  setPlanEditStone(!!task.stone_rank);
                  setPlanEditStoneRank(task.stone_rank || 1);
                  setPlanShowMore(false);
                }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(167,139,250,0.05)", cursor: "pointer" }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleTask(task.id, task.status); }}
                  style={{ width: 18, height: 18, borderRadius: task.task_type === "manutencao" ? "50%" : 4, flexShrink: 0, border: done ? "none" : "1.5px solid rgba(167,139,250,0.3)", background: done ? "#7C5CFF" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="m5 12 5 5 9-10" /></svg>}
                </button>
                <span style={{ fontSize: 10 }}>{area.emoji}</span>
                {task.stone_rank && (
                  <span style={{ fontSize: 8, fontWeight: 800, color: "#A78BFA", background: "rgba(167,139,250,0.12)", padding: "1px 4px", borderRadius: 4, fontFamily: "monospace", flexShrink: 0 }}>
                    {["I","II","III"][task.stone_rank - 1]}
                  </span>
                )}
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
          style={{
            width: "100%", padding: "16px 0", borderRadius: 16, border: "1px solid rgba(167,139,250,0.2)",
            background: "linear-gradient(135deg, rgba(124,92,255,0.08) 0%, rgba(167,139,250,0.04) 100%)",
            cursor: "pointer", color: "#A78BFA", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all .15s ease",
          }}>
          <span style={{ fontSize: 18 }}>⭐</span> Fazer revisão da semana
        </button>
      )}

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

      {/* History */}
      {plan?.history?.length > 0 && (
        <div style={{ marginTop: 12 }}>
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

      {/* Add Task Sheet */}
      {showAddTask && (
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflow: "hidden" }}>
          <div style={{ width: "100%", maxWidth: 400, maxHeight: "70dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
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
                    (AREA_LABELS as Record<string, string>)[a] || a
                  }</span>
                </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4 }}>Dia {newTaskDay === -1 && <span style={{ color: "#A78BFA" }}>· Em aberto</span>}</p>
                <div style={{ display: "flex", gap: 2 }}>
                  {DAY_NAMES.map((d, i) => (
                    <button key={i} type="button" onClick={() => setNewTaskDay(newTaskDay === i ? -1 : i)}
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
            {/* Pedra da semana */}
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: "#0B0B10", border: newIsStone ? "1px solid rgba(124,92,255,0.3)" : "1px solid rgba(167,139,250,0.1)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={newIsStone} onChange={e => setNewIsStone(e.target.checked)}
                  style={{ accentColor: "#7C5CFF", width: 18, height: 18 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff" }}>Definir como pedra da semana</span>
              </label>
              {newIsStone && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {([1,2,3] as const).map(n => {
                    const occupied = n === 1 ? currentPlan?.main_focus : n === 2 ? currentPlan?.main_focus_2 : currentPlan?.main_focus_3;
                    const isOccupied = !!occupied;
                    return (
                      <button key={n} type="button" onClick={() => setNewStoneRank(n)}
                        style={{
                          flex: 1, padding: "8px 0", borderRadius: 10, border: 0, cursor: "pointer",
                          fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                          background: newStoneRank === n ? "#7C5CFF" : "rgba(167,139,250,0.08)",
                          color: newStoneRank === n ? "#fff" : "#9e96b5",
                          opacity: isOccupied && newStoneRank !== n ? 0.5 : 1,
                        }}>
                        {["I", "II", "III"][n-1]}
                        {isOccupied && <div style={{ fontSize: 8, opacity: .7 }}>em uso</div>}
                      </button>
                    );
                  })}
                </div>
              )}
              {newIsStone && (() => {
                const occupied = newStoneRank === 1 ? currentPlan?.main_focus : newStoneRank === 2 ? currentPlan?.main_focus_2 : currentPlan?.main_focus_3;
                if (!occupied) return null;
                return (
                  <p style={{ margin: "8px 0 0", fontSize: 10, color: "#FF9F43", textAlign: "center" }}>
                    ⚠️ Já existe uma pedra {["I","II","III"][newStoneRank-1]}: "{String(occupied).slice(0, 40)}" — será substituída
                  </p>
                );
              })()}
            </div>

            {/* Time — toggle on/off */}
            <div style={{ marginTop: 12 }}>
              {newTaskTime ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#0B0B10", border: "1px solid rgba(167,139,250,0.2)" }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>🕐</span>
                    <input type="time" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)}
                      style={{ flex: 1, background: "transparent", border: 0, color: "#A78BFA", fontSize: 13, fontWeight: 600, fontFamily: "inherit", outline: "none", minWidth: 0 }} />
                  </div>
                  <button type="button" onClick={() => setNewTaskTime("")}
                    style={{ padding: "8px", borderRadius: 9999, border: 0, background: "rgba(167,139,250,0.1)", color: "#9e96b5", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => setNewTaskTime("09:00")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: "1px dashed rgba(167,139,250,0.25)", background: "transparent", color: "#9e96b5", fontSize: 12, cursor: "pointer", fontFamily: "inherit", width: "100%", justifyContent: "center" }}>
                  🕐 Adicionar horário
                </button>
              )}
            </div>
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
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9e96b5" }}>{weekRange(selectedDate)}</p>
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

      {/* ── Plan task editor ──────────────────────────── */}
      {editingPlanTask && (
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflow: "hidden" }}>
          <div style={{ width: "100%", maxWidth: 380, maxHeight: "70dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>
                {(editingPlanTask as any).isStone ? `Pedra ${["I","II","III"][planEditStoneRank - 1]}` : "Editar tarefa"}
              </h3>
              <button type="button" onClick={() => setEditingPlanTask(null)} style={{ background: "none", border: 0, color: "#9e96b5", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {/* Title */}
            <input value={planEditTitle} onChange={e => setPlanEditTitle(e.target.value)}
              placeholder="Título" autoFocus
              style={{...inputS, marginBottom: 10, width: "100%", boxSizing: "border-box"}} />

            {/* Day */}
            <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4, display: "block" }}>Dia {planEditDay === -1 && <span style={{ color: "#A78BFA" }}>· Em aberto</span>}</label>
            <div style={{ display: "flex", gap: 2, marginBottom: planShowMore ? 10 : 16 }}>
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label, i) => (
                <button key={i} type="button" onClick={() => setPlanEditDay(planEditDay === i ? -1 : i)}
                  style={{ flex: 1, padding: "5px 2px", borderRadius: 8, border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 9, fontWeight: 600,
                    background: planEditDay === i ? "#7C5CFF" : "rgba(167,139,250,0.08)", color: planEditDay === i ? "#fff" : "#9e96b5" }}>{label}</button>
              ))}
            </div>

            {/* More options toggle */}
            <button type="button" onClick={() => setPlanShowMore(!planShowMore)}
              style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: 0, cursor: "pointer", background: planShowMore ? "rgba(124,92,255,0.08)" : "transparent", color: "#9e96b5", fontSize: 11, fontWeight: 600, fontFamily: "inherit", marginBottom: planShowMore ? 10 : 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {planShowMore ? "▲" : "▼"} Mais opções
            </button>

            {planShowMore && (
              <>
                {/* Area */}
                <p style={{ fontSize: 10, color: "#9e96b5", margin: "0 0 4px" }}>Área</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginBottom: 10 }}>
                  {ALL_AREAS.slice(0,9).map(a => {
                    const area = AREA_CONFIG[a];
                    return (
                    <button key={a} type="button" onClick={() => setPlanEditArea(a)}
                      style={{ padding: "6px 4px", borderRadius: 8, border: planEditArea === a ? "1.5px solid #7C5CFF" : "1px solid rgba(167,139,250,0.12)", background: planEditArea === a ? "rgba(124,92,255,0.1)" : "#0B0B10", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12 }}>{area?.emoji}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: planEditArea === a ? "#A78BFA" : "#9e96b5" }}>{(AREA_LABELS as Record<string, string>)[a] || a}</span>
                    </button>
                    );
                  })}
                </div>

                {/* Type */}
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <button type="button" onClick={() => setPlanEditType("manutencao")}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: planEditType === "manutencao" ? "1.5px solid #7C5CFF" : "1px solid rgba(167,139,250,0.12)", background: planEditType === "manutencao" ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer", color: planEditType === "manutencao" ? "#A78BFA" : "#9e96b5", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>↻ Hábito</button>
                  <button type="button" onClick={() => setPlanEditType("crescimento")}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: planEditType === "crescimento" ? "1.5px solid #7C5CFF" : "1px solid rgba(167,139,250,0.12)", background: planEditType === "crescimento" ? "rgba(124,92,255,0.1)" : "transparent", cursor: "pointer", color: planEditType === "crescimento" ? "#A78BFA" : "#9e96b5", fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>↑ Crescer</button>
                </div>

                {/* Definir como pedra da semana */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10 }}>
                  <input type="checkbox" checked={planEditStone} onChange={e => setPlanEditStone(e.target.checked)}
                    style={{ accentColor: "#7C5CFF", width: 16, height: 16 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e0d6ff" }}>Definir como pedra da semana</span>
                </label>
                {planEditStone && (
                  <>
                    <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                      {([1,2,3] as const).map(n => {
                        const occ = n === 1 ? (currentPlan?.main_focus ?? "") : n === 2 ? (currentPlan?.main_focus_2 ?? "") : (currentPlan?.main_focus_3 ?? "");
                        const isOcc = !!occ;
                        return (
                          <button key={n} type="button" onClick={() => setPlanEditStoneRank(n)}
                            style={{
                              flex: 1, padding: "6px 0", borderRadius: 8, border: 0, cursor: "pointer",
                              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                              background: planEditStoneRank === n ? "#7C5CFF" : "rgba(167,139,250,0.08)",
                              color: planEditStoneRank === n ? "#fff" : "#9e96b5",
                              opacity: isOcc && planEditStoneRank !== n ? 0.5 : 1,
                            }}>
                            {["I","II","III"][n-1]}
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const occ = planEditStoneRank === 1 ? (currentPlan?.main_focus ?? "") : planEditStoneRank === 2 ? (currentPlan?.main_focus_2 ?? "") : (currentPlan?.main_focus_3 ?? "");
                      if (!occ) return null;
                      return (
                        <p style={{ margin: "0 0 8px", fontSize: 10, color: "#FF9F43", textAlign: "center" }}>
                          ⚠️ Substituirá "{String(occ).slice(0, 40)}"
                        </p>
                      );
                    })()}
                  </>
                )}

                {/* Time */}
                {planEditTime ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#0B0B10", border: "1px solid rgba(167,139,250,0.2)" }}>
                      <span style={{ fontSize: 11 }}>🕐</span>
                      <input type="time" value={planEditTime} onChange={e => setPlanEditTime(e.target.value)}
                        style={{ flex: 1, background: "transparent", border: 0, color: "#A78BFA", fontSize: 12, fontWeight: 600, fontFamily: "inherit", outline: "none" }} />
                    </div>
                    <button type="button" onClick={() => setPlanEditTime("")}
                      style={{ padding: "6px", borderRadius: 9999, border: 0, background: "rgba(167,139,250,0.1)", color: "#9e96b5", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPlanEditTime("09:00")}
                    style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "1px dashed rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 11, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
                    🕐 Adicionar horário
                  </button>
                )}
              </>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={async () => {
                if ((editingPlanTask as any).isStone) {
                  if (!confirm("Remover esta pedra?")) return;
                  const rank = planEditStoneRank;
                  const stoneField = rank === 1 ? "main_focus" : rank === 2 ? "main_focus_2" : "main_focus_3";
                  if (!plan) return;
                  const res = await fetch(`/api/weekly-plans/${plan.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [stoneField]: null }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setPlan(updated);
                    setEditingPlanTask(null);
                  }
                } else {
                  if (!confirm("Excluir esta tarefa?")) return;
                  await fetch(`/api/weekly-plans/tasks/${editingPlanTask.id}`, { method: "DELETE" });
                  setTasks((prev: any[]) => prev.filter((t: any) => t.id !== editingPlanTask.id));
                  setEditingPlanTask(null);
                }
              }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: 0, background: "rgba(255,92,92,0.1)", color: "#FF5C5C", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                🗑 Excluir
              </button>
              <button type="button" onClick={async () => {
                if ((editingPlanTask as any).isStone) {
                  // Save as stone (plan API)
                  const rank = planEditStoneRank;
                  const stoneField = rank === 1 ? "main_focus" : rank === 2 ? "main_focus_2" : "main_focus_3";
                  if (!plan) return;
                  const res = await fetch(`/api/weekly-plans/${plan.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [stoneField]: planEditTitle.trim() || null }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setPlan(updated);
                    setEditingPlanTask(null);
                  }
                } else {
                  // Save as task (task API)
                  const updates: Record<string, unknown> = {
                    title: planEditTitle.trim() || editingPlanTask.title,
                    day_of_week: planEditDay === -1 ? null : planEditDay,
                    area: planEditArea,
                    task_type: planEditType,
                    scheduled_time: planEditTime || null,
                  };
                  const res = await fetch(`/api/weekly-plans/tasks/${editingPlanTask.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setTasks((prev: any[]) => prev.map((t: any) => t.id === editingPlanTask.id ? updated : t));
                  }
                  // If marked as stone, update the weekly plan
                  if (planEditStone) {
                    const stoneField = planEditStoneRank === 1 ? "main_focus" : planEditStoneRank === 2 ? "main_focus_2" : "main_focus_3";
                    await fetch("/api/weekly-plans", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ [stoneField]: planEditTitle.trim(), week_start: currentWeekStart }),
                    });
                    fetchPlan(); // Refresh to show updated stones
                  }
                  setEditingPlanTask(null);
                }
              }}
                style={{ flex: 2, padding: "12px 0", borderRadius: 14, border: 0, background: "#7C5CFF", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stone editor modal ─────────────────────────── */}
      {/* ── Stone editor modal ─────────────────────────── */}
      {showStoneEditor && (
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflow: "hidden" }}>
          <div style={{ width: "100%", maxWidth: 380, maxHeight: "70dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>Pedra {["I","II","III"][editingStoneIndex]}</h3>
              <button type="button" onClick={() => setShowStoneEditor(false)} style={{ background: "none", border: 0, color: "#9e96b5", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {/* Editable fields for the clicked stone */}
            {(() => {
              const n = editingStoneIndex + 1;
              const val = n === 1 ? stone1 : n === 2 ? stone2 : stone3;
              const setVal = n === 1 ? setStone1 : n === 2 ? setStone2 : setStone3;
              return (
                <input value={val} onChange={e => setVal(e.target.value)}
                  placeholder={`Pedra ${["I","II","III"][editingStoneIndex]}`} autoFocus
                  style={{...inputS, marginBottom: 16, width: "100%", boxSizing: "border-box"}} />
              );
            })()}

            {/* Show other stones compactly */}
            <div style={{ marginBottom: 16 }}>
              {[0,1,2].filter(i => i !== editingStoneIndex).map(i => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#5a5470", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 2 }}>
                    {["I","II","III"][i]}
                  </label>
                  <input value={i === 0 ? stone1 : i === 1 ? stone2 : stone3}
                    onChange={e => (i === 0 ? setStone1 : i === 1 ? setStone2 : setStone3)(e.target.value)}
                    placeholder={`Pedra ${["I","II","III"][i]}`}
                    style={{...inputS, width: "100%", boxSizing: "border-box", fontSize: 12, padding: "8px 10px"}} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setShowStoneEditor(false)}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button type="button" onClick={async () => {
                if (!plan) return;
                const res = await fetch(`/api/weekly-plans/${plan.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    main_focus: stone1.trim() || null,
                    main_focus_2: stone2.trim() || null,
                    main_focus_3: stone3.trim() || null,
                  }),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setPlan(updated);
                  setShowStoneEditor(false);
                }
              }}
                style={{ flex: 2, padding: 14, borderRadius: 14, border: 0, background: "#7C5CFF", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

const inputS: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
  background: "#0B0B10", color: "#e0d6ff", fontSize: 14,
  fontFamily: "inherit", outline: "none",
};
