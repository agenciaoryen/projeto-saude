import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ALL_QUESTION_KEYS } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: prefs, error } = await admin
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!prefs) {
      return NextResponse.json({
        enabled_questions: [...ALL_QUESTION_KEYS],
        context: {},
        onboarding_completed: false,
      });
    }

    return NextResponse.json({
      enabled_questions: prefs.enabled_questions,
      context: prefs.context || {},
      onboarding_completed: prefs.onboarding_completed,
    });
  } catch (error) {
    console.error("GET /api/preferences error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar preferências", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enabled_questions, context, onboarding_completed } = body;

    const admin = getSupabaseAdmin();

    const { data: existing } = await admin
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const { data: updated, error } = await admin
        .from("user_preferences")
        .update({
          enabled_questions: enabled_questions ?? undefined,
          context: context ?? undefined,
          onboarding_completed: onboarding_completed ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        enabled_questions: updated.enabled_questions,
        context: updated.context || {},
        onboarding_completed: updated.onboarding_completed,
      });
    }

    const { data: created, error } = await admin
      .from("user_preferences")
      .insert({
        user_id: user.id,
        enabled_questions: enabled_questions ?? [...ALL_QUESTION_KEYS],
        context: context ?? {},
        onboarding_completed: onboarding_completed ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        enabled_questions: created.enabled_questions,
        context: created.context || {},
        onboarding_completed: created.onboarding_completed,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/preferences error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar preferências", detail: String(error) },
      { status: 500 }
    );
  }
}
