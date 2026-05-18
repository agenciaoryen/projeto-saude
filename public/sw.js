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

  let url = "/sono";

  if (action === "quality_good") {
    url = `/api/sleep/quick?quality=4&date=${data.date ?? ""}`;
  } else if (action === "quality_ok") {
    url = `/api/sleep/quick?quality=3&date=${data.date ?? ""}`;
  } else if (action === "quality_bad") {
    url = `/api/sleep/quick?quality=2&date=${data.date ?? ""}`;
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If app is open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
