"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar, Sun, List,
  CheckCircle2, GripVertical, Plus, Clock, Star, Zap, Leaf, AlertCircle, Target,
} from "lucide-react";
import { getLocalDate } from "@/lib/utils";
import type { AgendaItem, EisenhowerPriority } from "@/types";
import { MetasPanel } from "@/components/MetasPanel";
import { PlanejamentoPanel } from "@/components/PlanejamentoPanel";
import { GoalDetailSheet } from "@/components/GoalDetailSheet";

// ── Helpers ──────────────────────────────────────────────────────

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${d.toLocaleDateString("pt-BR", { month: "long" })}`;
}

function weekRangeLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return `${mon.getDate()} de ${mon.toLocaleDateString("pt-BR", { month: "long" })} – ${sun.getDate()} de ${sun.toLocaleDateString("pt-BR", { month: "long" })}`;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRIORITY_CONFIG: Record<EisenhowerPriority, { icon: typeof AlertCircle; color: string; label: string; shortLabel: string }> = {
  importante_urgente:          { icon: AlertCircle, color: "#FF4D4D", label: "Urgente e importante", shortLabel: "Crítico" },
  importante_nao_urgente:      { icon: Star, color: "#FF9F43", label: "Importante, não urgente", shortLabel: "Importante" },
  nao_importante_urgente:      { icon: Zap,  color: "#FFD43B", label: "Urgente, não importante", shortLabel: "Delegar" },
  nao_importante_nao_urgente:  { icon: Leaf, color: "#4CD97B", label: "Nem urgente, nem importante", shortLabel: "Depois" },
};

// ── PriorityBadge ────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: EisenhowerPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color: cfg.color,
      whiteSpace: "nowrap",
    }}>
      <Icon size={10} /> {cfg.shortLabel}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────

type ViewMode = "dia" | "semana" | "lista" | "metas";
type ActiveModule = "agenda" | "metas" | "planejamento";

export default function AgendaPage() {
  const router = useRouter();
  const today = getLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("dia");
  const [activeModule, setActiveModule] = useState<ActiveModule>("agenda");

  // Sync: segmented control ↔ module
  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "semana") setActiveModule("planejamento");
    else if (mode === "metas") setActiveModule("metas");
    else setActiveModule("agenda");
  };
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [newItemType, setNewItemType] = useState<"compromisso" | "tarefa">("tarefa");
  const [allWeekTasks, setAllWeekTasks] = useState<any[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<EisenhowerPriority | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newPriority, setNewPriority] = useState<EisenhowerPriority>("importante_nao_urgente");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        item_type: newItemType,
        date: selectedDate,
        start_time: newItemType === "compromisso" ? newStartTime : null,
        end_time: newItemType === "compromisso" ? newEndTime : null,
        priority: newPriority,
        emoji: newEmoji || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setItems(prev => [...prev, created]);
      setShowNewItem(false);
      setNewTitle(""); setNewEmoji(""); setNewPriority("importante_nao_urgente");
    }
    setSaving(false);
  };

  const fetchItems = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agenda?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(selectedDate); }, [selectedDate, fetchItems]);

  const compromissos = useMemo(() =>
    items.filter(i => i.item_type === "compromisso").sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  [items]);

  const tarefas = useMemo(() =>
    items.filter(i => i.item_type === "tarefa"),
  [items]);

  // Show all items, no filtering
  const filteredCompromissos = compromissos;
  const filteredTarefas = tarefas;

  const pendingTarefas = filteredTarefas.filter(t => t.status !== "concluida");
  const completedTarefas = filteredTarefas.filter(t => t.status === "concluida");

  const toggleTask = async (item: AgendaItem) => {
    const newStatus = item.status === "concluida" ? "pendente" : "concluida";
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    await fetch("/api/agenda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus }),
    });
  };

  // ── Timeline calculations ──────────────────────────────────────
  const TIMELINE_START = 7;  // 07:00
  const TIMELINE_END = 22;   // 22:00
  const TOTAL_MINUTES = (TIMELINE_END - TIMELINE_START) * 60;

  const getTopPct = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const mins = (h - TIMELINE_START) * 60 + m;
    return Math.max(0, (mins / TOTAL_MINUTES) * 100);
  };

  const getHeightPct = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh - sh) * 60 + (em - sm);
    return Math.max(2, (mins / TOTAL_MINUTES) * 100);
  };

  const HOUR_LABELS = Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => {
    const h = TIMELINE_START + i;
    return `${String(h).padStart(2, "0")}:00`;
  });

  return (
    <div style={{ minHeight: "100dvh", background: "#0B0B10", paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Title + Date navigation ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e0d6ff", letterSpacing: "-0.02em" }}>
              {activeModule === "metas" ? "Metas" : activeModule === "planejamento" ? "Agenda da semana" : viewMode === "lista" ? "Lista" : "Agenda do dia"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#A78BFA", fontWeight: 500 }}>
              {activeModule === "metas" ? "" : activeModule === "planejamento" || viewMode === "semana" ? weekRangeLabel(selectedDate) : formatDateLabel(selectedDate)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button"
              onClick={() => {
                const days = activeModule === "planejamento" ? -7 : -1;
                const newDate = shiftDate(selectedDate, days);
                setSelectedDate(newDate);
              }}
              style={navBtnStyle}><ChevronLeft size={18} /></button>
            <button type="button"
              onClick={() => {
                const days = activeModule === "planejamento" ? 7 : 1;
                const newDate = shiftDate(selectedDate, days);
                setSelectedDate(newDate);
              }}
              style={navBtnStyle}><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* ── Segmented control Dia/Semana/Lista/Metas ──────────── */}
        <div style={{
          display: "flex", borderRadius: 14, background: "#1a1530",
          border: "1px solid rgba(167,139,250,0.15)", padding: 3,
          marginBottom: 16,
        }}>
          {([
            { key: "dia", icon: Sun, label: "Dia" },
            { key: "semana", icon: Calendar, label: "Semana" },
            { key: "lista", icon: List, label: "Lista" },
            { key: "metas", icon: Target, label: "Metas" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => switchView(key)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: 0,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5, fontFamily: "inherit",
                fontSize: 12, fontWeight: 600,
                background: viewMode === key
                  ? "linear-gradient(135deg, #7C5CFF, #A78BFA)"
                  : "transparent",
                color: viewMode === key ? "#fff" : "#9e96b5",
                transition: "all 0.2s ease",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* ── Priority Legend (filtro clicável, só view Dia) ──── */}
        {viewMode === "dia" && activeModule === "agenda" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "nowrap" }}>
          {(Object.entries(PRIORITY_CONFIG) as [EisenhowerPriority, typeof PRIORITY_CONFIG[EisenhowerPriority]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = priorityFilter === key;
            return (
              <button key={key} type="button" onClick={() => setPriorityFilter(active ? null : key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                  padding: "4px 8px", borderRadius: 9999, border: active ? `1.5px solid ${cfg.color}` : "1px solid rgba(167,139,250,0.1)",
                  background: active ? cfg.color + "18" : "transparent",
                  color: active ? cfg.color : "#9e96b5", cursor: "pointer", fontFamily: "inherit",
                  transition: "all .15s ease", whiteSpace: "nowrap",
                }}>
                <span style={{
                  width: 12, height: 12, borderRadius: "50%", background: cfg.color + "33",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={7} color={cfg.color} />
                </span>
                {cfg.shortLabel}
              </button>
            );
          })}
          {priorityFilter && (
            <button type="button" onClick={() => setPriorityFilter(null)}
              style={{ padding: "4px 6px", borderRadius: 9999, border: 0, background: "rgba(167,139,250,0.08)", color: "#9e96b5", fontSize: 11, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              ✕
            </button>
          )}
        </div>
        )}

        {/* ── METAS VIEW ─────────────────────────────────────── */}
        {activeModule === "metas" && <MetasPanel />}

        {/* ── PLANEJAMENTO VIEW ───────────────────────────────── */}
        {activeModule === "planejamento" && <PlanejamentoPanel selectedDate={selectedDate} />}

        {/* ── TIMELINE (só agenda, view dia) ──────────────────── */}
        {activeModule === "agenda" && viewMode === "dia" && filteredCompromissos.length > 0 && (
          <div style={{
            background: "#1a1530", borderRadius: 18,
            border: "1px solid rgba(167,139,250,0.12)",
            padding: "12px 0", marginBottom: 20, position: "relative",
          }}>
            <div style={{ display: "flex", minHeight: 400, position: "relative" }}>
              {/* Hour labels */}
              <div style={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column", paddingTop: 4 }}>
                {HOUR_LABELS.map((label) => (
                  <div key={label} style={{
                    flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                    paddingRight: 8,
                  }}>
                    <span style={{ fontSize: 10, color: "#9e96b5", lineHeight: 1 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Timeline track */}
              <div style={{ flex: 1, position: "relative", minHeight: 400 }}>
                {/* Vertical line */}
                <div style={{
                  position: "absolute", left: 0, top: 6, bottom: 6, width: 2,
                  background: "linear-gradient(to bottom, #A78BFA 0%, #7C5CFF 50%, #A78BFA 100%)",
                  borderRadius: 1,
                }} />

                {/* Event cards */}
                {filteredCompromissos.map((item) => {
                  const top = getTopPct(item.start_time || "07:00");
                  const height = item.end_time
                    ? getHeightPct(item.start_time || "07:00", item.end_time)
                    : 8;
                  const priorityCfg = PRIORITY_CONFIG[item.priority as EisenhowerPriority] || PRIORITY_CONFIG.importante_nao_urgente;
                  const PriorityIcon = priorityCfg.icon;

                  return (
                    <div key={item.id}
                      style={{
                        position: "absolute", left: 12, right: 8,
                        top: `${top}%`, height: `${height}%`, minHeight: 50,
                        background: "rgba(124,92,255,0.12)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        borderRadius: 12, padding: "10px 12px",
                        display: "flex", flexDirection: "column",
                        justifyContent: "center",
                      }}>
                      <span style={{ fontSize: 9, color: "#A78BFA", marginBottom: 2 }}>
                        {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff", flex: 1 }}>
                          {item.emoji && <span style={{ marginRight: 4 }}>{item.emoji}</span>}
                          {item.title}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: priorityCfg.color, whiteSpace: "nowrap" }}>
                          <PriorityIcon size={9} /> {priorityCfg.shortLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty timeline state (só agenda, view dia) */}
        {activeModule === "agenda" && viewMode === "dia" && filteredCompromissos.length === 0 && (
          <div style={{
            textAlign: "center", padding: "32px 16px", marginBottom: 20,
            background: "#1a1530", borderRadius: 18,
            border: "1px dashed rgba(167,139,250,0.15)",
          }}>
            <p style={{ color: "#9e96b5", fontSize: 13 }}>Nenhum compromisso hoje</p>
            <p style={{ color: "#9e96b5", fontSize: 11, marginTop: 4 }}>Toque no + para adicionar</p>
          </div>
        )}

        {/* ── TAREFAS DO DIA (só agenda, view dia) ────────────── */}
        {activeModule === "agenda" && viewMode === "dia" && (
        <div style={{
          background: "#151520", borderRadius: 18,
          border: "1px solid rgba(167,139,250,0.1)",
          padding: "16px 18px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e0d6ff" }}>Tarefas do dia</h2>
              {pendingTarefas.length > 0 && (
                <span style={{
                  padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 600,
                  background: "rgba(167,139,250,0.15)", color: "#A78BFA",
                }}>
                  {pendingTarefas.length} restante{pendingTarefas.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Pending tasks */}
          {pendingTarefas.length === 0 && completedTarefas.length === 0 ? (
            <p style={{ color: "#9e96b5", fontSize: 12, textAlign: "center", padding: 16 }}>Nenhuma tarefa para hoje</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...pendingTarefas, ...completedTarefas].map((item) => {
                const done = item.status === "concluida";
                const priorityCfg = PRIORITY_CONFIG[item.priority as EisenhowerPriority] || PRIORITY_CONFIG.importante_nao_urgente;
                const PriorityIcon = priorityCfg.icon;
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 12,
                    background: done ? "transparent" : "rgba(124,92,255,0.04)",
                    border: done ? "1px solid transparent" : "1px solid rgba(167,139,250,0.08)",
                  }}>
                    <button type="button" onClick={() => toggleTask(item)}
                      style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        border: done ? "none" : "1.5px solid rgba(167,139,250,0.3)",
                        background: done ? "#7C5CFF" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      {done && <CheckCircle2 size={14} color="#fff" />}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: done ? 400 : 500,
                      color: done ? "#5a5470" : "#e0d6ff",
                      textDecoration: done ? "line-through" : "none",
                    }}>
                      {item.emoji && <span style={{ marginRight: 4 }}>{item.emoji}</span>}
                      {item.title}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: priorityCfg.color }}>
                      <PriorityIcon size={9} /> {priorityCfg.shortLabel}
                    </span>
                    <GripVertical size={14} color="#5a5470" style={{ cursor: "grab", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

      </div>

      {/* ── LISTA ───────────────────────────────────────────── */}
      {viewMode === "lista" && (
        <ListView allWeekTasks={allWeekTasks} compromissos={items} selectedDate={selectedDate} loadWeekTasks={async () => {
          try {
            const res = await fetch("/api/weekly-plans");
            if (res.ok) {
              const data = await res.json();
              setAllWeekTasks(data.current?.weekly_tasks || []);
            }
          } catch {}
        }} />
      )}

      {/* ── FAB (só na view Dia) ─────────────────────────────── */}
      {activeModule === "agenda" && viewMode === "dia" && (
        <button type="button" onClick={() => { setNewItemType("tarefa"); setShowNewItem(true); }}
          style={{
            position: "fixed", bottom: 84, right: 20, zIndex: 40,
            width: 56, height: 56, borderRadius: "50%",
            background: "#7C5CFF", border: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(124,92,255,0.4)",
          }}>
          <Plus size={24} color="#fff" />
        </button>
      )}

      {/* ── New Item Modal ──────────────────────────────────── */}
      {showNewItem && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            width: "100%", maxWidth: 420, maxHeight: "80dvh", overflowY: "auto",
            background: "#151520", borderRadius: 24,
            padding: 24,
            border: "1px solid rgba(167,139,250,0.15)",
          }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#e0d6ff" }}>
              {newItemType === "compromisso" ? "Novo compromisso" : "Nova tarefa"}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9e96b5" }}>
              {formatDateLabel(selectedDate)}
            </p>

            {/* Type toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button type="button" onClick={() => setNewItemType("compromisso")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: 0, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: newItemType === "compromisso" ? "#7C5CFF" : "#1a1530",
                  color: newItemType === "compromisso" ? "#fff" : "#9e96b5",
                }}>📅 Compromisso</button>
              <button type="button" onClick={() => setNewItemType("tarefa")}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: 0, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: newItemType === "tarefa" ? "#7C5CFF" : "#1a1530",
                  color: newItemType === "tarefa" ? "#fff" : "#9e96b5",
                }}>☑️ Tarefa</button>
            </div>

            {/* Title */}
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título"
              style={modalInput} autoFocus />

            {/* Emoji */}
            <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)}
              placeholder="Emoji (opcional) — ex: 💪"
              style={{ ...modalInput, marginTop: 10 }} />

            {/* Time (only for compromisso) */}
            {newItemType === "compromisso" && (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4, display: "block" }}>Início</label>
                  <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}
                    style={modalInput} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4, display: "block" }}>Fim</label>
                  <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)}
                    style={modalInput} />
                </div>
              </div>
            )}

            {/* Priority */}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Prioridade</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(Object.entries(PRIORITY_CONFIG) as [EisenhowerPriority, typeof PRIORITY_CONFIG[EisenhowerPriority]][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button key={key} type="button" onClick={() => setNewPriority(key)}
                      style={{
                        padding: "6px 10px", borderRadius: 9999, border: 0, cursor: "pointer",
                        fontFamily: "inherit", fontSize: 10, fontWeight: 600,
                        background: newPriority === key ? cfg.color + "22" : "#1a1530",
                        color: newPriority === key ? cfg.color : "#9e96b5",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                      <Icon size={10} /> {cfg.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setShowNewItem(false)}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 14,
                  border: "1px solid rgba(167,139,250,0.2)", background: "transparent",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "#9e96b5",
                }}>Cancelar</button>
              <button type="button" onClick={handleCreate} disabled={saving || !newTitle.trim()}
                style={{
                  flex: 2, padding: "14px 0", borderRadius: 14, border: 0,
                  cursor: (saving || !newTitle.trim()) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                  background: (saving || !newTitle.trim()) ? "#1e1840" : "#7C5CFF",
                  color: (saving || !newTitle.trim()) ? "#9e96b5" : "#fff",
                }}>{saving ? "Salvando…" : "Adicionar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
  background: "#0B0B10", color: "#e0d6ff", fontSize: 14,
  fontFamily: "inherit", outline: "none",
};

const navBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  border: "1px solid rgba(167,139,250,0.15)",
  background: "#1a1530", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#e0d6ff",
};

function ListView({ allWeekTasks, loadWeekTasks, compromissos, selectedDate }: { allWeekTasks: any[]; loadWeekTasks: () => void; compromissos: AgendaItem[]; selectedDate: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDone, setEditDone] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  const refreshGoals = () => {
    fetch("/api/goals").then(r => r.json()).then(d => { if (Array.isArray(d)) setGoals(d.filter((g: any) => g.status === "ativa")); }).catch(() => {});
  };

  useEffect(() => {
    if (allWeekTasks.length === 0) loadWeekTasks();
    refreshGoals();
  }, []); // eslint-disable-line

  const todayComp = compromissos.filter(c => c.item_type === "compromisso");
  const todayAgendaTarefas = compromissos.filter(c => c.item_type === "tarefa");

  const activeGoals = goals.slice(0, 5);
  const selD = new Date(selectedDate + "T12:00:00");
  const selDow = selD.getDay() === 0 ? 6 : selD.getDay() - 1;
  const dayPlanTasks = allWeekTasks.filter((t: any) => t.day_of_week === selDow);

  const openEditor = (item: any) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditDone(item.status === "concluida");
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingItem) return;
    if (editingItem.item_type) {
      await fetch("/api/agenda", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingItem.id, title: editTitle.trim(), status: editDone ? "concluida" : "pendente" }) });
    } else {
      await fetch(`/api/weekly-plans/tasks/${editingItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle.trim(), status: editDone ? "concluida" : "pendente" }) });
    }
    setEditingItem(null); loadWeekTasks();
    // Refresh compromissos too
    window.location.reload();
  };

  const deleteItem = async () => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    if (editingItem.item_type) {
      await fetch(`/api/agenda?id=${editingItem.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/weekly-plans/tasks/${editingItem.id}`, { method: "DELETE" });
    }
    setEditingItem(null); loadWeekTasks();
    window.location.reload();
  };

  return (
    <div style={{ marginBottom: 20, padding: "0 16px" }}>
      {/* Compromissos do dia */}
      {todayComp.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".06em" }}>Compromissos do dia</h3>
          {todayComp.map(c => (
            <button key={c.id} type="button" onClick={() => openEditor(c)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid rgba(167,139,250,0.05)", background: "none", borderLeft: 0, borderRight: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12 }}>{c.emoji || "📅"}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#e0d6ff" }}>{c.title}</span>
              {c.start_time && <span style={{ fontSize: 9, color: "#9e96b5", fontFamily: "monospace" }}>{c.start_time.slice(0,5)}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Tarefas da agenda */}
      {todayAgendaTarefas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".06em" }}>Tarefas do dia</h3>
          {todayAgendaTarefas.map(t => (
            <button key={t.id} type="button" onClick={() => openEditor(t)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid rgba(167,139,250,0.05)", background: "none", borderLeft: 0, borderRight: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12 }}>{t.emoji || "☑️"}</span>
              <span style={{ flex: 1, fontSize: 12, color: t.status === "concluida" ? "#5a5470" : "#e0d6ff", textDecoration: t.status === "concluida" ? "line-through" : "none" }}>{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tarefas do planejamento */}
      {dayPlanTasks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".06em" }}>Plano do dia</h3>
          {dayPlanTasks.map((t: any) => {
            const area = AREA_CONFIG_PT[t.area] || { emoji: "⚪" };
            const done = t.status === "concluida";
            return (
              <button key={t.id} type="button" onClick={() => openEditor(t)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid rgba(167,139,250,0.05)", background: "none", borderLeft: 0, borderRight: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 12 }}>{area.emoji}</span>
                <span style={{ flex: 1, fontSize: 12, color: done ? "#5a5470" : "#e0d6ff", textDecoration: done ? "line-through" : "none" }}>{t.title}</span>
                {t.scheduled_time && <span style={{ fontSize: 9, color: "#9e96b5", fontFamily: "monospace" }}>{t.scheduled_time.slice(0,5)}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Metas ativas */}
      {activeGoals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: ".06em" }}>Metas ativas</h3>
          {activeGoals.map((g: any) => (
            <button key={g.id} type="button" onClick={() => setDetailGoalId(g.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: "1px solid rgba(167,139,250,0.05)", background: "none", borderLeft: 0, borderRight: 0, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12 }}>{(AREA_CONFIG_PT as any)[g.area]?.emoji || "🎯"}</span>
              <span style={{ flex: 1, fontSize: 12, color: "#9e96b5" }}>{g.title}</span>
              <span style={{ fontSize: 9, color: "#A78BFA" }}>{(g.goal_stages?.filter((s: any) => s.status === "concluida").length || 0)}/{g.goal_stages?.length || 0}</span>
            </button>
          ))}
        </div>
      )}

      {todayComp.length === 0 && todayAgendaTarefas.length === 0 && dayPlanTasks.length === 0 && activeGoals.length === 0 && (
        <p style={{ color: "#9e96b5", fontSize: 13, textAlign: "center", padding: 32 }}>Nenhuma atividade neste dia</p>
      )}

      {/* Edit modal */}
      {detailGoalId && <GoalDetailSheet goalId={detailGoalId} onClose={() => setDetailGoalId(null)} onUpdated={refreshGoals} />}

      {editingItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#e0d6ff" }}>Editar</h3>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Título" autoFocus
              style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)", background: "#0B0B10", color: "#e0d6ff", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
            {/* Toggle concluído */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={editDone} onChange={e => setEditDone(e.target.checked)}
                style={{ accentColor: "#7C5CFF", width: 20, height: 20 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e0d6ff" }}>Concluído</span>
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setEditingItem(null)}
                style={{ flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#9e96b5", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button type="button" onClick={saveEdit}
                style={{ flex: 2, padding: 14, borderRadius: 14, border: 0, background: "#7C5CFF", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salvar</button>
            </div>
            {/* Delete */}
            <button type="button" onClick={deleteItem}
              style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 14, border: 0, background: "rgba(255,92,92,0.1)", color: "#FF5C5C", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              🗑 Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const AREA_CONFIG_PT: Record<string, { emoji: string }> = {
  saude: { emoji: "💚" }, carreira: { emoji: "💼" }, financas: { emoji: "💰" },
  relacionamentos: { emoji: "❤️" }, desenvolvimento: { emoji: "🧠" }, familia: { emoji: "🏡" },
  lazer: { emoji: "🌊" }, espiritualidade: { emoji: "✨" }, outros: { emoji: "⚪" },
};

const DAY_FULL_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const hubBtnStyle: React.CSSProperties = {
  flex: 1, padding: "12px 0", borderRadius: 14, border: 0, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
  background: "#1a1530", color: "#9e96b5",
  border: "1px solid rgba(167,139,250,0.15)",
};
