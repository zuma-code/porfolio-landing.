self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === "/@vite/client" || url.pathname.startsWith("/@vite/")) {
    event.respondWith(
      new Response("export {};", {
        status: 200,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      }),
    );
  }
});
