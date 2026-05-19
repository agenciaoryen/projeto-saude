"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Target, Check, ChevronDown, ChevronUp, Star, Sparkles,
  Plus, Calendar, Clock, Pencil, Trash2, X,
} from "lucide-react";
import type { Goal, GoalStage, GoalAction, WeeklyPlan, WeeklyReview, WeeklyTask, TaskArea } from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const AREA_CONFIG: Record<string, { emoji: string; hue: number; label: string }> = {
  saude:           { emoji: "💚", hue: 160, label: "Saúde" },
  carreira:        { emoji: "💼", hue: 220, label: "Carreira" },
  financas:        { emoji: "💰", hue: 85,  label: "Finanças" },
  relacionamentos: { emoji: "❤️", hue: 15,  label: "Relacionamentos" },
  desenvolvimento: { emoji: "🧠", hue: 270, label: "Desenvolvimento" },
  familia:         { emoji: "🏡", hue: 40,  label: "Família" },
  lazer:           { emoji: "🌊", hue: 185, label: "Lazer" },
  espiritualidade: { emoji: "✨", hue: 300, label: "Espiritualidade" },
  outros:          { emoji: "⚪", hue: 200, label: "Outros" },
};

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const ALL_AREAS = Object.keys(AREA_CONFIG) as TaskArea[];

function ac(hue: number, l = 0.5, c = 0.12) { return `oklch(${l} ${c} ${hue})`; }
function al(hue: number) { return `oklch(.95 .05 ${hue})`; }

type GoalFull = Goal & { goal_stages: (GoalStage & { goal_actions: GoalAction[] })[] };
type PlanFull = WeeklyPlan & {
  weekly_reviews: WeeklyReview[];
  weekly_focus_goals: { goal_id: string }[];
  weekly_tasks: WeeklyTask[];
};
type PlanData = { current: PlanFull | null; history: (WeeklyPlan & { weekly_reviews?: WeeklyReview[] })[] };

function weekLabel() {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} style={{
          border: 0, background: "none", padding: 0, cursor: "pointer", fontSize: 28,
          filter: n <= value ? "none" : "grayscale(1) opacity(.35)",
          transition: "filter .15s ease",
        }}>⭐</button>
      ))}
    </div>
  );
}

// ── Focus editor (pedras principais) ──────────────────────────────────────────

function FocusModal({
  initial, goals, onClose, onSaved,
}: {
  initial: { f1: string; f2: string; f3: string; focusGoalIds: string[] };
  goals: GoalFull[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f1, setF1] = useState(initial.f1);
  const [f2, setF2] = useState(initial.f2);
  const [f3, setF3] = useState(initial.f3);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(initial.focusGoalIds);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (id: string) =>
    setSelectedGoals((p) => p.includes(id) ? p.filter((g) => g !== id) : p.length < 5 ? [...p, id] : p);

  const save = async () => {
    if (!f1.trim()) return;
    setSaving(true);
    await fetch("/api/weekly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_focus: f1,
        main_focus_2: f2.trim() || null,
        main_focus_3: f3.trim() || null,
        focus_goal_ids: selectedGoals,
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px",
    borderRadius: 12, border: "1.5px solid oklch(.82 .03 160)",
    background: "oklch(.98 .005 160)", fontFamily: "inherit",
    fontSize: 14, color: "oklch(.2 .02 160)", outline: "none",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(.1 .02 160 / .4)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
        borderRadius: "24px 24px 0 0", background: "#fff",
        padding: "20px 20px calc(env(safe-area-inset-bottom) + 28px)",
        boxShadow: "0 -8px 40px oklch(.2 .04 160 / .15)",
        maxHeight: "90dvh", overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: "oklch(.85 .02 160)", margin: "0 auto 20px" }} />
        <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "oklch(.2 .02 160)" }}>Pedras da semana</h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "oklch(.55 .04 160)" }}>
          1 a 3 prioridades que fazem a semana valer a pena · {weekLabel()}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { val: f1, set: setF1, label: "🎯 Pedra 1 (obrigatória)", ph: "O que DEVE acontecer esta semana?" },
            { val: f2, set: setF2, label: "🪨 Pedra 2 (opcional)", ph: "Segunda prioridade…" },
            { val: f3, set: setF3, label: "🪨 Pedra 3 (opcional)", ph: "Terceira prioridade…" },
          ].map(({ val, set, label, ph }) => (
            <div key={label}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>{label}</p>
              <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "oklch(.5 .12 160)"; }}
                onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "oklch(.82 .03 160)"; }}
              />
            </div>
          ))}
        </div>

        {goals.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Metas em destaque esta semana
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {goals.map((g) => {
                const conf = AREA_CONFIG[g.area] ?? AREA_CONFIG.outros;
                const sel = selectedGoals.includes(g.id);
                return (
                  <button key={g.id} type="button" onClick={() => toggleGoal(g.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                    borderRadius: 13, border: sel ? `2px solid ${ac(conf.hue)}` : "2px solid oklch(.88 .02 160)",
                    background: sel ? al(conf.hue) : "#fff", cursor: "pointer", textAlign: "left",
                    transition: "all .15s ease",
                  }}>
                    <span style={{ fontSize: 17 }}>{conf.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "oklch(.25 .02 160)" }}>{g.title}</span>
                    {sel && <Check size={15} style={{ color: ac(conf.hue), flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button type="button" onClick={save} disabled={saving || !f1.trim()} style={{
          width: "100%", padding: "15px 20px", borderRadius: 14, border: 0,
          cursor: (saving || !f1.trim()) ? "not-allowed" : "pointer",
          background: (saving || !f1.trim()) ? "oklch(.88 .02 160)" : "oklch(.5 .12 160)",
          fontFamily: "inherit", fontSize: 15, fontWeight: 700,
          color: (saving || !f1.trim()) ? "oklch(.6 .02 160)" : "#fff",
        }}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </>
  );
}

// ── Add Task Sheet ─────────────────────────────────────────────────────────────

function AddTaskSheet({
  goals, initialDay, onClose, onSaved,
}: {
  goals: GoalFull[];
  initialDay?: number;
  onClose: () => void;
  onSaved: (task: WeeklyTask) => void;
}) {
  const [title, setTitle]           = useState("");
  const [area, setArea]             = useState<TaskArea | "">("");
  const [day, setDay]               = useState<number>(initialDay ?? new Date().getDay() === 0 ? 6 : (new Date().getDay() - 1));
  const [time, setTime]             = useState("");
  const [taskType, setTaskType]     = useState<"crescimento" | "manutencao">("manutencao");
  const [linkedGoalId, setLinkedGoalId]     = useState("");
  const [linkedActionId, setLinkedActionId] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedGoal = goals.find((g) => g.id === linkedGoalId);
  const availableActions = selectedGoal
    ? (selectedGoal.goal_stages ?? []).flatMap((s) =>
        (s.goal_actions ?? []).filter((a) => a.status === "pendente")
      )
    : [];

  const canSave = title.trim().length >= 2 && area !== "" && day !== undefined;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    const res = await fetch("/api/weekly-plans/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        area,
        task_type: taskType,
        linked_goal_id: linkedGoalId || null,
        linked_action_id: linkedActionId || null,
        day_of_week: day,
        scheduled_time: time || null,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      onSaved(task);
      onClose();
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px",
    borderRadius: 12, border: "1.5px solid oklch(.82 .03 160)",
    background: "oklch(.98 .005 160)", fontFamily: "inherit",
    fontSize: 14, color: "oklch(.2 .02 160)", outline: "none",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(.1 .02 160 / .4)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
        borderRadius: "24px 24px 0 0", background: "#fff",
        padding: "20px 20px calc(env(safe-area-inset-bottom) + 28px)",
        boxShadow: "0 -8px 40px oklch(.2 .04 160 / .15)",
        maxHeight: "92dvh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: "oklch(.85 .02 160)", marginBottom: 14 }} />
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "oklch(.2 .02 160)" }}>Nova tarefa</h2>
          </div>
          <button type="button" onClick={onClose} style={{ border: 0, background: "oklch(.93 .02 160)", borderRadius: 10, padding: 8, cursor: "pointer" }}>
            <X size={18} style={{ color: "oklch(.45 .06 160)" }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Dia */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Dia da semana *
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {DAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => setDay(i)} style={{
                  flex: 1, padding: "9px 2px", borderRadius: 10, border: 0, cursor: "pointer",
                  background: day === i ? "oklch(.5 .12 160)" : "oklch(.93 .02 160)",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                  color: day === i ? "#fff" : "oklch(.45 .06 160)",
                  transition: "all .12s ease",
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Título *
            </p>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "oklch(.5 .12 160)"; }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "oklch(.82 .03 160)"; }}
            />
          </div>

          {/* Área */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Área da vida *
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
              {ALL_AREAS.map((a) => {
                const conf = AREA_CONFIG[a];
                const sel = area === a;
                return (
                  <button key={a} type="button" onClick={() => setArea(a)} style={{
                    padding: "10px 6px", borderRadius: 12, border: sel ? `2px solid ${ac(conf.hue)}` : "2px solid oklch(.88 .02 160)",
                    background: sel ? al(conf.hue) : "#fff", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all .12s ease",
                  }}>
                    <span style={{ fontSize: 18 }}>{conf.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sel ? ac(conf.hue) : "oklch(.45 .04 160)" }}>
                      {conf.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Tipo
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {([
                { val: "manutencao", label: "🔄 Manutenção", desc: "Nutre o que já conquistou" },
                { val: "crescimento", label: "🚀 Crescimento", desc: "Avança em direção a uma meta" },
              ] as const).map(({ val, label, desc }) => (
                <button key={val} type="button" onClick={() => { setTaskType(val); if (val === "manutencao") { setLinkedGoalId(""); setLinkedActionId(""); } }} style={{
                  flex: 1, padding: "12px 10px", borderRadius: 13,
                  border: taskType === val ? "2px solid oklch(.5 .12 160)" : "2px solid oklch(.88 .02 160)",
                  background: taskType === val ? "oklch(.95 .05 160)" : "#fff",
                  cursor: "pointer", textAlign: "left",
                  transition: "all .12s ease",
                }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "oklch(.25 .02 160)" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "oklch(.55 .04 160)" }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Horário */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Horário (opcional)
            </p>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, padding: 0, overflow: "hidden" }}>
              <Clock size={15} style={{ color: "oklch(.6 .04 160)", marginLeft: 14, flexShrink: 0 }} />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  flex: 1, padding: "12px 14px 12px 6px", border: "none",
                  background: "transparent", fontFamily: "inherit",
                  fontSize: 14, color: "oklch(.2 .02 160)", outline: "none",
                }}
              />
            </div>
          </div>

          {/* Meta vinculada (só se crescimento) */}
          {taskType === "crescimento" && goals.length > 0 && (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
                Vincular a uma meta (opcional)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {goals.map((g) => {
                  const conf = AREA_CONFIG[g.area] ?? AREA_CONFIG.outros;
                  const sel = linkedGoalId === g.id;
                  return (
                    <button key={g.id} type="button"
                      onClick={() => { setLinkedGoalId(sel ? "" : g.id); setLinkedActionId(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        borderRadius: 12, border: sel ? `2px solid ${ac(conf.hue)}` : "2px solid oklch(.88 .02 160)",
                        background: sel ? al(conf.hue) : "#fff", cursor: "pointer", textAlign: "left",
                        transition: "all .12s ease",
                      }}>
                      <span style={{ fontSize: 16 }}>{conf.emoji}</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "oklch(.25 .02 160)" }}>{g.title}</span>
                      {sel && <Check size={14} style={{ color: ac(conf.hue), flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>

              {availableActions.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
                    Ação específica (opcional)
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {availableActions.map((a) => {
                      const sel = linkedActionId === a.id;
                      return (
                        <button key={a.id} type="button" onClick={() => setLinkedActionId(sel ? "" : a.id)} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          borderRadius: 12, border: sel ? "2px solid oklch(.5 .12 160)" : "2px solid oklch(.88 .02 160)",
                          background: sel ? "oklch(.95 .05 160)" : "#fff", cursor: "pointer", textAlign: "left",
                          transition: "all .12s ease",
                        }}>
                          <span style={{ fontSize: 13, flex: 1, color: "oklch(.3 .04 160)" }}>{a.title}</span>
                          {sel && <Check size={14} style={{ color: "oklch(.5 .12 160)", flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button type="button" onClick={save} disabled={!canSave || saving} style={{
          marginTop: 24, width: "100%", padding: "15px 20px", borderRadius: 14, border: 0,
          cursor: (!canSave || saving) ? "not-allowed" : "pointer",
          background: (!canSave || saving) ? "oklch(.88 .02 160)" : "oklch(.5 .12 160)",
          fontFamily: "inherit", fontSize: 15, fontWeight: 700,
          color: (!canSave || saving) ? "oklch(.6 .02 160)" : "#fff",
          transition: "all .15s ease",
        }}>
          {saving ? "Salvando…" : "Adicionar tarefa"}
        </button>
      </div>
    </>
  );
}

// ── Review modal ──────────────────────────────────────────────────────────────

function ReviewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [biggestWin, setBiggestWin]   = useState("");
  const [blockedLesson, setBlockedLesson] = useState("");
  const [mainLearning, setMainLearning]   = useState("");
  const [weekScore, setWeekScore]     = useState(3);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!biggestWin.trim()) return;
    setSaving(true);
    await fetch("/api/weekly-plans/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ biggest_win: biggestWin, blocked_lesson: blockedLesson, main_learning: mainLearning, week_score: weekScore }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px",
    borderRadius: 12, border: "1.5px solid oklch(.82 .03 160)",
    background: "oklch(.98 .005 160)", fontFamily: "inherit",
    fontSize: 14, color: "oklch(.2 .02 160)", outline: "none", resize: "none", lineHeight: 1.6,
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(.1 .02 160 / .4)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
        borderRadius: "24px 24px 0 0", background: "#fff",
        padding: "20px 20px calc(env(safe-area-inset-bottom) + 28px)",
        boxShadow: "0 -8px 40px oklch(.2 .04 160 / .15)",
        maxHeight: "90dvh", overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: "oklch(.85 .02 160)", margin: "0 auto 20px" }} />
        <h2 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "oklch(.2 .02 160)" }}>Revisão da semana</h2>
        <p style={{ margin: "0 0 24px", fontSize: 12, color: "oklch(.55 .04 160)" }}>{weekLabel()}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>🏆 Qual foi sua maior vitória?</p>
            <textarea value={biggestWin} onChange={(e) => setBiggestWin(e.target.value)} placeholder="Celebre algo, por menor que seja..." rows={2} style={fieldStyle} />
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>🔒 O que travou e como lidar diferente?</p>
            <textarea value={blockedLesson} onChange={(e) => setBlockedLesson(e.target.value)} placeholder="Não é culpa — é aprendizado." rows={2} style={fieldStyle} />
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>💡 Principal aprendizado</p>
            <textarea value={mainLearning} onChange={(e) => setMainLearning(e.target.value)} placeholder="Uma coisa que levará para a próxima semana..." rows={2} style={fieldStyle} />
          </div>
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>Como foi a semana?</p>
            <StarRating value={weekScore} onChange={setWeekScore} />
          </div>
        </div>

        <button type="button" onClick={save} disabled={saving || !biggestWin.trim()} style={{
          marginTop: 24, width: "100%", padding: "15px 20px", borderRadius: 14, border: 0,
          cursor: (saving || !biggestWin.trim()) ? "not-allowed" : "pointer",
          background: (saving || !biggestWin.trim()) ? "oklch(.88 .02 160)" : "linear-gradient(135deg, oklch(.5 .12 160), oklch(.42 .14 200))",
          fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#fff",
        }}>
          {saving ? "Salvando…" : "Fechar semana"}
        </button>
      </div>
    </>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete }: {
  task: WeeklyTask;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const conf = AREA_CONFIG[task.area] ?? AREA_CONFIG.outros;
  const done = task.status === "concluida";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
      borderRadius: 13, background: done ? "oklch(.97 .005 160)" : "#fff",
      border: `1.5px solid ${done ? "oklch(.9 .01 160)" : "oklch(.88 .02 160)"}`,
      transition: "all .15s ease",
    }}>
      <button type="button" onClick={onToggle} style={{
        width: 22, height: 22, borderRadius: "50%", border: 0, flexShrink: 0, cursor: "pointer",
        background: done ? "oklch(.5 .12 160)" : "oklch(.92 .02 160)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s ease",
      }}>
        {done && <Check size={12} color="#fff" />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600,
          color: done ? "oklch(.6 .03 160)" : "oklch(.22 .02 160)",
          textDecoration: done ? "line-through" : "none",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {task.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12 }}>{conf.emoji}</span>
          <span style={{ fontSize: 11, color: ac(conf.hue), fontWeight: 600 }}>{conf.label}</span>
          {task.scheduled_time && (
            <>
              <span style={{ fontSize: 10, color: "oklch(.7 .02 160)" }}>·</span>
              <Clock size={10} style={{ color: "oklch(.6 .04 160)" }} />
              <span style={{ fontSize: 11, color: "oklch(.5 .04 160)" }}>{task.scheduled_time.slice(0, 5)}</span>
            </>
          )}
          {task.task_type === "crescimento" && (
            <>
              <span style={{ fontSize: 10, color: "oklch(.7 .02 160)" }}>·</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "oklch(.45 .1 220)", background: "oklch(.93 .04 220)", padding: "1px 5px", borderRadius: 5 }}>🚀</span>
            </>
          )}
        </div>
      </div>

      <button type="button" onClick={onDelete} style={{
        border: 0, background: "none", cursor: "pointer", padding: 4, flexShrink: 0,
        color: "oklch(.75 .03 160)",
      }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Area coverage widget ──────────────────────────────────────────────────────

function AreaCoverage({ tasks }: { tasks: WeeklyTask[] }) {
  const counts = ALL_AREAS.reduce<Record<string, number>>((acc, a) => {
    acc[a] = tasks.filter((t) => t.area === a).length;
    return acc;
  }, {});

  const covered = ALL_AREAS.filter((a) => counts[a] > 0).length;

  return (
    <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
          Cobertura das áreas
        </p>
        <span style={{ fontSize: 12, fontWeight: 700, color: covered === ALL_AREAS.length ? "oklch(.45 .12 160)" : "oklch(.55 .04 160)" }}>
          {covered}/{ALL_AREAS.length}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ALL_AREAS.map((a) => {
          const conf = AREA_CONFIG[a];
          const n = counts[a];
          const active = n > 0;
          return (
            <div key={a} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 20,
              background: active ? al(conf.hue) : "oklch(.94 .005 160)",
              border: active ? `1.5px solid ${ac(conf.hue, .7, .06)}` : "1.5px solid oklch(.88 .01 160)",
              transition: "all .2s ease",
            }}>
              <span style={{ fontSize: 13, filter: active ? "none" : "grayscale(1) opacity(.4)" }}>{conf.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? ac(conf.hue) : "oklch(.65 .02 160)" }}>
                {conf.label}
              </span>
              {n > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, color: ac(conf.hue), background: al(conf.hue), borderRadius: 9999, padding: "0 5px" }}>
                  {n}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {covered < ALL_AREAS.length && (
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "oklch(.55 .04 160)", fontStyle: "italic" }}>
          {ALL_AREAS.length - covered} área{ALL_AREAS.length - covered > 1 ? "s" : ""} sem nenhuma tarefa esta semana.
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlanejamentoPage() {
  const router = useRouter();
  const [goals, setGoals]   = useState<GoalFull[]>([]);
  const [plan, setPlan]     = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks]   = useState<WeeklyTask[]>([]);

  const [showFocus, setShowFocus]     = useState(false);
  const [showReview, setShowReview]   = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskDay, setAddTaskDay]   = useState<number>(0);
  const [expandedDays, setExpandedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const todayDow = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
  const openAdd = (day?: number) => { setAddTaskDay(day ?? todayDow()); setShowAddTask(true); };

  const load = useCallback(async () => {
    const [goalsRes, planRes] = await Promise.all([
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/weekly-plans").then((r) => r.json()),
    ]);
    if (Array.isArray(goalsRes)) setGoals(goalsRes.filter((g: GoalFull) => g.status === "ativa"));
    if (planRes && typeof planRes === "object") {
      setPlan(planRes as PlanData);
      setTasks((planRes as PlanData).current?.weekly_tasks ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleTask = async (taskId: string, current: string) => {
    const next = current === "concluida" ? "pendente" : "concluida";
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: next as WeeklyTask["status"] } : t));
    await fetch(`/api/weekly-plans/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await fetch(`/api/weekly-plans/tasks/${taskId}`, { method: "DELETE" });
  };

  const toggleDay = (day: number) =>
    setExpandedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const currentPlan = plan?.current ?? null;
  const review = currentPlan?.weekly_reviews?.[0] ?? null;
  const focuses = [
    currentPlan?.main_focus,
    currentPlan?.main_focus_2,
    currentPlan?.main_focus_3,
  ].filter(Boolean) as string[];

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "oklch(.98 .004 160)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid oklch(.5 .12 160)", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "oklch(.98 .004 160)", paddingBottom: 110 }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, oklch(.42 .14 200), oklch(.5 .12 160))",
        padding: "52px 20px 28px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "oklch(1 0 0 / .06)" }} />
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "oklch(1 0 0 / .04)" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, color: "oklch(1 0 0 / .7)", fontWeight: 500 }}>Planejamento</p>
            <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-.5px" }}>Semana atual</h1>
            <p style={{ margin: 0, fontSize: 13, color: "oklch(1 0 0 / .75)", fontWeight: 500 }}>
              <Calendar size={13} style={{ display: "inline", marginRight: 4 }} />
              {weekLabel()}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#fff",
              background: "oklch(1 0 0 / .15)", borderRadius: 10, padding: "6px 12px",
            }}>
              {tasks.filter((t) => t.status === "concluida").length}/{tasks.length} feitas
            </span>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Pedras principais */}
        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", overflow: "hidden" }}>
          <div style={{ height: 4, background: "linear-gradient(90deg, oklch(.42 .14 200), oklch(.5 .12 160))" }} />
          <div style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: focuses.length > 0 ? 12 : 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
                🎯 Pedras da semana
              </p>
              <button type="button" onClick={() => setShowFocus(true)} style={{
                border: 0, background: "oklch(.93 .03 160)", borderRadius: 8, padding: "6px 10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 700, color: "oklch(.45 .1 160)", fontFamily: "inherit",
              }}>
                <Pencil size={12} /> {focuses.length > 0 ? "Editar" : "Definir"}
              </button>
            </div>
            {focuses.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {focuses.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: i === 0 ? "oklch(.5 .12 160)" : "oklch(.88 .04 160)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: i === 0 ? "#fff" : "oklch(.5 .08 160)",
                    }}>{i + 1}</div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: i === 0 ? 700 : 600, color: "oklch(.22 .02 160)", lineHeight: 1.4 }}>{f}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "oklch(.6 .03 160)", fontStyle: "italic" }}>
                Nenhuma pedra definida ainda para esta semana.
              </p>
            )}
          </div>
        </div>

        {/* Cobertura das áreas */}
        {tasks.length > 0 && <AreaCoverage tasks={tasks} />}

        {/* Tarefas por dia */}
        <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", overflow: "hidden" }}>
          <div style={{ height: 4, background: "linear-gradient(90deg, oklch(.5 .12 160), oklch(.5 .12 220))" }} />
          <div style={{ padding: "14px 18px 6px" }}>
            <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Tarefas da semana
            </p>

            {DAYS.map((dayName, dayIdx) => {
              const dayTasks = tasks
                .filter((t) => t.day_of_week === dayIdx)
                .sort((a, b) => {
                  if (a.scheduled_time && b.scheduled_time) return a.scheduled_time.localeCompare(b.scheduled_time);
                  if (a.scheduled_time) return -1;
                  if (b.scheduled_time) return 1;
                  return a.position - b.position;
                });
              const doneCount = dayTasks.filter((t) => t.status === "concluida").length;
              const expanded = expandedDays.includes(dayIdx);

              return (
                <div key={dayIdx} style={{ marginBottom: 4 }}>
                  <button type="button"
                    onClick={() => toggleDay(dayIdx)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 0", border: 0, background: "none", cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: dayTasks.length > 0 ? "oklch(.93 .04 160)" : "oklch(.95 .005 160)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                      color: dayTasks.length > 0 ? "oklch(.45 .12 160)" : "oklch(.7 .02 160)",
                    }}>
                      {dayName}
                    </span>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 600, color: "oklch(.3 .04 160)" }}>
                      {dayTasks.length === 0
                        ? "Sem tarefas"
                        : `${doneCount}/${dayTasks.length} concluída${dayTasks.length > 1 ? "s" : ""}`
                      }
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openAdd(dayIdx); }}
                      style={{
                        border: 0, background: "oklch(.93 .03 160)", borderRadius: 8,
                        padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 700, color: "oklch(.45 .1 160)", fontFamily: "inherit",
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                    {expanded ? <ChevronUp size={16} style={{ color: "oklch(.65 .04 160)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "oklch(.65 .04 160)", flexShrink: 0 }} />}
                  </button>

                  {expanded && dayTasks.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingBottom: 10, paddingLeft: 4 }}>
                      {dayTasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          onToggle={() => toggleTask(t.id, t.status)}
                          onDelete={() => deleteTask(t.id)}
                        />
                      ))}
                    </div>
                  )}

                  {dayIdx < 6 && <div style={{ height: 1, background: "oklch(.92 .01 160)" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revisão */}
        {!review ? (
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", overflow: "hidden" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg, oklch(.5 .14 50), oklch(.5 .12 85))" }} />
            <div style={{ padding: "16px 18px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
                Revisão semanal
              </p>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "oklch(.5 .04 160)", lineHeight: 1.5 }}>
                Reserve 10 minutos para fechar a semana. Celebre o que avançou, aprenda com o que travou.
              </p>
              <button type="button" onClick={() => setShowReview(true)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12,
                border: 0, cursor: "pointer", background: "oklch(.93 .04 160)",
                color: "oklch(.4 .12 160)", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              }}>
                <Star size={16} /> Fazer revisão
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
                Revisão da semana
              </p>
              <div style={{ display: "flex", gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ fontSize: 14, filter: i < review.week_score ? "none" : "grayscale(1) opacity(.3)" }}>⭐</span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "oklch(.96 .04 160)" }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "oklch(.45 .1 160)", textTransform: "uppercase" }}>Maior vitória</p>
                <p style={{ margin: 0, fontSize: 13, color: "oklch(.3 .06 160)" }}>{review.biggest_win}</p>
              </div>
              {review.main_learning && (
                <div style={{ padding: "10px 12px", borderRadius: 12, background: "oklch(.96 .04 220)" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "oklch(.45 .1 220)", textTransform: "uppercase" }}>Aprendizado</p>
                  <p style={{ margin: 0, fontSize: 13, color: "oklch(.3 .06 220)" }}>{review.main_learning}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Histórico */}
        {(plan?.history ?? []).length > 0 && (
          <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 16px oklch(.2 .04 160 / .08)", padding: "16px 18px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "oklch(.55 .04 160)" }}>
              Semanas anteriores
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(plan?.history ?? []).map((h) => {
                const d = new Date(h.week_start + "T12:00:00");
                const label = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
                const rev = (h as { weekly_reviews?: WeeklyReview[] }).weekly_reviews?.[0];
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "oklch(.97 .005 160)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "oklch(.4 .06 160)" }}>Semana de {label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "oklch(.55 .04 160)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.main_focus || "Sem foco registrado"}
                      </p>
                    </div>
                    {rev && (
                      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ fontSize: 12, filter: i < rev.week_score ? "none" : "grayscale(1) opacity(.25)" }}>⭐</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Maya CTA */}
        <button type="button" onClick={() => router.push("/insights")} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "16px 18px",
          borderRadius: 18, border: 0, cursor: "pointer", textAlign: "left",
          background: "linear-gradient(135deg, oklch(.42 .14 200), oklch(.5 .12 160))",
          boxShadow: "0 4px 16px oklch(.42 .14 200 / .3)",
        }}>
          <Sparkles size={22} color="#fff" />
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#fff" }}>Falar com Maya</p>
            <p style={{ margin: 0, fontSize: 12, color: "oklch(1 0 0 / .75)" }}>
              Maya tem acesso ao seu plano e suas metas
            </p>
          </div>
        </button>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => openAdd()}
        style={{
          position: "fixed", bottom: 88, right: 20, zIndex: 40,
          width: 52, height: 52, borderRadius: "50%", border: 0, cursor: "pointer",
          background: "oklch(.5 .12 160)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px oklch(.5 .12 160 / .4)",
        }}
      >
        <Plus size={22} color="#fff" />
      </button>

      {showFocus && (
        <FocusModal
          goals={goals}
          initial={{
            f1: currentPlan?.main_focus ?? "",
            f2: currentPlan?.main_focus_2 ?? "",
            f3: currentPlan?.main_focus_3 ?? "",
            focusGoalIds: (currentPlan?.weekly_focus_goals ?? []).map((f) => f.goal_id),
          }}
          onClose={() => setShowFocus(false)}
          onSaved={load}
        />
      )}

      {showAddTask && (
        <AddTaskSheet
          goals={goals}
          initialDay={addTaskDay}
          onClose={() => setShowAddTask(false)}
          onSaved={(task) => setTasks((prev) => [...prev, task])}
        />
      )}

      {showReview && <ReviewModal onClose={() => setShowReview(false)} onSaved={load} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
