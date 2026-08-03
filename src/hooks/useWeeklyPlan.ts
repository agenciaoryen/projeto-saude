"use client";

import { useState, useCallback, useEffect } from "react";
import type { Goal, GoalStage, GoalAction, WeeklyPlan, WeeklyReview, WeeklyTask } from "@/types";
import { getMondayForOffset } from "@/lib/planejamento-constants";

export type GoalFull = Goal & { goal_stages: (GoalStage & { goal_actions: GoalAction[] })[] };
export type PlanFull = WeeklyPlan & {
  weekly_reviews: WeeklyReview[];
  weekly_focus_goals: { goal_id: string }[];
  weekly_tasks: WeeklyTask[];
};
export type PlanData = { current: PlanFull | null; history: (WeeklyPlan & { weekly_reviews?: WeeklyReview[] })[] };

export function useWeeklyPlan(weekOffset: number) {
  const [goals, setGoals] = useState<GoalFull[]>([]);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStartStr = getMondayForOffset(weekOffset);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goalsRes, planRes] = await Promise.all([
        fetch("/api/goals").then((r) => r.json()),
        fetch(`/api/weekly-plans?week=${weekStartStr}`).then((r) => r.json()),
      ]);
      if (Array.isArray(goalsRes)) setGoals(goalsRes.filter((g: GoalFull) => g.status === "ativa"));
      if (planRes && typeof planRes === "object") {
        setPlan(planRes as PlanData);
        setTasks((planRes as PlanData).current?.weekly_tasks ?? []);
      } else {
        setPlan(null);
        setTasks([]);
      }
    } catch {
      setPlan(null);
      setTasks([]);
    }
    setLoading(false);
  }, [weekStartStr]);

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

  const addTask = async (taskData: {
    title: string; area: string; task_type: "manutencao" | "crescimento";
    day_of_week: number; scheduled_time: string | null;
    linked_goal_id?: string | null; linked_action_id?: string | null;
  }) => {
    const res = await fetch("/api/weekly-plans/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskData, week_start: weekStartStr }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      return task;
    }
    return null;
  };

  const updateTask = async (taskId: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/weekly-plans/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
      return updated;
    }
    return null;
  };

  const saveFocus = async (data: { f1: string; f2: string; f3: string; focusGoalIds: string[] }) => {
    const res = await fetch("/api/weekly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        main_focus: data.f1,
        main_focus_2: data.f2.trim() || null,
        main_focus_3: data.f3.trim() || null,
        focus_goal_ids: data.focusGoalIds,
        week_start: weekStartStr,
      }),
    });
    if (res.ok) {
      await load();
      return true;
    }
    return false;
  };

  const saveReview = async (data: {
    biggest_win: string; blocked_lesson: string; main_learning: string; week_score: number;
  }) => {
    const res = await fetch("/api/weekly-plans/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, week_start: weekStartStr }),
    });
    if (res.ok) {
      await load();
      return true;
    }
    return false;
  };

  return {
    goals, plan, tasks, loading, weekStartStr,
    load, toggleTask, deleteTask, addTask, updateTask,
    saveFocus, saveReview,
  };
}
