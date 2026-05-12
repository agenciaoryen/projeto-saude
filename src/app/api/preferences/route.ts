import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { userPreferences, ALL_QUESTION_KEYS } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (!prefs) {
      return NextResponse.json({
        enabled_questions: [...ALL_QUESTION_KEYS],
        context: {},
        onboarding_completed: false,
      });
    }

    return NextResponse.json({
      enabled_questions: prefs.enabledQuestions,
      context: prefs.context || {},
      onboarding_completed: prefs.onboardingCompleted,
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { enabled_questions, context, onboarding_completed } = body;

    const [existing] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({
          enabledQuestions: enabled_questions || existing.enabledQuestions,
          context: context || existing.context || {},
          onboardingCompleted:
            onboarding_completed ?? existing.onboardingCompleted,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id))
        .returning();

      return NextResponse.json({
        enabled_questions: updated.enabledQuestions,
        context: updated.context || {},
        onboarding_completed: updated.onboardingCompleted,
      });
    }

    const [created] = await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        enabledQuestions: enabled_questions || [...ALL_QUESTION_KEYS],
        context: context || {},
        onboardingCompleted: onboarding_completed ?? false,
      })
      .returning();

    return NextResponse.json(
      {
        enabled_questions: created.enabledQuestions,
        context: created.context || {},
        onboarding_completed: created.onboardingCompleted,
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
