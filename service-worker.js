const CACHE_VERSION = 'v3';
const APP_SHELL_CACHE = `andela-pokedex-shell-${CACHE_VERSION}`;
const IMAGE_CACHE = `andela-pokedex-images-${CACHE_VERSION}`;
const CURRENT_CACHES = [APP_SHELL_CACHE, IMAGE_CACHE];

const IMAGE_CACHE_PATTERN = /pokemonArt\/(.*)\.(png|jpg|jpeg|webp)$/i;

// Everything the app needs to render and navigate offline, aside from the
// Pokémon art itself (handled separately below since it's a lot heavier).
const APP_SHELL_URLS = [
    '/index.html',
    '/cardPage.html',
    '/styles.css',
    '/index.js',
    '/cardPage.js',
    '/darkMode.js',
    '/pokedex.js',
    '/megadex.js',
    '/moves.js',
    '/abilities.js',
    '/assets/Bg_Light.svg',
    '/assets/Bg_Dark.svg',
    '/typeIcons/Bug.png',
    '/typeIcons/Dark.png',
    '/typeIcons/Dragon.png',
    '/typeIcons/Electric.png',
    '/typeIcons/Fairy.png',
    '/typeIcons/Fighting.png',
    '/typeIcons/Fire.png',
    '/typeIcons/Flying.png',
    '/typeIcons/Ghost.png',
    '/typeIcons/Grass.png',
    '/typeIcons/Ground.png',
    '/typeIcons/Ice.png',
    '/typeIcons/Normal.png',
    '/typeIcons/Poison.png',
    '/typeIcons/Psychic.png',
    '/typeIcons/Rock.png',
    '/typeIcons/Steel.png',
    '/typeIcons/Water.png',
    '/moveIcons/Physical.png',
    '/moveIcons/Special.png',
    '/moveIcons/Status.png',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then(cache =>
            // allSettled (not addAll) so one bad/missing URL can't sink the
            // whole precache.
            Promise.allSettled(APP_SHELL_URLS.map(url => cache.add(url)))
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => !CURRENT_CACHES.includes(key)).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Pokémon art is stable, rarely-changing source material — serve straight
// from cache once fetched once, only hitting the network for new entries.
function cacheFirst(cacheName, request) {
    return caches.open(cacheName).then(cache =>
        cache.match(request).then(cached => cached || fetch(request).then(response => {
            cache.put(request, response.clone());
            return response;
        }))
    );
}

// App shell (HTML/CSS/JS/dex data/icons): serve instantly from cache, then
// refresh the cache in the background so code/data edits still reach
// returning visitors without needing a manual cache-version bump.
function staleWhileRevalidate(cacheName, request) {
    return caches.open(cacheName).then(cache =>
        cache.match(request).then(cached => {
            const networkFetch = fetch(request).then(response => {
                cache.put(request, response.clone());
                return response;
            }).catch(() => cached);
            return cached || networkFetch;
        })
    );
}

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    if (IMAGE_CACHE_PATTERN.test(request.url)) {
        event.respondWith(cacheFirst(IMAGE_CACHE, request));
        return;
    }

    if (request.url.startsWith(self.location.origin)) {
        event.respondWith(staleWhileRevalidate(APP_SHELL_CACHE, request));
    }
});
