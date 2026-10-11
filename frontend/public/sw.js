const CACHE = 'scrapsetu-shell-v3';
self.addEventListener('install', event => { event.waitUntil((async()=>{const c=await caches.open(CACHE);const response=await fetch('/');const html=await response.clone().text();await c.put('/',response);const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m=>m[1]);await c.addAll([...assets,'/manifest.webmanifest','/favicon.svg']);})()); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('scrapsetu-shell-') && k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {if(response.ok) {const copy=response.clone(); caches.open(CACHE).then(c=>c.put('/',copy));} return response;}).catch(()=>caches.match('/')));
  } else if (url.pathname.startsWith('/assets/') || ['/favicon.svg','/manifest.webmanifest'].includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {if(response.ok) {const copy=response.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy));} return response;})));
  }
});
