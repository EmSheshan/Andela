// index.js — loads and displays Pokémon data on the main page

import {pokedex} from "./pokedex.js";
import {megadex} from "./megadex.js";

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

    displayPokemonData(pokemonList, "pokedex");
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
            if (isOpen) {
                setTimeout(() => document.getElementById('searchInput')?.focus(), 50);
            }
        });
    }
}


function buildTypeFilters(allPokemon) {
    const typeSet = new Set();
    allPokemon.forEach(p => p.types.forEach(t => typeSet.add(t)));

    const container = document.getElementById('typeFilterContainer');
    if (!container) return;

    [...typeSet].sort().forEach(type => {
        const btn = document.createElement('button');
        btn.classList.add('type-filter-btn');
        btn.dataset.type = type;
        btn.innerHTML = `<img src="${TYPE_ICON_PATH}${type}.png" alt="${type}"> ${type}`;
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
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

        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    updateResultCount(visibleCount);

    // Show no-results message if needed
    ['pokedex', 'megadex'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        let noResults = container.querySelector('.no-results');
        const hasVisible = [...container.querySelectorAll('.pokemon')].some(c => c.style.display !== 'none');
        if (!hasVisible) {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.className = 'no-results';
                noResults.textContent = 'No Pokémon match your search.';
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

    // One shared observer for all cards in this container
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("slide-in");
                entry.target.addEventListener('transitionend', () => {
                    entry.target.style.setProperty('--animation-delay', '0s');
                }, {once: true});
                obs.unobserve(entry.target);
            }
        });
    }, {root: null, threshold: 0.1});

    pokemonList.forEach((pokemon) => {
        const displayTileName = pokemon.displayName || pokemon.name;

        const type1 = pokemon.types[0];
        const type2 = pokemon.types[1];

        const baseId = pokemon.id || pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        const regularImage = `${IMAGE_PATH}${baseId}.png`;
        const shinyImage = `${IMAGE_PATH}${baseId}_shiny.png`;
        const type1Image = `${TYPE_ICON_PATH}${type1}.png`;
        const type2Image = type2 ? `${TYPE_ICON_PATH}${type2}.png` : null;

        const pokemonCard = document.createElement("div");
        pokemonCard.classList.add("pokemon");

        pokemonCard.dataset.name = pokemon.name.toLowerCase();
        pokemonCard.dataset.types = pokemon.types.join(',');
        pokemonCard.style.borderTop =    `6px solid var(--type-${type1.toLowerCase()})`;

        // Set stagger delay only for this card
        const randomDelay = (Math.random() * 0.4).toFixed(2);
        pokemonCard.style.setProperty('--animation-delay', `${randomDelay}s`);

        const displayName = pokemon.num < 3000
            ? `#${pokemon.num - 1999} ${displayTileName}`
            : displayTileName;

        pokemonCard.innerHTML = `
            <img src="${regularImage}"
                alt="${pokemon.name}"
                class="pokemon-image"
                loading="lazy">
            <div class="name">${displayName}</div>
            <div class="types">
                <img src="${type1Image}" alt="${type1}" class="type-image" loading="lazy">
                ${type2Image ? `<img src="${type2Image}" alt="${type2}" class="type-image" loading="lazy">` : ""}
            </div>
        `;

        // Use pokemonCard.querySelector instead of document.getElementById
        const cardImage = pokemonCard.querySelector('.pokemon-image');
        if (cardImage) {
            cardImage.addEventListener("mouseover", () => {
                cardImage.src = shinyImage;
            });
            cardImage.addEventListener("mouseout", () => {
                cardImage.src = regularImage;
            });
        }

        pokemonCard.addEventListener("click", () => {
            window.location.href = `cardPage.html?pokemonNumber=${pokemon.num}`;
        });

        container.appendChild(pokemonCard);
        observer.observe(pokemonCard);
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