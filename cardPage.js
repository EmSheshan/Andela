// cardPage.js
import { abilities } from "./data/abilities.js";
import { moves } from "./data/moves.js";
import { loadDex } from "./pokeData.js";
import { region } from "./data/region.js";

// Base tab title from the region name; displaySelectedPokemon overrides it with
// the current Pokémon's name once data loads.
document.title = `${region.name} Pokédex`;

// speciesId -> array of forme objects (base forme first). A single-forme
// Pokémon has a one-element array; Sedimental has [Dormant, Bloom], etc.
const speciesForms = new Map();
// speciesId in dex order (main dex first, then Megas). Drives prev/next nav.
const speciesOrder = [];
// id -> entry, across ALL dexes (main, mega, canon). Used to resolve the
// members of an evolution tree, which may include canon reference Pokémon.
const byId = new Map();
// prevo id -> array of entries that list it as their prevo. Lets an evolution
// link be declared from either side: a parent's `evo` OR a child's `prevo`.
const prevoChildren = new Map();

function indexDex(dex) {
  for (const entry of Object.values(dex)) {
    if (!speciesForms.has(entry.speciesId)) {
      speciesForms.set(entry.speciesId, []);
      speciesOrder.push(entry.speciesId);
    }
    speciesForms.get(entry.speciesId).push(entry);
  }
}

function indexLookup(dex) {
  for (const entry of Object.values(dex)) byId.set(entry.id, entry);
}

// Build the prevo -> children index. Call once after every dex is in byId.
function buildReverseEvo() {
  prevoChildren.clear();
  for (const entry of byId.values()) {
    if (!entry.prevo) continue;
    if (!prevoChildren.has(entry.prevo)) prevoChildren.set(entry.prevo, []);
    prevoChildren.get(entry.prevo).push(entry);
  }
}

// --- Data Access ---

function getSpeciesIdFromURL() {
  return new URLSearchParams(window.location.search).get("pokemon");
}

function getFormsBySpecies(speciesId) {
  return speciesForms.get(speciesId);
}

// --- Display Logic ---

function displayStatBar(stat, value, statKey, BST = false) {
  let maxStatValue = 180;
  if (BST) maxStatValue = 700;
  const percentageWidth = (value / maxStatValue) * 100;
  const bstClass = BST ? " bst-row" : "";

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

// --- Evolution Tree ---

// Walk prevo links up to the family's first member. Guards against a bad/cyclic
// chain so a typo in the CSV can't spin forever.
function evolutionRoot(id) {
  let cur = byId.get(id);
  const seen = new Set();
  while (cur && cur.prevo && byId.has(cur.prevo) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.prevo);
  }
  return cur;
}

// The evolutions of an entry: its own `evo` list plus any mon that names it as
// their `prevo` (deduped, preserving evo-first order). This is what lets a split
// work even if only one side of each link is filled in.
function evoChildren(entry) {
  const ids = [...(entry.evo || [])];
  for (const child of prevoChildren.get(entry.id) || []) {
    if (!ids.includes(child.id)) ids.push(child.id);
  }
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

// Count members reachable from a root via evolution links (root included).
function familySize(root) {
  const seen = new Set();
  (function walk(entry) {
    if (!entry || seen.has(entry.id)) return;
    seen.add(entry.id);
    evoChildren(entry).forEach(walk);
  })(root);
  return seen.size;
}

function evoNodeHTML(entry, currentId) {
  const isCurrent = entry.id === currentId;
  const name = (entry.name || entry.id).split("-")[0];
  const type1 = entry.types && entry.types[0];
  const style = type1
    ? `style="--evo-type: var(--type-${type1.toLowerCase()})"`
    : "";
  const inner = `
        <span class="evo-node-frame"><span class="evo-node-art"><img src="data/pokemonArt/${entry.id}.png" alt="${name}" loading="lazy"></span></span>
        <span class="evo-node-name">${name}</span>
        ${""}`;
  const cls = `evo-node${isCurrent ? " evo-node-current" : ""}${entry.isExternal ? " evo-node-external" : ""}`;
  // Canon reference mons have no card of their own, and the current mon is
  // already on screen — render those as plain nodes; everything else links.
  return isCurrent || entry.isExternal
    ? `<div class="${cls}" ${style} aria-current="${isCurrent ? "page" : "false"}">${inner}</div>`
    : `<a class="${cls}" ${style} href="cardPage.html?pokemon=${entry.speciesId}">${inner}</a>`;
}

// Render an entry and its evolutions. Split evos stack as separate branches.
// `seen` guards against cycles / re-rendering an ancestor if the CSV links back.
function familyHTML(entry, currentId, seen = new Set()) {
  seen.add(entry.id);
  const kids = evoChildren(entry).filter((child) => !seen.has(child.id));
  kids.forEach((child) => seen.add(child.id));
  const children = kids
    .map(
      (child) => `
        <div class="evo-step">
            <span class="evo-arrow" aria-hidden="true">
                ${child.evoMethod ? `<span class="evo-method">${child.evoMethod}</span>` : ""}
                <svg viewBox="0 -960 960 960" fill="currentColor"><path d="M615.91-427H140.78v-106h475.13L404.35-744.57 480-819.22 819.22-480 480-140.78l-75.65-74.65L615.91-427Z"/></svg>
            </span>
            ${familyHTML(child, currentId, seen)}
        </div>`,
    )
    .join("");
  return `
        <div class="evo-branch">
            ${evoNodeHTML(entry, currentId)}
            ${kids.length ? `<div class="evo-children">${children}</div>` : ""}
        </div>`;
}

function renderEvolutionTree(selectedPokemon) {
  const container = document.getElementById("evolutionContainer");
  if (!container) return;

  const root = evolutionRoot(selectedPokemon.speciesId);
  const currentId = selectedPokemon.speciesId;

  if (!root) {
    container.innerHTML = "";
    container.classList.add("hidden");
    return;
  }

  // Megas / Xenos are a temporary form change, not an evolution — so just show
  // a picture of the original ("og") Pokémon, with no arrow and no chip for the
  // Mega itself. `root` is that base (prevo climbed to the top of the chain).
  if (selectedPokemon.isMega) {
    if (root.id === selectedPokemon.speciesId) {
      // no base linked — nothing to show
      container.innerHTML = "";
      container.classList.add("hidden");
      return;
    }
    container.classList.remove("hidden");
    container.innerHTML = `
            <h3 class="evolution-heading">Base Form</h3>
            <div class="evo-solo">${evoNodeHTML(root, null)}</div>`;
    return;
  }

  if (familySize(root) < 2) {
    // Single-stage Pokémon: show the chip with a "does not evolve" note
    // rather than hiding, so every regular card has an Evolution panel.
    container.classList.remove("hidden");
    container.innerHTML = `
            <h3 class="evolution-heading">Evolution</h3>
            <div class="evo-solo">
                ${familyHTML(root, currentId)}
                <p class="evo-none">Does not evolve</p>
            </div>`;
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = `
        <h3 class="evolution-heading">Evolution</h3>
        <div class="evo-tree">${familyHTML(root, currentId)}</div>`;
}

function displaySelectedPokemon(formIndex = 0) {
  const speciesId = getSpeciesIdFromURL();

  const availableForms = getFormsBySpecies(speciesId);

  if (!availableForms || availableForms.length === 0) {
    console.error(`No Pokémon found for: ${speciesId}`);
    return;
  }

  const currentFormIndex = formIndex % availableForms.length;
  const selectedPokemon = availableForms[currentFormIndex];

  const isMega = selectedPokemon.isMega;

  document.body.classList.toggle("mega-pokemon", isMega);

  // --- Navigation Logic ---
  const currentSeqIndex = speciesOrder.indexOf(speciesId);
  const prevId = speciesOrder[currentSeqIndex - 1];
  const nextId = speciesOrder[currentSeqIndex + 1];

  const prevPokemon = prevId ? speciesForms.get(prevId)[0] : null;
  const nextPokemon = nextId ? speciesForms.get(nextId)[0] : null;

  // --- 1. TITLE FORMATTING (Yakoyza-Oni -> Yakoyza (Oni)) ---
  let displayName = selectedPokemon.name;
  if (displayName.includes("-") && !isMega) {
    const parts = displayName.split("-");
    // "Yakoyza" + " (" + "Oni" + ")"
    displayName = `${parts[0]} (${parts[1]})`;
  }

  // --- Set Page Title & Nav ---
  const dexLabel = isMega
    ? ""
    : `Nº ${String(selectedPokemon.num).padStart(3, "0")}`;
  document.title = isMega ? displayName : `${dexLabel} · ${displayName}`;
  const titleHtml = isMega
    ? displayName
    : `<span class="dex-num">${dexLabel}</span> ${displayName}`;

  const navLabel = (p) =>
    p?.isMega
      ? { num: "", name: p.name }
      : { num: p ? `#${p.num}` : "", name: p ? p.name.split("-")[0] : "" };

  const prev = navLabel(prevPokemon);
  const next = navLabel(nextPokemon);
  document.getElementById("previousPokemonNumber").innerText = prev.num;
  document.getElementById("previousPokemonName").innerText = prev.name;
  document.getElementById("nextPokemonNumber").innerText = next.num;
  document.getElementById("nextPokemonName").innerText = next.name;

  document
    .querySelector(".arrow-left")
    .classList.toggle("hidden", !prevPokemon);
  document
    .querySelector(".arrow-right")
    .classList.toggle("hidden", !nextPokemon);

  // --- 2. IMAGE FILENAME FORMATTING (Yakoyza-Oni -> yakoyzaoni) ---
  // Convert to lowercase and remove hyphens/spaces
  const imageBaseName = selectedPokemon.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const regularImage = `data/pokemonArt/${imageBaseName}.png`;
  const shinyImage = `data/pokemonArt/${imageBaseName}_shiny.png`;

  // Handle Types
  const type1 = selectedPokemon.types[0];
  const type2 = selectedPokemon.types[1];

  // Expose the current type(s) as CSS custom properties; styles.css owns the
  // actual gradient/overlay formulas that consume them.
  document.documentElement.style.setProperty(
    "--type1-color",
    `var(--type-${type1.toLowerCase()})`,
  );
  document.documentElement.style.setProperty(
    "--type2-color",
    `var(--type-${(type2 || type1).toLowerCase()})`,
  );

  // Handle Abilities
  const ability1 = selectedPokemon.abilities["0"];
  const ability2 = selectedPokemon.abilities["1"];
  const abilityh = selectedPokemon.abilities["H"];

  // Handle Signature Move
  const sigmove = selectedPokemon.signatureMove;
  const sigmovedesc = moves[sigmove]
    ? `
        ${moves[sigmove].type ? `<img src="typeIcons/${moves[sigmove].type}.png" class="sigmove-icon" alt="">` : ""}
        ${moves[sigmove].category ? `<img src="moveIcons/${moves[sigmove].category}.png" class="sigmove-icon" alt="">` : ""}
        ${moves[sigmove].power ? `Power: ${moves[sigmove].power},` : ""}
        ${moves[sigmove].accuracy ? `Accuracy: ${moves[sigmove].accuracy},` : ""}
        ${moves[sigmove].pp ? `${moves[sigmove].pp} PP<br><br>` : ""}
        ${moves[sigmove].description || ""}
    `
    : "";

  // --- Render to DOM ---

  document.getElementById("pokemonTitleTypeContainer").innerHTML = `
        <div class="title-type-container">
            <h2>${titleHtml}</h2>
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
                <img src="${regularImage}" class="pokemon-image-large" id="pokemonMainImage" alt="" fetchpriority="high"/>
            </div>
            <button class="card-shiny-toggle" id="cardShinyToggle" title="Toggle Shiny" aria-label="Toggle shiny form" aria-pressed="false">
                <svg class="sparkle-icon" viewBox="0 -960 960 960" fill="currentColor"><path d="m761.13-583.61-55.65-121.3L584.17-760l121.31-55.09 55.65-121.3 55.09 121.3L937.52-760l-121.3 55.09-55.09 121.3Zm0 560-55.65-121.3L584.17-200l121.31-55.09 55.65-121.3 55.09 121.3L937.52-200l-121.3 55.09-55.09 121.3ZM363.39-139.09 256.61-373.22 22.48-480l234.13-106.78 106.78-234.13 106.78 234.13L704.31-480 470.17-373.22 363.39-139.09Zm0-214.91 40-86 86-40-86-40-40-86-40 86-86 40 86 40 40 86Zm0-126Z"/></svg>
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
    shinyBtn.addEventListener("click", () => {
      isShiny = !isShiny;
      mainImage.src = isShiny ? shinyImage : regularImage;
      shinyBtn.classList.toggle("shiny-active", isShiny);
      shinyBtn.setAttribute("aria-pressed", String(isShiny));
    });
  }

  document.getElementById("pokemonCardRight").innerHTML = `
        <div class="pokemon-measurements">
            ${selectedPokemon.heightm != null ? `<span class="measurement-pill"><svg class="measure-icon" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M480-100.78 290.61-290.17l74.09-74.66 62.3 61.31v-353.52l-62.3 62.43-74.66-74.65L480-859.22l189.96 189.96-74.66 74.52-62.3-61.74v352.96l62.87-61.31 74.09 74.09L480-100.78Z"/></svg>${selectedPokemon.heightm} m</span>` : ""}
            ${selectedPokemon.weightkg != null ? `<span class="measurement-pill"><svg class="measure-icon" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M256.96-214.7h446.08L650-585.3H310l-53.04 370.6ZM480-691.3q14.74 0 24.54-10.09 9.81-10.09 9.81-24.26 0-14.74-9.81-24.55-9.8-9.8-24.54-9.8-14.17 0-24.26 9.8-10.09 9.81-10.09 24.55 0 14.17 10.09 24.26Q465.83-691.3 480-691.3ZM135-108.7l82.83-582.6h132.21q-2.43-8.87-3.58-16.96-1.16-8.09-1.16-17.39 0-55.65 39.53-95.18 39.52-39.52 95.17-39.52t95.17 39.52q39.53 39.53 39.53 95.18 0 9.3-1.16 17.39-1.15 8.09-3.58 16.96h132.21L825-108.7H135Zm121.96-106h446.08-446.08Z"/></svg>${selectedPokemon.weightkg} kg</span>` : ""}
        </div>
        <div class="pokemon-stats">
            ${displayStatBar("HP", selectedPokemon.baseStats.hp, "hp")}
            ${displayStatBar("Atk", selectedPokemon.baseStats.atk, "atk")}
            ${displayStatBar("Def", selectedPokemon.baseStats.def, "def")}
            ${displayStatBar("Sp.Atk", selectedPokemon.baseStats.spa, "spa")}
            ${displayStatBar("Sp.Def", selectedPokemon.baseStats.spd, "spd")}
            ${displayStatBar("Speed", selectedPokemon.baseStats.spe, "spe")}
            ${displayStatBar(
              "BST",
              Object.values(selectedPokemon.baseStats).reduce(
                (a, b) => a + b,
                0,
              ),
              "bst",
              true,
            )}
        </div>
        <div class="pokemon-abilities">
            <div class="ability-list">
                ${[ability1, ability2, abilityh]
                  .filter(Boolean)
                  .map((a) => {
                    const isAndela =
                      abilities[a]?.tag === "andela" ||
                      abilities[a]?.tag === "mega";
                    return `
                    <div class="pokemon-ability${isAndela ? " andela-ability" : ""}" tabindex="0">
                        ${a}
                        <span class="ability-description-popup">
                            ${typeof abilities[a] === "object" ? abilities[a].description : abilities[a] || "No Description"}
                        </span>
                    </div>`;
                  })
                  .join("")}
            </div>
        </div>
        ${sigmove ? `<p class="pokemon-sigmove">Signature Move: ${sigmove}<br><span class="pokemon-sigmove-description">${sigmovedesc}</span></p>` : ""}
        <section id="evolutionContainer" class="evolution-section hidden"></section>
    `;

  // Animate stat bars and their numbers after DOM insertion (skip the
  // number count-up for anyone who prefers reduced motion; the bar widths
  // snap instantly via the reduced-motion CSS).
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll(".bar-fill").forEach((bar) => {
        const target = bar.dataset.targetWidth;
        if (target != null) bar.style.width = `${target}%`;
      });
      document.querySelectorAll(".stat-value").forEach((valueEl) => {
        const target = parseInt(valueEl.dataset.targetValue, 10);
        if (isNaN(target)) return;
        if (reduceMotion) valueEl.textContent = target;
        else animateStatValue(valueEl, target);
      });
    }, 60);
  });

  // --- Evolution Tree ---
  renderEvolutionTree(selectedPokemon);

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
    document.getElementById("pokemonCardContainer"),
  ];
  targets.forEach((el) => el.classList.add("card-transitioning"));
  setTimeout(() => {
    renderFn();
    targets.forEach((el) => el.classList.remove("card-transitioning"));
  }, 180);
}

function navigatePokemon(direction) {
  const currentId = getSpeciesIdFromURL();
  const currentSeqIndex = speciesOrder.indexOf(currentId);

  if (currentSeqIndex === -1) return;

  const newIndex =
    direction === "next" ? currentSeqIndex + 1 : currentSeqIndex - 1;

  if (newIndex >= 0 && newIndex < speciesOrder.length) {
    const newId = speciesOrder[newIndex];
    transitionCardContent(() => {
      history.pushState({}, "", `cardPage.html?pokemon=${newId}`);
      displaySelectedPokemon(0);
    });
  }
}

window.navigatePokemon = navigatePokemon;
window.addEventListener("popstate", () => {
  transitionCardContent(() => displaySelectedPokemon(0));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") navigatePokemon("previous");
  if (event.key === "ArrowRight") navigatePokemon("next");
});

document.addEventListener("DOMContentLoaded", () => {
  setDarkModeFromStorage(".toggle-dark-mode-card");
});

// Ability popup positioning.
// Phones & tablets (<=1024px): CSS drops the popup below the ability, so there's
// nothing to compute here. Desktop: the popup opens to the side, so flip it to
// the other side if it would run off-screen. Delegated on `document` (rather
// than bound per-element) so it keeps working after the ability list is
// re-rendered when navigating between Pokémon.
function positionAbilityPopup(abilityEl) {
  const popup = abilityEl.querySelector(".ability-description-popup");
  if (!popup) return;
  popup.classList.remove("left");
  if (window.matchMedia("(max-width: 1024px)").matches) return;
  // Briefly reveal to measure, then hand positioning back to CSS.
  popup.style.visibility = "visible";
  popup.style.opacity = "1";
  const rect = popup.getBoundingClientRect();
  popup.style.visibility = "";
  popup.style.opacity = "";
  if (rect.right > window.innerWidth || rect.left < 0)
    popup.classList.add("left");
}

// mouseover with a relatedTarget check behaves like a delegated mouseenter
// (fires once per entry, not on every move within the ability).
document.addEventListener("mouseover", (e) => {
  const a = e.target.closest && e.target.closest(".pokemon-ability");
  if (a && !a.contains(e.relatedTarget)) positionAbilityPopup(a);
});
document.addEventListener("focusin", (e) => {
  const a = e.target.closest && e.target.closest(".pokemon-ability");
  if (a) positionAbilityPopup(a);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((err) => console.warn("SW registration failed:", err));
  });
}

loadDex()
  .then(({ pokedex, megadex, canondex }) => {
    indexDex(pokedex);
    indexDex(megadex);
    indexLookup(pokedex);
    indexLookup(megadex);
    indexLookup(canondex);
    buildReverseEvo();
    displaySelectedPokemon();
  })
  .catch((err) => console.error("Failed to load Pokédex data:", err));
