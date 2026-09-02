// Service worker simples: guarda o essencial em cache para abrir mais rápido
// e é o que faz o navegador oferecer "instalar app" no Android.
const CACHE_NAME = 'preco-na-praca-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para o app shell; passa direto pra rede em chamadas ao Supabase
// (dados de preço sempre precisam vir atualizados, não do cache).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // deixa a chamada ao Supabase seguir normal

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
