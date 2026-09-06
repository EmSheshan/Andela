const CACHE_VERSION = "v7";
const APP_SHELL_CACHE = `andela-pokedex-shell-${CACHE_VERSION}`;
const IMAGE_CACHE = `andela-pokedex-images-${CACHE_VERSION}`;
const CURRENT_CACHES = [APP_SHELL_CACHE, IMAGE_CACHE];

const IMAGE_CACHE_PATTERN = /pokemonArt\/(.*)\.(png|jpg|jpeg|webp)$/i; // matches data/pokemonArt/…

// Everything the app needs to render and navigate offline, aside from the
// Pokémon art itself (handled separately below since it's a lot heavier).
const APP_SHELL_URLS = [
  "/index.html",
  "/cardPage.html",
  "/styles.css",
  "/index.js",
  "/cardPage.js",
  "/darkMode.js",
  "/pokeData.js",
  "/data/pokedex.csv",
  "/data/megadex.csv",
  "/data/canondex.csv",
  "/data/moves.js",
  "/data/abilities.js",
  "/data/region.js",
  "/assets/Bg_Light.svg",
  "/assets/Bg_Dark.svg",
  "/typeIcons/Bug.png",
  "/typeIcons/Dark.png",
  "/typeIcons/Dragon.png",
  "/typeIcons/Electric.png",
  "/typeIcons/Fairy.png",
  "/typeIcons/Fighting.png",
  "/typeIcons/Fire.png",
  "/typeIcons/Flying.png",
  "/typeIcons/Ghost.png",
  "/typeIcons/Grass.png",
  "/typeIcons/Ground.png",
  "/typeIcons/Ice.png",
  "/typeIcons/Normal.png",
  "/typeIcons/Poison.png",
  "/typeIcons/Psychic.png",
  "/typeIcons/Rock.png",
  "/typeIcons/Steel.png",
  "/typeIcons/Water.png",
  "/moveIcons/Physical.png",
  "/moveIcons/Special.png",
  "/moveIcons/Status.png",
];

// Canon reference Pokémon (canondex.csv) have no grid tile and no card page —
// their art is only ever requested from inside an evolution node. That means
// nothing ever warms it into IMAGE_CACHE the way scrolling the grid warms every
// regular/Mega mon, so on mobile (offline / flaky / installed PWA) the canon art
// in evo trees just fails to load. Precache it here, reading the ids straight
// from canondex.csv so this stays in sync as canon mons are added.
async function precacheCanonArt(cache) {
  const res = await fetch("/data/canondex.csv");
  if (!res.ok) return; // canondex.csv is optional
  const rows = (await res.text()).split(/\r?\n/).filter((line) => line.trim());
  const header = rows.shift();
  if (!header) return;
  const idCol = header.split(",").indexOf("id");
  if (idCol === -1) return;
  // ids are simple slugs in leading columns (before any quoted description
  // fields), so a plain comma-split reliably yields the id here.
  const artUrls = rows
    .map((line) => line.split(",")[idCol]?.trim())
    .filter(Boolean)
    .map((id) => `/data/pokemonArt/${id}.png`);
  // allSettled so a canon mon missing its art file can't sink the precache.
  await Promise.allSettled(artUrls.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(APP_SHELL_CACHE).then((cache) =>
        // allSettled (not addAll) so one bad/missing URL can't sink the
        // whole precache.
        Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url))),
      ),
      caches
        .open(IMAGE_CACHE)
        .then((cache) => precacheCanonArt(cache))
        .catch(() => {}),
    ]),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Pokémon art is stable, rarely-changing source material — serve straight
// from cache once fetched once, only hitting the network for new entries.
function cacheFirst(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        }),
    ),
  );
}

// App shell (HTML/CSS/JS/dex data/icons): serve instantly from cache, then
// refresh the cache in the background so code/data edits still reach
// returning visitors without needing a manual cache-version bump.
function staleWhileRevalidate(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    }),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (IMAGE_CACHE_PATTERN.test(request.url)) {
    event.respondWith(cacheFirst(IMAGE_CACHE, request));
    return;
  }

  if (request.url.startsWith(self.location.origin)) {
    event.respondWith(staleWhileRevalidate(APP_SHELL_CACHE, request));
  }
});
