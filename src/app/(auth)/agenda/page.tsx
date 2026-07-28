"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  const [tasksOpen, setTasksOpen] = useState(false); // closed by default now
  const [editingPlanTask, setEditingPlanTask] = useState<any>(null);
  const [planEditTitle, setPlanEditTitle] = useState("");
  const [planEditDay, setPlanEditDay] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDone, setEditDone] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [editPriority, setEditPriority] = useState<EisenhowerPriority>("importante_nao_urgente");
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newPriority, setNewPriority] = useState<EisenhowerPriority>("importante_nao_urgente");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#7C5CFF");
  const [newRepeat, setNewRepeat] = useState("none");
  const [newNotify, setNewNotify] = useState<number | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // non-null = editing existing item
  const [editingIsRepeat, setEditingIsRepeat] = useState(false); // true if editing a repeated occurrence

  const handleSave = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);

    const body: Record<string, unknown> = {
      title: newTitle.trim(),
      item_type: newItemType,
      date: selectedDate,
      start_time: newItemType === "compromisso" ? newStartTime : null,
      end_time: newItemType === "compromisso" ? newEndTime : null,
      priority: newPriority,
      emoji: newEmoji || null,
      description: newDescription || null,
      color: newColor,
      repeat_type: newRepeat,
      notify_minutes: newNotify,
      due_date: newDueDate || null,
    };

    if (editingId && editingIsRepeat) {
      // Editing a repeated occurrence — ask: this one or all?
      const applyAll = confirm("Aplicar alterações a TODOS os compromissos desta repetição?\n\nOK = Todos\nCancelar = Apenas este");
      if (applyAll) {
        body.id = editingId;
      } else {
        // Create a standalone copy for this date
        delete body.id;
      }
    } else if (editingId) {
      body.id = editingId;
    }

    const method = body.id ? "PATCH" : "POST";
    const res = await fetch("/api/agenda", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const saved = await res.json();
      if (editingId) {
        setItems(prev => prev.map(i => i.id === editingId ? saved : i));
      } else {
        setItems(prev => [...prev, saved]);
      }
      closeNewItemModal();
    }
    setSaving(false);
  };

  const closeNewItemModal = () => {
    setShowNewItem(false);
    setEditingId(null);
    setEditingIsRepeat(false);
    setNewTitle(""); setNewEmoji(""); setNewPriority("importante_nao_urgente");
    setNewStartTime("09:00"); setNewEndTime("10:00");
    setNewDescription(""); setNewColor("#7C5CFF");
    setNewRepeat("none"); setNewNotify(null); setNewDueDate("");
  };

  const openEditor = (item: AgendaItem) => {
    setNewItemType(item.item_type as "compromisso" | "tarefa");
    setNewTitle(item.title);
    setNewEmoji(item.emoji || "");
    setNewPriority(item.priority as EisenhowerPriority);
    setNewStartTime(item.start_time?.slice(0, 5) || "09:00");
    setNewEndTime(item.end_time?.slice(0, 5) || "10:00");
    setNewDescription(item.description || "");
    setNewColor(item.color || "#7C5CFF");
    setNewRepeat(item.repeat_type || "none");
    setNewNotify(item.notify_minutes ?? null);
    setNewDueDate(item.due_date || "");
    setEditingId(realId(item));
    setEditingIsRepeat(item.id.includes("_r_") || item.id.includes("_cross"));
    setEditingItem(null);
    setShowNewItem(true);
  };

  const fetchItems = useCallback(async (date: string) => {
    setLoading(true);
    try {
      // Fetch a window around the selected date to catch repeats and midnight-crossings
      const from = shiftDate(date, -30);
      const to = shiftDate(date, 30);
      const res = await fetch(`/api/agenda?from=${from}&to=${to}`);
      if (!res.ok) { setItems([]); setLoading(false); return; }
      const all: AgendaItem[] = await res.json();
      if (!Array.isArray(all)) { setItems([]); setLoading(false); return; }

      // ── Build result: items that belong to `date` ──
      const result: AgendaItem[] = [];

      // Helper: does a repeat rule match `date` given an original date?
      const repeatMatches = (item: AgendaItem, target: string): boolean => {
        if (!item.repeat_type || item.repeat_type === "none") return false;
        const orig = new Date(item.date + "T12:00:00");
        const tgt = new Date(target + "T12:00:00");
        if (tgt <= orig) return false; // don't repeat before original
        switch (item.repeat_type) {
          case "daily": return true;
          case "weekly": return orig.getDay() === tgt.getDay();
          case "monthly": return orig.getDate() === tgt.getDate();
          case "weekdays": return tgt.getDay() >= 1 && tgt.getDay() <= 5;
          case "yearly":
            return orig.getDate() === tgt.getDate() && orig.getMonth() === tgt.getMonth();
          default: return false;
        }
      };

      // Track which (date, title) combos already exist as real items
      const realEntries = new Set<string>();
      for (const item of all) {
        // Exact date match
        if (item.date === date) {
          result.push(item);
          realEntries.add(item.date + "|" + item.title.toLowerCase().trim());
          continue;
        }
      }

      for (const item of all) {
        // Skip if already processed as exact match
        if (item.date === date) continue;
        // Repeating item
        if (repeatMatches(item, date)) {
          const key = date + "|" + item.title.toLowerCase().trim();
          // Skip if a standalone item already exists for this date+title
          if (realEntries.has(key)) continue;
          result.push({ ...item, date, id: item.id + "_r_" + date, _origId: item.id } as AgendaItem & { _origId?: string });
        }
      }

      // ── Midnight-crossing: items from YESTERDAY that cross into today ──
      const yesterday = shiftDate(date, -1);
      const yesterdayItems = all.filter(i => i.date === yesterday && i.item_type === "compromisso" && i.start_time && i.end_time);
      for (const item of yesterdayItems) {
        const [sh, sm] = (item.start_time || "00:00").split(":").map(Number);
        const [eh, em] = (item.end_time || "00:00").split(":").map(Number);
        if (eh * 60 + em <= sh * 60 + sm) {
          // Crosses midnight — show continuation on today
          result.push({
            ...item,
            date,
            id: item.id + "_cross",
            start_time: "00:00",
            // Keep end_time as the original (it ends today)
          });
        }
      }

      // Sort: compromissos by start_time, then tarefas
      result.sort((a, b) => {
        if (a.item_type !== b.item_type) return a.item_type === "compromisso" ? -1 : 1;
        return (a.start_time || "").localeCompare(b.start_time || "");
      });

      setItems(result);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(selectedDate); }, [selectedDate, fetchItems]);

  // Fetch weekly plan tasks for the current week
  useEffect(() => {
    fetch("/api/weekly-plans").then(r => r.json()).then(data => {
      if (data?.current?.weekly_tasks) setAllWeekTasks(data.current.weekly_tasks);
    }).catch(() => {});
  }, [selectedDate]);

  // Weekly plan tasks filtered for the selected day
  const selectedDayOfWeek = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon ... 6=Sun
  }, [selectedDate]);

  const dayPlanTasks = useMemo(() =>
    allWeekTasks.filter((t: any) => t.day_of_week === selectedDayOfWeek),
  [allWeekTasks, selectedDayOfWeek]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (showNewItem || editingItem || editingPlanTask) {
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
  }, [showNewItem, editingItem, editingPlanTask]);

  const compromissos = useMemo(() =>
    items.filter(i => i.item_type === "compromisso").sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")),
  [items]);

  const tarefas = useMemo(() =>
    items.filter(i => i.item_type === "tarefa"),
  [items]);

  const tarefasSemHorario = tarefas.filter(t => !t.start_time);
  const tarefasComHorario = tarefas.filter(t => t.start_time);

  // All timeline items (compromissos + tarefas with time)
  const timelineItems = useMemo(() =>
    [...compromissos, ...tarefasComHorario].sort((a, b) =>
      (a.start_time || "").localeCompare(b.start_time || "")
    ),
  [compromissos, tarefasComHorario]);

  /** Get the real DB id (handles synthetic repeated/crossed items) */
  const realId = (item: AgendaItem) => (item as any)._origId || item.id;

  const toggleTask = async (item: AgendaItem) => {
    const newStatus = item.status === "concluida" ? "pendente" : "concluida";
    // Detect synthetic items: repeated occurrences or midnight-crossing continuations
    const isSynthetic = item.id.includes("_r_") || item.id.includes("_cross");

    if (isSynthetic) {
      // Create a standalone record for this specific date (don't touch the original)
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          item_type: item.item_type,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          priority: item.priority,
          emoji: item.emoji || null,
          description: item.description || null,
          color: item.color || null,
          status: newStatus,
        }),
      });
      if (res.ok) {
        // Refetch to get clean data instead of manually patching state
        fetchItems(selectedDate);
      }
    } else {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      await fetch("/api/agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: realId(item), status: newStatus }),
      });
    }
  };

  // ── Timeline calculations ──────────────────────────────────────
  const TIMELINE_START = 0;  // 00:00
  const TIMELINE_END = 24;   // 00:00 (midnight)
  const TOTAL_MINUTES = (TIMELINE_END - TIMELINE_START) * 60;
  const SLOT_MINUTES = 30; // 30-min slots
  const TOTAL_SLOTS = TOTAL_MINUTES / SLOT_MINUTES; // 48 slots
  const SLOT_PX = 24; // pixel height per 30-min slot
  const TRACK_HEIGHT = TOTAL_SLOTS * SLOT_PX; // 1152px

  // ── Smart scroll: snap to 2h before current time ────────────
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    // Scroll to 2 hours before current time, but never before 06:00
    const targetMins = Math.max(6 * 60, currentMins - 120);
    const px = (targetMins / SLOT_MINUTES) * SLOT_PX;
    timelineScrollRef.current.scrollTop = Math.max(0, px - 60);
  }, []);

  /** Convert HH:MM to pixel offset from top of track */
  const timeToPx = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) / SLOT_MINUTES) * SLOT_PX;
  };

  /** Calculate event height in px. Handles midnight-crossing (clamped to end of day). */
  const eventHeightPx = (start: string, end: string): number => {
    const startPx = timeToPx(start);
    let endPx = timeToPx(end);
    // Crosses midnight? Clamp to end of day
    if (endPx <= startPx) endPx = TRACK_HEIGHT;
    const h = endPx - startPx;
    return Math.max(SLOT_PX, h); // minimum 1 slot
  };

  const HALF_HOUR_LABELS = Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => {
    const totalMins = (TIMELINE_START * 60) + i * SLOT_MINUTES;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });

  return (
    <div style={{ height: "100dvh", background: "#0B0B10", paddingBottom: 100, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px", width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

        {/* ── Title + Date navigation ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e0d6ff", letterSpacing: "-0.02em" }}>
              {viewMode === "metas" ? "Metas" : viewMode === "semana" ? "Agenda da semana" : viewMode === "lista" ? "Lista" : "Agenda do dia"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#A78BFA", fontWeight: 500 }}>
              {viewMode === "metas" ? "Acompanhe seu progresso" : viewMode === "semana" ? weekRangeLabel(selectedDate) : formatDateLabel(selectedDate)}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {selectedDate !== today && (
              <button type="button" onClick={() => setSelectedDate(today)}
                style={{ ...navBtnStyle, width: "auto", padding: "0 14px", fontSize: 12, fontWeight: 600 }}>
                Hoje
              </button>
            )}
            <button type="button"
              onClick={() => {
                const days = activeModule === "planejamento" ? -7 : -1;
                setSelectedDate(shiftDate(selectedDate, days));
              }}
              style={navBtnStyle}><ChevronLeft size={18} /></button>
            <button type="button"
              onClick={() => {
                const days = activeModule === "planejamento" ? 7 : 1;
                setSelectedDate(shiftDate(selectedDate, days));
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
            { key: "metas", icon: Target, label: "Metas" },
            { key: "lista", icon: List, label: "Lista" },
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

        {/* ── METAS VIEW ─────────────────────────────────────── */}
        {activeModule === "metas" && <MetasPanel />}

        {/* ── PLANEJAMENTO VIEW ───────────────────────────────── */}
        {activeModule === "planejamento" && <PlanejamentoPanel selectedDate={selectedDate} />}

        {/* ── TIMELINE (só agenda, view dia) ──────────────────── */}
        {activeModule === "agenda" && viewMode === "dia" && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
            background: "#1a1530", borderRadius: 18,
            border: "1px solid rgba(167,139,250,0.12)",
            position: "relative", overflow: "hidden",
          }}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              const dy = e.changedTouches[0].clientY - touchStartY.current;
              if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
                setSelectedDate(shiftDate(selectedDate, dx > 0 ? -1 : 1));
              }
            }}
          >
            {/* ── Collapsible task strip (overlay, always visible) ── */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
              background: "#1a1530", borderRadius: "18px 18px 0 0",
              borderBottom: tasksOpen ? "1px solid rgba(167,139,250,0.15)" : "none",
              boxShadow: tasksOpen ? "0 8px 24px rgba(0,0,0,0.4)" : "none",
            }}>
                <button type="button" onClick={() => setTasksOpen(!tasksOpen)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "none", border: 0, cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e0d6ff" }}>Tarefas do dia</span>
                    {(() => {
                      const planPending = dayPlanTasks.filter((t: any) => t.status !== "concluida").length;
                      const total = tarefasSemHorario.filter(t => t.status !== "concluida").length + planPending;
                      if (total === 0) return null;
                      return (
                        <span style={{ padding: "1px 7px", borderRadius: 9999, fontSize: 10, fontWeight: 600, background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                          {total} pendente{total !== 1 ? "s" : ""}
                        </span>
                      );
                    })()}
                  </div>
                  <span style={{ fontSize: 12, color: "#9e96b5", transition: "transform .2s", transform: tasksOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    ▴
                  </span>
                </button>
                {tasksOpen && (
                <div style={{ padding: "0 14px 10px", display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                  {/* Agenda tasks without time */}
                  {[...tarefasSemHorario].map((item) => {
                    const done = item.status === "concluida";
                    const priorityCfg = PRIORITY_CONFIG[item.priority as EisenhowerPriority] || PRIORITY_CONFIG.importante_nao_urgente;
                    return (
                      <button key={item.id} type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setEditTitle(item.title || "");
                          setEditEmoji(item.emoji || "");
                          setEditPriority(item.priority as EisenhowerPriority);
                          setEditDone(done);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.2)",
                          background: done ? "transparent" : "rgba(124,92,255,0.06)",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                          color: done ? "#5a5470" : "#e0d6ff",
                          textDecoration: done ? "line-through" : "none",
                          whiteSpace: "nowrap",
                        }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); toggleTask(item); }}>
                          {done ? <CheckCircle2 size={14} color="#7C5CFF" /> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid rgba(167,139,250,0.3)" }} />}
                        </span>
                        {item.emoji && <span>{item.emoji}</span>}
                        {item.title}
                      </button>
                    );
                  })}
                  {/* Weekly plan tasks */}
                  {dayPlanTasks.map((t: any) => {
                    const done = t.status === "concluida";
                    const areaEmoji = (AREA_CONFIG_PT as any)[t.area]?.emoji || "⚪";
                    return (
                      <button key={`plan-${t.id}`} type="button"
                        onClick={() => {
                          setEditingPlanTask(t);
                          setPlanEditTitle(t.title || "");
                          setPlanEditDay(t.day_of_week ?? 0);
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.15)",
                          background: done ? "transparent" : "rgba(167,139,250,0.04)",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                          color: done ? "#5a5470" : "#9e96b5",
                          textDecoration: done ? "line-through" : "none",
                          whiteSpace: "nowrap",
                        }}>
                        <span onClick={async (e) => {
                          e.stopPropagation();
                          const newStatus = done ? "pendente" : "concluida";
                          setAllWeekTasks((prev: any[]) => prev.map((wt: any) => wt.id === t.id ? { ...wt, status: newStatus } : wt));
                          await fetch(`/api/weekly-plans/tasks/${t.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                          });
                        }} style={{ fontSize: 11, cursor: "pointer", display: "flex" }}>
                          {done ? <CheckCircle2 size={13} color="#7C5CFF" /> : <div style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid rgba(167,139,250,0.2)" }} />}
                        </span>
                        {areaEmoji} {t.title}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>

            <div ref={timelineScrollRef} style={{
              display: "flex", flex: 1, minHeight: 0,
              overflowY: "auto", overflowX: "hidden",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}>
              {/* Time labels */}
              <div style={{ width: 52, flexShrink: 0, paddingLeft: 6 }}>
                {HALF_HOUR_LABELS.filter((_, i) => i % 2 === 0).map((label, idx) => {
                  const h = idx;
                  return (
                    <button key={label} type="button"
                      onClick={() => {
                        setNewItemType("compromisso");
                        setNewStartTime(`${String(h).padStart(2, "0")}:00`);
                        setNewEndTime(`${String(h + 1).padStart(2, "0")}:00`);
                        setShowNewItem(true);
                      }}
                      style={{
                        height: SLOT_PX * 2, display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                        paddingRight: 8, background: "none", border: 0, cursor: "pointer",
                        fontFamily: "inherit",
                      }}>
                      <span style={{ fontSize: 11, color: "#9e96b5", lineHeight: 1 }}>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Timeline track */}
              <div style={{ flex: 1, position: "relative", height: TRACK_HEIGHT }}>
                {/* Vertical line */}
                <div style={{
                  position: "absolute", left: 0, top: 6, bottom: 6, width: 2,
                  background: "linear-gradient(to bottom, #A78BFA 0%, #7C5CFF 50%, #A78BFA 100%)",
                  borderRadius: 1,
                }} />

                {/* Clickable half-hour slots */}
                {HALF_HOUR_LABELS.slice(0, -1).map((label, idx) => (
                  <button key={idx} type="button"
                    onClick={() => {
                      const totalMins = idx * SLOT_MINUTES;
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      const endTotal = totalMins + SLOT_MINUTES;
                      const eh = Math.floor(endTotal / 60);
                      const em = endTotal % 60;
                      const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                      setNewItemType("compromisso");
                      setNewStartTime(start);
                      setNewEndTime(end);
                      setShowNewItem(true);
                    }}
                    style={{
                      position: "absolute", left: 12, right: 8,
                      top: idx * SLOT_PX, height: SLOT_PX,
                      background: "transparent", border: 0, cursor: "pointer",
                    }}
                  />
                ))}

                {/* Event cards — compromissos + tarefas com horário */}
                {timelineItems.map((item) => {
                  const isTask = item.item_type === "tarefa";
                  const topPx = timeToPx(item.start_time || "07:00");
                  const heightPx = item.end_time
                    ? eventHeightPx(item.start_time || "07:00", item.end_time)
                    : SLOT_PX;
                  const crossesMidnight = item.end_time
                    ? timeToPx(item.end_time) <= timeToPx(item.start_time || "07:00")
                    : false;
                  const priorityCfg = PRIORITY_CONFIG[item.priority as EisenhowerPriority] || PRIORITY_CONFIG.importante_nao_urgente;
                  const PriorityIcon = priorityCfg.icon;
                  const short = heightPx < SLOT_PX * 1.5;       // < 45min: compact
                  const roomy = heightPx >= SLOT_PX * 2.5;      // ≥ 75min: enough space for priority
                  const done = item.status === "concluida";

                  return (
                    <button key={item.id} type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setEditTitle(item.title || "");
                        setEditStartTime(item.start_time?.slice(0, 5) || "09:00");
                        setEditEndTime(item.end_time?.slice(0, 5) || "10:00");
                        setEditEmoji(item.emoji || "");
                        setEditPriority(item.priority as EisenhowerPriority);
                        setEditDone(done);
                      }}
                      style={{
                        position: "absolute", left: 12, right: 8, zIndex: isTask ? 1 : 2,
                        top: topPx + 1,
                        height: heightPx - 2,
                        background: isTask
                          ? "rgba(167,139,250,0.04)"
                          : item.color ? `${item.color}22` : "rgba(124,92,255,0.15)",
                        borderLeft: isTask
                          ? "2px dashed rgba(167,139,250,0.25)"
                          : item.color ? `2px solid ${item.color}` : "2px solid rgba(167,139,250,0.5)",
                        borderTop: "1px solid rgba(167,139,250,0.08)",
                        borderRight: "1px solid rgba(167,139,250,0.08)",
                        borderBottom: crossesMidnight ? "2px dashed rgba(167,139,250,0.4)" : "1px solid rgba(167,139,250,0.08)",
                        borderRadius: 4, padding: short ? "2px 6px" : "4px 8px",
                        display: "flex", flexDirection: short ? "row" : "column",
                        alignItems: short ? "center" : "stretch",
                        gap: short ? 4 : 1,
                        justifyContent: "flex-start", cursor: "pointer",
                        textAlign: "left", fontFamily: "inherit",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        opacity: done ? 0.5 : 1,
                      }}>
                      {/* Short mode: single-row layout */}
                      {short ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 8, color: isTask ? "#9e96b5" : (item.color || "#A78BFA"), flexShrink: 0, lineHeight: 1 }}>
                            {item.start_time?.slice(0, 5)}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: done ? 400 : 600,
                            color: done ? "#5a5470" : "#e0d6ff",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            textDecoration: done ? "line-through" : "none", flex: 1, minWidth: 0,
                          }}>
                            {item.emoji && <span style={{ marginRight: 2 }}>{item.emoji}</span>}
                            {item.title}
                          </span>
                          <span onClick={(e) => { e.stopPropagation(); toggleTask(item); }}
                            style={{ flexShrink: 0, cursor: "pointer", display: "flex" }}>
                            {done
                              ? <CheckCircle2 size={10} color="#7C5CFF" />
                              : <div style={{ width: 10, height: 10, borderRadius: "50%", border: isTask ? "1.5px solid rgba(167,139,250,0.35)" : "1.5px solid rgba(167,139,250,0.2)" }} />
                            }
                          </span>
                        </div>
                      ) : (
                        /* Tall mode: stacked layout */
                        <>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 9, color: isTask ? "#9e96b5" : (item.color || "#A78BFA"), flexShrink: 0, lineHeight: 1 }}>
                              {item.start_time?.slice(0, 5)}{item.end_time ? ` – ${item.end_time.slice(0, 5)}` : ""}
                              {crossesMidnight && " ↗"}
                            </span>
                            <span onClick={(e) => { e.stopPropagation(); toggleTask(item); }}
                              style={{ flexShrink: 0, cursor: "pointer", display: "flex" }}>
                              {done
                                ? <CheckCircle2 size={12} color="#7C5CFF" />
                                : <div style={{ width: 12, height: 12, borderRadius: "50%", border: isTask ? "1.5px solid rgba(167,139,250,0.35)" : "1.5px solid rgba(167,139,250,0.2)" }} />
                              }
                            </span>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: done ? 400 : 600,
                            color: done ? "#5a5470" : "#e0d6ff",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            textDecoration: done ? "line-through" : "none",
                            lineHeight: 1.3,
                          }}>
                            {item.emoji && <span style={{ marginRight: 3 }}>{item.emoji}</span>}
                            {item.title}
                          </span>
                          {!isTask && roomy && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 8, color: priorityCfg.color, whiteSpace: "nowrap", lineHeight: 1 }}>
                              <PriorityIcon size={8} /> {priorityCfg.shortLabel}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
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

      {/* ── Detail popup for compromisso ────────────────────── */}
      {editingItem && (
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {editingItem.color && (
                  <div style={{ width: 10, height: 40, borderRadius: 5, background: editingItem.color, flexShrink: 0 }} />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e0d6ff" }}>
                    {editingItem.emoji && <span style={{ marginRight: 6 }}>{editingItem.emoji}</span>}
                    {editingItem.title}
                  </h3>
                  {editingItem.start_time && (
                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#A78BFA" }}>
                      {editingItem.start_time.slice(0, 5)} – {editingItem.end_time?.slice(0, 5)}
                    </p>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setEditingItem(null)} style={{ background: "none", border: 0, color: "#9e96b5", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {editingItem.description && (
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9e96b5", lineHeight: 1.5 }}>{editingItem.description}</p>
            )}

            {editingItem.notify_minutes && (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#9e96b5" }}>🔔 {editingItem.notify_minutes} min antes</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => openEditor(editingItem)}
                style={{ flex: 1, padding: 10, borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)", background: "transparent", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                ✏️ Editar
              </button>
              <button type="button" onClick={async () => {
                const isSynth = editingItem.id.includes("_r_") || editingItem.id.includes("_cross");
                if (isSynth) {
                  const deleteAll = confirm("Este compromisso se repete.\n\nOK = Excluir TODOS\nCancelar = Apenas este");
                  if (deleteAll) {
                    await fetch(`/api/agenda?id=${realId(editingItem)}`, { method: "DELETE" });
                  } else {
                    // Mark just this occurrence as concluída (acts as exclusion)
                    await fetch("/api/agenda", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: editingItem.title,
                        item_type: editingItem.item_type,
                        date: editingItem.date,
                        start_time: editingItem.start_time,
                        end_time: editingItem.end_time,
                        priority: editingItem.priority,
                        emoji: editingItem.emoji || null,
                        description: editingItem.description || null,
                        color: editingItem.color || null,
                        status: "concluida",
                      }),
                    });
                  }
                } else {
                  if (!confirm("Excluir este compromisso?")) return;
                  await fetch(`/api/agenda?id=${realId(editingItem)}`, { method: "DELETE" });
                }
                setEditingItem(null); fetchItems(selectedDate);
              }}
                style={{ flex: 1, padding: 10, borderRadius: 12, border: 0, background: "rgba(255,92,92,0.1)", color: "#FF5C5C", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🗑 Excluir
              </button>
            </div>
            <button type="button" onClick={() => {
              setNewItemType("compromisso");
              setNewStartTime(editingItem.start_time?.slice(0,5) || "09:00");
              setNewEndTime(editingItem.end_time?.slice(0,5) || "10:00");
              setNewEmoji(editingItem.emoji || "");
              setNewPriority(editingItem.priority as EisenhowerPriority);
              setNewTitle(editingItem.title);
              setShowNewItem(true);
              setEditingItem(null);
            }}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 12, border: "1px solid rgba(167,139,250,0.15)", background: "rgba(167,139,250,0.05)", color: "#9e96b5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              📋 Duplicar
            </button>
          </div>
        </div>
      )}

      {/* ── Mini editor for weekly plan tasks ────────────────── */}
      {editingPlanTask && (
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ width: "100%", maxWidth: 380, background: "#151520", borderRadius: 24, padding: 24, border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#e0d6ff" }}>Editar tarefa do plano</h3>
              <button type="button" onClick={() => setEditingPlanTask(null)} style={{ background: "none", border: 0, color: "#9e96b5", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {/* Title */}
            <input value={planEditTitle} onChange={e => setPlanEditTitle(e.target.value)}
              placeholder="Título"
              style={{...modalInput, marginBottom: 12}} autoFocus />

            {/* Day selector */}
            <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Mover para</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label, i) => (
                <button key={i} type="button" onClick={() => setPlanEditDay(i)}
                  style={{
                    padding: "6px 10px", borderRadius: 9999, border: 0, cursor: "pointer",
                    fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                    background: planEditDay === i ? "#7C5CFF" : "#1e1840",
                    color: planEditDay === i ? "#fff" : "#9e96b5",
                  }}>{label}</button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={async () => {
                if (!confirm("Excluir esta tarefa?")) return;
                await fetch(`/api/weekly-plans/tasks/${editingPlanTask.id}`, { method: "DELETE" });
                setAllWeekTasks((prev: any[]) => prev.filter((wt: any) => wt.id !== editingPlanTask.id));
                setEditingPlanTask(null);
              }}
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: 0, background: "rgba(255,92,92,0.1)", color: "#FF5C5C", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                🗑 Excluir
              </button>
              <button type="button" onClick={async () => {
                const updates: Record<string, unknown> = {
                  title: planEditTitle.trim() || editingPlanTask.title,
                  day_of_week: planEditDay,
                };
                const res = await fetch(`/api/weekly-plans/tasks/${editingPlanTask.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updates),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setAllWeekTasks((prev: any[]) => prev.map((wt: any) => wt.id === editingPlanTask.id ? updated : wt));
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

      {/* ── FAB (Dia) ────────────────────────────────────────── */}
      {(activeModule === "agenda" && viewMode === "dia") && (
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
        <div
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "16px 12px", paddingTop: "max(40px, env(safe-area-inset-top))",
            overflowY: "auto", WebkitOverflowScrolling: "touch",
          }}>
          <div style={{
            width: "100%", maxWidth: 420,
            background: "#151520", borderRadius: 24,
            padding: 20,
            border: "1px solid rgba(167,139,250,0.15)",
          }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#e0d6ff" }}>
              {editingId
                ? `Editar ${newItemType === "compromisso" ? "compromisso" : "tarefa"}`
                : newItemType === "compromisso" ? "Novo compromisso" : "Nova tarefa"}
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
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <div style={{ width: "40%" }}>
                  <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4, display: "block" }}>Início</label>
                  <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}
                    style={{
                      height: 44, padding: "0 10px", fontSize: 14, fontWeight: 600,
                      borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
                      background: "#0B0B10", color: "#e0d6ff",
                      fontFamily: "inherit", outline: "none",
                      width: "100%", boxSizing: "border-box",
                    }} />
                </div>
                <div style={{ width: "40%" }}>
                  <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 4, display: "block" }}>Fim</label>
                  <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)}
                    style={{
                      height: 44, padding: "0 10px", fontSize: 14, fontWeight: 600,
                      borderRadius: 12, border: "1px solid rgba(167,139,250,0.2)",
                      background: "#0B0B10", color: "#e0d6ff",
                      fontFamily: "inherit", outline: "none",
                      width: "100%", boxSizing: "border-box",
                    }} />
                </div>
              </div>
            )}

            {/* Description */}
            <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
              style={{ ...modalInput, marginTop: 10, resize: "none", height: 56 }} />

            {/* Color picker */}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Cor</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["#7C5CFF", "#FF4D4D", "#FF9F43", "#FFD43B", "#4CD97B", "#5EEAD4", "#F472B6", "#818CF8"].map(c => (
                  <button key={c} type="button" onClick={() => setNewColor(c)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", background: c, border: newColor === c ? "2.5px solid #fff" : "2px solid transparent", cursor: "pointer", transition: "all .1s", boxShadow: newColor === c ? "0 0 8px " + c + "66" : "none",
                    }} />
                ))}
              </div>
            </div>

            {/* Repeat (só compromisso) */}
            {newItemType === "compromisso" && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Repetir</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {[
                    { val: "none", label: "Não" },
                    { val: "daily", label: "Diário" },
                    { val: "weekdays", label: "Dias úteis" },
                    { val: "weekly", label: "Semanal" },
                    { val: "monthly", label: "Mensal" },
                  ].map(r => (
                    <button key={r.val} type="button" onClick={() => setNewRepeat(r.val)}
                      style={{
                        padding: "5px 10px", borderRadius: 9999, border: 0, cursor: "pointer", fontFamily: "inherit",
                        fontSize: 10, fontWeight: 600, background: newRepeat === r.val ? "#7C5CFF" : "#1e1840",
                        color: newRepeat === r.val ? "#fff" : "#9e96b5",
                      }}>{r.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Notification */}
            {newItemType === "compromisso" && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Notificação</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {[
                    { val: null, label: "Nenhum" },
                    { val: 5, label: "5 min" },
                    { val: 15, label: "15 min" },
                    { val: 30, label: "30 min" },
                    { val: 60, label: "1 hora" },
                  ].map(n => (
                    <button key={String(n.val)} type="button" onClick={() => setNewNotify(n.val)}
                      style={{
                        padding: "5px 10px", borderRadius: 9999, border: 0, cursor: "pointer", fontFamily: "inherit",
                        fontSize: 10, fontWeight: 600, background: newNotify === n.val ? "#7C5CFF" : "#1e1840",
                        color: newNotify === n.val ? "#fff" : "#9e96b5",
                      }}>{n.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Due date (só tarefa) */}
            {newItemType === "tarefa" && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 10, color: "#9e96b5", marginBottom: 6, display: "block" }}>Data limite</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                  style={{ ...modalInput, width: "100%", boxSizing: "border-box", minWidth: 0 }} />
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
              <button type="button" onClick={closeNewItemModal}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 14,
                  border: "1px solid rgba(167,139,250,0.2)", background: "transparent",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, color: "#9e96b5",
                }}>Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving || !newTitle.trim()}
                style={{
                  flex: 2, padding: "14px 0", borderRadius: 14, border: 0,
                  cursor: (saving || !newTitle.trim()) ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                  background: (saving || !newTitle.trim()) ? "#1e1840" : "#7C5CFF",
                  color: (saving || !newTitle.trim()) ? "#9e96b5" : "#fff",
                }}>{saving ? "Salvando…" : editingId ? "Salvar alterações" : "Adicionar"}</button>
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
      await fetch(`/api/agenda?id=${(editingItem as any)._origId || editingItem.id}`, { method: "DELETE" });
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
        <div onTouchMove={(e) => e.stopPropagation()}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px 20px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
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
  flex: 1, padding: "12px 0", borderRadius: 14, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
  background: "#1a1530", color: "#9e96b5",
  border: "1px solid rgba(167,139,250,0.15)",
};
