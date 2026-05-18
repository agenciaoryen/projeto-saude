/** Register the service worker and return the registration, or null if unsupported. */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  try {
    await navigator.serviceWorker.register("/sw.js");
    return null; // registration triggered; use .ready for subscription
  } catch {
    return null;
  }
}

/** Returns true if push is supported and permission is already granted. */
export function hasPushPermission(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && Notification.permission === "granted";
}

/** Converts a VAPID public key (base64url) to an ArrayBuffer for the PushManager. */
export function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer;
}

/**
 * Request push permission and create a subscription.
 * Registers the SW, waits for it to become active (navigator.serviceWorker.ready),
 * then subscribes. Returns { sub, error } — sub is null on failure.
 */
export async function requestPushSubscription(): Promise<{ sub: PushSubscription | null; error: string | null }> {
  if (typeof window === "undefined") return { sub: null, error: "SSR" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { sub: null, error: "Push não suportado neste navegador" };

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { sub: null, error: "VAPID key não configurada" };

  try {
    await navigator.serviceWorker.register("/sw.js");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    return { sub, error: null };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("Push subscription failed:", msg);
    return { sub: null, error: msg };
  }
}
