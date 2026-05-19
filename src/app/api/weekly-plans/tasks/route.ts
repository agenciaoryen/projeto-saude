import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { getWeekMondayDate } from "@/lib/utils";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, area, task_type, linked_goal_id, linked_action_id, day_of_week, scheduled_time } = body;

  if (!title || area === undefined || day_of_week === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios: title, area, day_of_week" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const weekStart = getWeekMondayDate();

  // Ensure a plan exists for this week
  const { data: plan, error: planErr } = await admin
    .from("weekly_plans")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 });

  let planId: string;

  if (!plan) {
    const { data: newPlan, error: createErr } = await admin
      .from("weekly_plans")
      .insert({ user_id: session.user.id, week_start: weekStart, main_focus: "" })
      .select("id")
      .single();
    if (createErr || !newPlan) return NextResponse.json({ error: createErr?.message }, { status: 500 });
    planId = newPlan.id;
  } else {
    planId = plan.id;
  }

  const { data: task, error } = await admin
    .from("weekly_tasks")
    .insert({
      weekly_plan_id: planId,
      user_id: session.user.id,
      title,
      area,
      task_type: task_type || "manutencao",
      linked_goal_id: linked_goal_id || null,
      linked_action_id: linked_action_id || null,
      day_of_week,
      scheduled_time: scheduled_time || null,
    })
    .select()
    .single();

  if (error || !task) return NextResponse.json({ error: error?.message }, { status: 500 });
  return NextResponse.json(task, { status: 201 });
}
