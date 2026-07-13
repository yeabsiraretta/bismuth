/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const sw = globalThis.self as unknown as ServiceWorkerGlobalScope;

// Unique cache name per deployment — old caches are purged on activate
const CACHE = `bismuth-${version}`;

// Precache: built app bundles + everything in static/
const PRECACHE_ASSETS = [...build, ...files];

// ── Install: eagerly cache all built assets ─────────────────────────────────
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => sw.skipWaiting())
  );
});

// ── Activate: purge stale caches from previous deployments ──────────────────
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim())
  );
});

// ── Fetch: cache-first for precached assets, network-first for the rest ─────
sw.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-http(s) requests (e.g. chrome-extension://, tauri://)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(respond(event.request, url));
});

async function respond(request: Request, url: URL): Promise<Response> {
  const cache = await caches.open(CACHE);

  // Precached assets (build output + static files) — always serve from cache
  if (PRECACHE_ASSETS.includes(url.pathname)) {
    const cached = await cache.match(url.pathname);
    if (cached) return cached;
  }

  // Everything else — network first, fall back to cache
  try {
    const response = await fetch(request);

    if (!(response instanceof Response)) {
      throw new Error('Invalid response from fetch');
    }

    // Cache successful GET responses (skip no-store)
    if (response.status === 200 && !response.headers.get('cache-control')?.includes('no-store')) {
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Nothing in cache and network is down — return a basic offline page
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
