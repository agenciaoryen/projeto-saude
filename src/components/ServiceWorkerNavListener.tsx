"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Listens for MAYA_NAVIGATE messages from the service worker
 * (sent when user taps a push notification) and navigates via Next.js router.
 */
export function ServiceWorkerNavListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "MAYA_NAVIGATE" && typeof data.url === "string") {
        router.push(data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [router]);

  return null;
}
