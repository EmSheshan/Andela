// cardPage.js
import {abilities} from './abilities.js';
import {moves} from './moves.js';
import {pokedex} from './pokedex.js';
import {megadex} from './megadex.js';

// Map where Key = Pokedex Number, Value = ARRAY of Pokémon Objects
let pokemonNumMap = new Map();
let uniquePokedexNumbers = [];

function initializePokemonData() {
    const rawData = Object.values(pokedex);
    const megaData = Object.values(megadex);

    rawData.forEach((pokemon) => {
        const num = parseInt(pokemon.num);

        if (!pokemonNumMap.has(num)) {
            pokemonNumMap.set(num, []);
            uniquePokedexNumbers.push(num);
        }
        pokemonNumMap.get(num).push(pokemon);
    });

    megaData.forEach((pokemon) => {
        const num = parseInt(pokemon.num);
        pokemonNumMap.set(num, []);
        uniquePokedexNumbers.push(num);
        pokemonNumMap.get(num).push(pokemon);
    });

    uniquePokedexNumbers.sort((a, b) => a - b);
}

initializePokemonData();


// --- Data Access ---

function getPokemonNumberFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get("pokemonNumber")) || -1;
}

function getPokemonFormsByNum(pokemonNumber) {
    return pokemonNumMap.get(pokemonNumber);
}


// --- Display Logic ---

function displayStatBar(stat, value, statKey, BST = false) {
    let maxStatValue = 180;
    if (BST) maxStatValue = 700;
    const percentageWidth = (value / maxStatValue) * 100;
    const bstClass = BST ? ' bst-row' : '';

    return `
        <div class="stat-bar${bstClass}">
            <div class="stat-name">${stat}</div>
            <div class="bar-container">
                <div class="bar-fill ${statKey}" data-target-width="${percentageWidth}"></div>
            </div>
            <div class="stat-value" data-target-value="${value}">0</div>
        </div>
    `;
}

/**
 * Animates a stat number counting up from 0 to its target value.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} duration
 */
function animateStatValue(el, target, duration = 900) {
    const startTime = performance.now();

    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic, matches the bar-fill's easing
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

/**
 * Builds a type badge matching the pastel palette used by the type icons,
 * instead of the old static typeBars/*.png images.
 * @param {string} type
 * @returns {string}
 */
function renderTypeBadge(type) {
    return `
        <span class="type-badge ${type.toLowerCase()}">
            <img src="typeIcons/${type}.png" alt="" class="type-badge-icon">
            ${type}
        </span>
    `;
}

function displaySelectedPokemon(formIndex = 0) {


    const pokemonNumber = getPokemonNumberFromURL();

    const availableForms = getPokemonFormsByNum(pokemonNumber);

    if (!availableForms || availableForms.length === 0) {
        console.error(`No Pokémon found for number: ${pokemonNumber}`);
        return;
    }

    const currentFormIndex = formIndex % availableForms.length;
    const selectedPokemon = availableForms[currentFormIndex];

    const isMega = selectedPokemon.num >= 3000


    document.body.classList.toggle("mega-pokemon", isMega);

    // --- Navigation Logic ---
    const currentSeqIndex = uniquePokedexNumbers.indexOf(pokemonNumber);
    const prevNum = uniquePokedexNumbers[currentSeqIndex - 1];
    const nextNum = uniquePokedexNumbers[currentSeqIndex + 1];

    const prevPokemon = prevNum ? pokemonNumMap.get(prevNum)[0] : null;
    const nextPokemon = nextNum ? pokemonNumMap.get(nextNum)[0] : null;

    // --- 1. TITLE FORMATTING (Yakoyza-Oni -> Yakoyza (Oni)) ---
    let displayName = selectedPokemon.name;
    if (displayName.includes("-") && !isMega) {
        const parts = displayName.split("-");
        // "Yakoyza" + " (" + "Oni" + ")"
        displayName = `${parts[0]} (${parts[1]})`;
    }

    // --- Set Page Title & Nav ---
    document.title = isMega ? displayName : `#${pokemonNumber - 1999} ${displayName}`;

    const navLabel = (p) => p?.num >= 3000
        ? {num: '', name: p.name}
        : {num: p ? `#${p.num - 1999}` : '', name: p ? p.name.split('-')[0] : ''};

    const prev = navLabel(prevPokemon);
    const next = navLabel(nextPokemon);
    document.getElementById("previousPokemonNumber").innerText = prev.num;
    document.getElementById("previousPokemonName").innerText = prev.name;
    document.getElementById("nextPokemonNumber").innerText = next.num;
    document.getElementById("nextPokemonName").innerText = next.name;

    document.querySelector(".arrow-left").classList.toggle("hidden", !prevPokemon);
    document.querySelector(".arrow-right").classList.toggle("hidden", !nextPokemon);


    // --- 2. IMAGE FILENAME FORMATTING (Yakoyza-Oni -> yakoyzaoni) ---
    // Convert to lowercase and remove hyphens/spaces
    const imageBaseName = selectedPokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const regularImage = `pokemonArt/${imageBaseName}.png`;
    const shinyImage = `pokemonArt/${imageBaseName}_shiny.png`;


    // Handle Types
    const type1 = selectedPokemon.types[0];
    const type2 = selectedPokemon.types[1];

    // Expose the current type(s) as CSS custom properties; styles.css owns the
    // actual gradient/overlay formulas that consume them.
    document.documentElement.style.setProperty('--type1-color', `var(--type-${type1.toLowerCase()})`);
    document.documentElement.style.setProperty('--type2-color', `var(--type-${(type2 || type1).toLowerCase()})`);

    // Handle Abilities
    const ability1 = selectedPokemon.abilities["0"];
    const ability2 = selectedPokemon.abilities["1"];
    const abilityh = selectedPokemon.abilities["H"];

    // Handle Signature Move
    const sigmove = selectedPokemon.signatureMove;
    const sigmovedesc = moves[sigmove] ? `
        ${moves[sigmove].type ? `<img src="typeIcons/${moves[sigmove].type}.png" class="sigmove-icon" alt="">` : ''}
        ${moves[sigmove].category ? `<img src="moveIcons/${moves[sigmove].category}.png" class="sigmove-icon" alt="">` : ''}
        ${moves[sigmove].power ? `Power: ${moves[sigmove].power},` : ''}
        ${moves[sigmove].accuracy ? `Accuracy: ${moves[sigmove].accuracy},` : ''}
        ${moves[sigmove].pp ? `${moves[sigmove].pp} PP<br><br>` : ''}
        ${moves[sigmove].description || ''}
    ` : '';


    // --- Render to DOM ---

    document.getElementById("pokemonTitleTypeContainer").innerHTML = `
        <div class="title-type-container">
            <h2>${document.title}</h2>
            <span class="type-stack">
                ${renderTypeBadge(type1)}
                ${type2 ? renderTypeBadge(type2) : ""}
            </span>
        </div>
        <p class="pokemon-title">The ${selectedPokemon.kind} Pokémon</p>
        <div id="formSwitchContainer" class="form-switch-container"></div>
    `;

    document.getElementById("pokemonCardLeft").innerHTML = `
        <div class="pokemon-images-container">
            <div class="circle-background">
                <img src="${regularImage}" class="pokemon-image-large" id="pokemonMainImage" alt=""/>
            </div>
            <button class="card-shiny-toggle" id="cardShinyToggle" title="Toggle Shiny" aria-label="Toggle shiny form" aria-pressed="false">
                <svg class="sparkle-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                    <!-- large sparkle -->
                    <path d="M10 5 L11.8 12.2 L19 14 L11.8 15.8 L10 23 L8.2 15.8 L1 14 L8.2 12.2 Z"/>
                    <!-- small sparkle offset top-right -->
                    <path d="M20 2 L20.7 4.3 L23 5 L20.7 5.7 L20 8 L19.3 5.7 L17 5 L19.3 4.3 Z"/>
                </svg>
            </button>
        </div>
        <div class="pokemon-description">
            <p>${selectedPokemon.description ? selectedPokemon.description[0] : "No description available."}<br><br>
            ${selectedPokemon.description && selectedPokemon.description[1] ? selectedPokemon.description[1] : ""}</p>
        </div>
    `;

    // Shiny Toggle Logic
    const mainImage = document.getElementById("pokemonMainImage");
    const shinyBtn = document.getElementById("cardShinyToggle");
    let isShiny = false;

    if (mainImage && shinyBtn) {
        shinyBtn.addEventListener('click', () => {
            isShiny = !isShiny;
            mainImage.src = isShiny ? shinyImage : regularImage;
            shinyBtn.classList.toggle('shiny-active', isShiny);
            shinyBtn.setAttribute('aria-pressed', String(isShiny));
        });
    }

    document.getElementById("pokemonCardRight").innerHTML = `
        <div class="pokemon-measurements">
            ${selectedPokemon.heightm != null ? `<span class="measurement-pill">📏 ${selectedPokemon.heightm} m</span>` : ''}
            ${selectedPokemon.weightkg != null ? `<span class="measurement-pill">⚖️ ${selectedPokemon.weightkg} kg</span>` : ''}
        </div>
        <div class="pokemon-stats">
            ${displayStatBar("HP", selectedPokemon.baseStats.hp, "hp")}
            ${displayStatBar("Atk", selectedPokemon.baseStats.atk, "atk")}
            ${displayStatBar("Def", selectedPokemon.baseStats.def, "def")}
            ${displayStatBar("Sp.Atk", selectedPokemon.baseStats.spa, "spa")}
            ${displayStatBar("Sp.Def", selectedPokemon.baseStats.spd, "spd")}
            ${displayStatBar("Speed", selectedPokemon.baseStats.spe, "spe")}
            ${displayStatBar("BST",
        Object.values(selectedPokemon.baseStats).reduce((a, b) => a + b, 0),
        "bst", true
    )}
        </div>
        <div class="pokemon-abilities">
            <div class="ability-list">
                ${[ability1, ability2, abilityh].filter(Boolean).map(a => {
        const isAndela = abilities[a]?.tag === 'andela' || abilities[a]?.tag === 'mega';
        return `
                    <div class="pokemon-ability${isAndela ? ' andela-ability' : ''}" tabindex="0">
                        ${a}
                        <span class="ability-description-popup">
                            ${typeof abilities[a] === 'object' ? abilities[a].description : (abilities[a] || "No Description")}
                        </span>
                    </div>`;
    }).join('')}
            </div>
        </div>
        ${sigmove ? `<p class="pokemon-sigmove">Signature Move: ${sigmove}<br><span class="pokemon-sigmove-description">${sigmovedesc}</span></p>` : ''}
    `;

    // Animate stat bars and their numbers after DOM insertion
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.querySelectorAll('.bar-fill').forEach(bar => {
                const target = bar.dataset.targetWidth;
                if (target != null) bar.style.width = `${target}%`;
            });
            document.querySelectorAll('.stat-value').forEach(valueEl => {
                const target = parseInt(valueEl.dataset.targetValue, 10);
                if (!isNaN(target)) animateStatValue(valueEl, target);
            });
        }, 60);
    });


    // --- Form Switch Button ---
    const formSwitchContainer = document.getElementById("formSwitchContainer");
    formSwitchContainer.innerHTML = "";

    if (availableForms.length > 1) {
        const changeFormButton = document.createElement("button");
        changeFormButton.innerText = "Change\nForm";
        changeFormButton.classList.add("form-switch-button");

        changeFormButton.onclick = () => {
            displaySelectedPokemon(currentFormIndex + 1);
        };

        formSwitchContainer.appendChild(changeFormButton);
    }
}


/**
 * Fades the card content out, runs renderFn (which is expected to update
 * the DOM), then fades the new content back in.
 * @param {Function} renderFn
 */
function transitionCardContent(renderFn) {
    const targets = [
        document.getElementById("pokemonTitleTypeContainer"),
        document.getElementById("pokemonCardContainer")
    ];
    targets.forEach(el => el.classList.add("card-transitioning"));
    setTimeout(() => {
        renderFn();
        targets.forEach(el => el.classList.remove("card-transitioning"));
    }, 180);
}

function navigatePokemon(direction) {
    const currentNumber = getPokemonNumberFromURL();
    const currentSeqIndex = uniquePokedexNumbers.indexOf(currentNumber);

    if (currentSeqIndex === -1) return;

    const newIndex = direction === "next" ? currentSeqIndex + 1 : currentSeqIndex - 1;

    if (newIndex >= 0 && newIndex < uniquePokedexNumbers.length) {
        const newNumber = uniquePokedexNumbers[newIndex];
        transitionCardContent(() => {
            history.pushState({}, "", `cardPage.html?pokemonNumber=${newNumber}`);
            displaySelectedPokemon(0);
        });
    }
}

window.navigatePokemon = navigatePokemon;
window.addEventListener("popstate", () => {
    transitionCardContent(() => displaySelectedPokemon(0));
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') navigatePokemon('previous');
    if (event.key === 'ArrowRight') navigatePokemon('next');
});

document.addEventListener('DOMContentLoaded', () => {
    setDarkModeFromStorage('.toggle-dark-mode-card');

    // Popup Logic — reposition only; show/hide handled by CSS transitions
    document.querySelectorAll('.pokemon-ability').forEach(abilityEl => {
        abilityEl.addEventListener('mouseenter', handleAbilityPopupPosition);
        abilityEl.addEventListener('focus', handleAbilityPopupPosition);
        abilityEl.addEventListener('mouseleave', removeAbilityPopupLeftClass);
        abilityEl.addEventListener('blur', removeAbilityPopupLeftClass);
    });

    function handleAbilityPopupPosition(e) {
        const popup = e.currentTarget.querySelector('.ability-description-popup');
        if (!popup) return;
        popup.classList.remove('left');
        // Briefly make visible to measure, then revert to CSS control
        popup.style.visibility = 'visible';
        popup.style.opacity = '1';
        const rect = popup.getBoundingClientRect();
        popup.style.visibility = '';
        popup.style.opacity = '';
        if (rect.right > window.innerWidth || rect.left < 0) {
            popup.classList.add('left');
        }
    }

    function removeAbilityPopupLeftClass(e) {
        const popup = e.currentTarget.querySelector('.ability-description-popup');
        if (popup) popup.classList.remove('left');
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(err => console.warn('SW registration failed:', err));
    });
}

displaySelectedPokemon();
