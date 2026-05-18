/** Register the service worker and return the registration, or null if unsupported. */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch {
    return null;
  }
}

/** Returns true if push is supported and permission is already granted. */
export function hasPushPermission(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && Notification.permission === "granted";
}

/** Converts a VAPID public key (base64url) to a Uint8Array for the PushManager. */
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
 * Returns the PushSubscription or null on failure/denial.
 */
export async function requestPushSubscription(): Promise<PushSubscription | null> {
  const reg = await registerSW();
  if (!reg) return null;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
    return null;
  }

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    return sub;
  } catch {
    return null;
  }
}
