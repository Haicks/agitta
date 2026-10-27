import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Generate an atomic, versioned shell cache; never cache Auth or API traffic. */
export function webApp() {
  let config;
  return {
    name: 'agitta-web-app',
    apply: 'build',
    configResolved(value) { config = value; },
    async closeBundle() {
      const output = resolve(config.root, config.build.outDir);
      // Read after Vite writes HTML and CSS, so the offline shell is complete.
      const files = (await readdir(output, { recursive: true })).filter(file => /\.(html|js|css|svg|png|webmanifest)$/.test(file) && file !== 'sw.js').sort();
      if (!files.includes('index.html') || !files.some(file => file.endsWith('.css'))) throw new Error('Build incompleto: HTML ou CSS ausente.');
      const digest = createHash('sha256');
      for (const name of files) digest.update(name).update(await readFile(resolve(output, name)));
      const version = digest.digest('hex').slice(0, 20);
      await writeFile(resolve(output, 'sw.js'), `/* Agitta webapp: cache only the public application shell. */
const PREFIX = 'agitta-shell-' + self.registration.scope + '-';
const CACHE = PREFIX + '${version}';
const URLS = ${JSON.stringify(files)}.map(path => new URL(path, self.registration.scope).href);
const SHELL = new URL('index.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  url.search = ''; url.hash = '';
  let target = url.href;
  if (event.request.mode === 'navigate') target = SHELL;
  else if (!URLS.includes(target)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(target)).then(cached => cached || fetch(event.request)));
});
`);
    },
  };
}
