import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  try {
    if (date) {
      const result = await db
        .select()
        .from(checkIns)
        .where(
          and(eq(checkIns.userId, user.id), eq(checkIns.date, date))
        )
        .limit(1);

      return NextResponse.json(result[0] || null);
    }

    const result = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.userId, user.id))
      .orderBy(checkIns.date);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar check-ins" },
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
    const today = new Date().toISOString().split("T")[0];

    const [existing] = await db
      .select()
      .from(checkIns)
      .where(
        and(eq(checkIns.userId, user.id), eq(checkIns.date, body.date || today))
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(checkIns)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(checkIns.id, existing.id))
        .returning();

      return NextResponse.json(updated);
    }

    const [created] = await db
      .insert(checkIns)
      .values({
        userId: user.id,
        date: body.date || today,
        feltJudged: body.feltJudged ?? false,
        tookMedication: body.tookMedication ?? false,
        talkedToSomeone: body.talkedToSomeone ?? false,
        meditationPrayerBreathing: body.meditationPrayerBreathing ?? false,
        creativeActivity: body.creativeActivity ?? false,
        ateWell: body.ateWell ?? false,
        bowelMovement: body.bowelMovement ?? false,
        exerciseWalk: body.exerciseWalk ?? false,
        drankWater: body.drankWater ?? false,
        sleptWell: body.sleptWell ?? false,
        suicidalThoughts: body.suicidalThoughts ?? false,
        didSomethingEnjoyable: body.didSomethingEnjoyable ?? false,
        workedOnGoals: body.workedOnGoals ?? false,
        feeling: body.feeling ?? "",
        gratitude: body.gratitude ?? "",
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao salvar check-in" },
      { status: 500 }
    );
  }
}
