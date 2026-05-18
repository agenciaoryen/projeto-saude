import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

/** Send a push notification to all subscriptions of a user. Returns count of successful sends. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            tag: payload.tag ?? "default",
            icon: payload.icon ?? "/icons/icon-192.png",
            data: payload.data ?? {},
            actions: payload.actions ?? [],
          }),
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired or unsubscribed — mark for removal
          stale.push(s.endpoint);
        } else {
          console.error("Push send error:", err);
        }
      }
    }),
  );

  // Clean up expired subscriptions
  if (stale.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return sent;
}
