// Service Worker — handles push notifications for sleep reminders

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Saúde", body: event.data.text() };
  }

  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: payload.tag ?? "sleep",
    renotify: true,
    data: payload.data ?? {},
    actions: payload.actions ?? [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Saúde", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data ?? {};

  let url = "/dashboard";

  if (action === "quality_good") {
    url = `/api/sleep/quick?quality=4&date=${data.date ?? ""}`;
  } else if (action === "quality_ok") {
    url = `/api/sleep/quick?quality=3&date=${data.date ?? ""}`;
  } else if (action === "quality_bad") {
    url = `/api/sleep/quick?quality=2&date=${data.date ?? ""}`;
  } else if (data.url) {
    url = data.url;
  }

  const fullUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Find an open app window and focus + navigate it
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          client.focus();
          // Tell the app to navigate to the target URL
          client.postMessage({ type: "MAYA_NAVIGATE", url });
          return;
        }
      }
      // No open window — open a new one at the target URL
      if (clients.openWindow) return clients.openWindow(fullUrl);
    })
  );
});
