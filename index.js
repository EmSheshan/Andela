// index.js — loads and displays Pokémon data on the main page

import {pokedex} from "./pokedex.js";
import {megadex} from "./megadex.js";

// The grid is built by JS after the page loads, so the browser's automatic
// scroll restoration tries to re-apply the old scroll position while the page
// is still short/building — which makes the content lurch on refresh. Opt out
// and start at the top; the grid then fills in below without moving the view.
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const IMAGE_PATH = "pokemonArt/";
const TYPE_ICON_PATH = "typeIcons/";


/**
 * Loads Pokémon data from the imported module and filters it to display only base forms.
 */
function loadPokemonData() {

    const allPokemon = Object.values(pokedex);
    const baseFormsMap = new Map();

    for (const pokemon of allPokemon) {
        const num = pokemon.num;
        let simplifiedName = pokemon.name;

        if (pokemon.name.includes("-")) {
            simplifiedName = pokemon.name.split("-")[0];
        }

        pokemon.displayName = simplifiedName;

        if (!baseFormsMap.has(num)) {
            baseFormsMap.set(num, pokemon);
        }
    }

    const pokemonList = Array.from(baseFormsMap.values());
    const megaList = Object.values(megadex);

    // Render the main grid first — its first tile is the LCP element, so
    // getting it into the DOM is the only critical-path work here.
    displayPokemonData(pokemonList, "pokedex");

    // Everything below the fold (the megadex grid) and the surrounding UI
    // (type filters, search, buttons) is not needed for the first paint.
    // Defer it past a paint so the browser can render the LCP tile without
    // waiting for all this work to finish, cutting LCP render delay.
    const buildSecondaryUI = () => {
        displayPokemonData(megaList, "megadex");

        // Build type filter buttons from all unique types across both lists
        buildTypeFilters([...pokemonList, ...megaList]);

        // Wire up search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', filterCards);
        }

        // Update count badge initially
        updateResultCount();

        // Back to top button
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                backToTopBtn.classList.toggle('visible', window.scrollY > 400);
            });
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        }

        // Collapsible search toggle
        const searchToggleBtn = document.getElementById('searchToggleBtn');
        const searchFilterBar = document.querySelector('.search-filter-bar');
        if (searchToggleBtn && searchFilterBar) {
            searchToggleBtn.addEventListener('click', () => {
                const isOpen = searchFilterBar.classList.toggle('open');
                searchToggleBtn.classList.toggle('active', isOpen);
                searchToggleBtn.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) {
                    setTimeout(() => document.getElementById('searchInput')?.focus(), 50);
                }
            });
        }
    };

    // Two rAFs guarantee a frame is painted before the deferred work runs.
    requestAnimationFrame(() => requestAnimationFrame(buildSecondaryUI));
}


// Canonical in-game type order (the type-chart order), so the filters read the
// way they do in the games rather than alphabetically. Reorder this list to
// change the filter order.
const TYPE_ORDER = [
    "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison",
    "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark",
    "Steel", "Fairy"
];

function buildTypeFilters(allPokemon) {
    const typeSet = new Set();
    allPokemon.forEach(p => p.types.forEach(t => typeSet.add(t)));

    const container = document.getElementById('typeFilterContainer');
    if (!container) return;

    const orderOf = (t) => {
        const i = TYPE_ORDER.indexOf(t);
        return i === -1 ? TYPE_ORDER.length : i;   // unknown types fall to the end
    };

    [...typeSet].sort((a, b) => orderOf(a) - orderOf(b)).forEach(type => {
        const btn = document.createElement('button');
        btn.classList.add('type-filter-btn');
        btn.dataset.type = type;
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `<img src="${TYPE_ICON_PATH}${type}.png" alt="${type}"> ${type}`;
        btn.addEventListener('click', () => {
            const isActive = btn.classList.toggle('active');
            btn.setAttribute('aria-pressed', String(isActive));
            filterCards();
        });
        container.appendChild(btn);
    });
}

/**
 * Filters Pokémon cards based on search input and active type filters.
 */
function filterCards() {
    const searchText = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const activeTypes = [...document.querySelectorAll('.type-filter-btn.active')].map(b => b.dataset.type);

    let visibleCount = 0;

    document.querySelectorAll('.pokemon').forEach(card => {
        const name = card.dataset.name || '';
        const types = (card.dataset.types || '').split(',');

        const nameMatch = !searchText || name.includes(searchText);
        const typeMatch = activeTypes.length === 0 || activeTypes.some(t => types.includes(t));
        const visible = nameMatch && typeMatch;

        card.classList.toggle('hidden', !visible);
        if (visible) visibleCount++;
    });

    updateResultCount(visibleCount);

    // Show no-results message if needed
    ['pokedex', 'megadex'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        let noResults = container.querySelector('.no-results');
        const hasVisible = [...container.querySelectorAll('.pokemon')].some(c => !c.classList.contains('hidden'));
        if (!hasVisible) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.innerHTML = `
                    <div class="no-results-mark">◆</div>
                    <p class="no-results-title">Nothing in the archive</p>
                    <p class="no-results-sub">No Pokémon match that search. Try a different name, or clear the type filters.</p>
                `;
                container.appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });
}

/**
 * Updates the result count badge with the number of visible Pokémon cards.
 * @param count
 */
function updateResultCount(count) {
    const badge = document.getElementById('resultCount');
    if (!badge) return;
    const total = document.querySelectorAll('.pokemon').length;
    if (count === undefined) count = total;
    badge.textContent = `${count} / ${total}`;
}

/**
 * Displays Pokémon data in the specified container.
 * @param {Array} pokemonList - List of Pokémon objects to display.
 * @param {string} containerId - ID of the container element where cards will be displayed.
 */
function displayPokemonData(pokemonList, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    // Reveal one tile: give it a playful random stagger delay, add .slide-in to
    // trigger the fade/slide, then clear the delay so later hover transitions
    // are snappy.
    const reveal = (card) => {
        card.style.setProperty('--animation-delay', `${(Math.random() * 0.4).toFixed(2)}s`);
        card.classList.add("slide-in");
        card.addEventListener('transitionend', () => {
            card.style.setProperty('--animation-delay', '0s');
        }, {once: true});
    };

    // Reveal a group of tiles, each popping in on its own random beat.
    const cascade = (cards) => cards.forEach(reveal);

    // Below-the-fold tiles stagger in as they're scrolled into view.
    const observer = new IntersectionObserver((entries, obs) => {
        const shown = entries.filter(e => e.isIntersecting).map(e => e.target);
        shown.forEach(el => obs.unobserve(el));
        if (shown.length) cascade(shown);
    }, {root: null, threshold: 0.1});

    const deferredCards = [];

    pokemonList.forEach((pokemon, index) => {
        const displayTileName = pokemon.displayName || pokemon.name;

        // The first tile of the main Pokédex grid is the LCP element. It must
        // load eagerly at high priority (and be preloaded from index.html) so
        // it paints as fast as possible; everything below the fold stays lazy.
        const isLcpTile = containerId === "pokedex" && index === 0;

        const type1 = pokemon.types[0];
        const type2 = pokemon.types[1];

        const baseId = pokemon.id || pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        const regularImage = `${IMAGE_PATH}${baseId}.png`;
        const type1Image = `${TYPE_ICON_PATH}${type1}.png`;
        const type2Image = type2 ? `${TYPE_ICON_PATH}${type2}.png` : null;

        const pokemonCard = document.createElement("a");
        pokemonCard.href = `cardPage.html?pokemonNumber=${pokemon.num}`;
        pokemonCard.classList.add("pokemon");

        pokemonCard.dataset.name = pokemon.name.toLowerCase();
        pokemonCard.dataset.types = pokemon.types.join(',');
        pokemonCard.style.setProperty('--card-type-color', `var(--type-${type1.toLowerCase()})`);

        if (isLcpTile) {
            // The LCP tile must be visible on the very first frame. The default
            // tiles start at opacity:0 and only fade in once revealed — that
            // opacity fade would delay the LCP paint. Start it already-visible
            // (.slide-in); .lcp-tile plays a transform-only slide-in so it keeps
            // the entrance animation without the LCP penalty.
            pokemonCard.classList.add("slide-in", "lcp-tile");
            // Once the one-shot entrance finishes, drop .lcp-tile so its CSS
            // animation can't replay when filters toggle the tile's display
            // (display:none→block restarts CSS animations). .slide-in remains,
            // holding it visible — matching the other tiles, which never replay.
            pokemonCard.addEventListener('animationend', () => {
                pokemonCard.classList.remove('lcp-tile');
            }, {once: true});
        }

        const dexNum = pokemon.num < 3000
            ? `<span class="dex-num">Nº ${String(pokemon.num - 1999).padStart(3, '0')}</span>`
            : '';

        pokemonCard.innerHTML = `
            <div class="pokemon-art">
                ${dexNum}
                <img src="${regularImage}"
                    alt="${pokemon.name}"
                    class="pokemon-image"
                    ${isLcpTile ? 'fetchpriority="high"' : 'loading="lazy"'}>
            </div>
            <div class="name-row">
                <div class="name">${displayTileName}</div>
                <div class="types">
                    <img src="${type1Image}" alt="${type1}" class="type-image" loading="lazy">
                    ${type2Image ? `<img src="${type2Image}" alt="${type2}" class="type-image" loading="lazy">` : ""}
                </div>
            </div>
        `;

        container.appendChild(pokemonCard);
        // The LCP tile is already visible (.slide-in above); the rest are
        // revealed below — immediately if on screen, on scroll otherwise.
        if (!isLcpTile) deferredCards.push(pokemonCard);
    });

    // Reveal just the small cluster around mon 1 immediately, so the LCP tile
    // isn't left visually isolated with a gap after it. Everything else is
    // handed to the observer and staggers in *as it's scrolled into view* —
    // that scroll reveal is the whole point of the effect, so keep this count
    // small (roughly the top row) rather than the whole first screen. A fixed
    // count avoids reading geometry here (which would force a synchronous
    // reflow). The megadex is always below the fold, so nothing reveals early.
    const immediateCount = containerId === "pokedex" ? 6 : 0;
    requestAnimationFrame(() => {
        deferredCards.forEach((card, i) => {
            if (i < immediateCount) reveal(card);
            else observer.observe(card);
        });
    });
}


// Register service worker for image caching
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered:', reg.scope))
            .catch(err => console.warn('Service Worker registration failed:', err));
    });
}

// Load Pokémon data on page load
loadPokemonData();