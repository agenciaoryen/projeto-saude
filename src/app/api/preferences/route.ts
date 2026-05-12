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
        onboarding_completed: false,
      });
    }

    return NextResponse.json({
      enabled_questions: prefs.enabledQuestions,
      onboarding_completed: prefs.onboardingCompleted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar preferências" },
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
    const { enabled_questions, onboarding_completed } = body;

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
          onboardingCompleted:
            onboarding_completed ?? existing.onboardingCompleted,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id))
        .returning();

      return NextResponse.json({
        enabled_questions: updated.enabledQuestions,
        onboarding_completed: updated.onboardingCompleted,
      });
    }

    const [created] = await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        enabledQuestions: enabled_questions || [...ALL_QUESTION_KEYS],
        onboardingCompleted: onboarding_completed ?? false,
      })
      .returning();

    return NextResponse.json(
      {
        enabled_questions: created.enabledQuestions,
        onboarding_completed: created.onboardingCompleted,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar preferências" },
      { status: 500 }
    );
  }
}
