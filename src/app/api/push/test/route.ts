import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push-send";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const sent = await sendPushToUser(session.user.id, {
    title: "🌙 Teste de notificação",
    body: "As notificações de sono estão funcionando!",
    tag: "test",
    data: { url: "/sono" },
  });

  if (sent === 0) {
    return NextResponse.json({ error: "Nenhuma assinatura encontrada. Ative as notificações primeiro." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, sent });
}
