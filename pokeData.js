// pokeData.js — single source of truth for loading the Pokédex.
//
// The dex lives in two plain CSV files (in the data/ folder) so anyone can edit
// it in a spreadsheet (Excel, Google Sheets, …) without touching JavaScript:
//   • data/pokedex.csv — the main dex. Each row is one Pokémon (or an extra forme).
//   • data/megadex.csv — Megas / Xenos, shown in their own grid with no dex number.
//
// Dex numbers are NOT stored in the CSV — they're assigned automatically from
// row order (the first Pokémon is Nº 001, the next 002, and so on). To add a
// Pokémon, just add a row; to reorder the dex, move the row. Nothing else to
// renumber.
//
// Formes (e.g. Sedimental-Dormant / Sedimental-Bloom) are consecutive rows that
// share one dex number: the base forme leaves the `forme` column blank, and each
// extra forme fills it in (e.g. "Bloom"). An extra-forme row does NOT consume a
// new number — it groups onto the row above it and appears via the card's
// "Change Form" button.
//
// Columns (order doesn't matter; the header row names them):
//   id            slug — also the art filename (data/pokemonArt/<id>.png) and the URL
//                 (cardPage.html?pokemon=<id>). Lowercase, no spaces.
//   name          display name, e.g. "Sedimental-Dormant"
//   forme         blank for a base Pokémon; a label (e.g. "Bloom") for an extra forme
//   type1, type2  types (leave type2 blank for single-type)
//   hp…spe        the six base stats
//   ability0, ability1, abilityH   abilities (ability1 / abilityH optional)
//   kind          the "kind" line, e.g. "Seed" → "The Seed Pokémon"
//   heightm, weightkg
//   signatureMove name of the signature move (optional; must exist in moves.js)
//   description1, description2      two Pokédex paragraphs
//   prevo         id this Pokémon evolves FROM (optional)
//   evo           id(s) it evolves INTO — comma-separated for split evolutions
//   evoMethod     how it evolves from its prevo, e.g. "Level 16" or "Fire Stone".
//                 Stored on the child so each branch of a split evo can differ.
//
// Evolution trees may reference canon Pokémon (e.g. Amistaphore evolves from the
// canon Shiinotic). Those live in data/canondex.csv — same columns, but they get
// no dex number and no grid tile; they exist only to complete a family tree. Put
// their artwork in data/pokemonArt/<id>.png like any other Pokémon. canondex.csv is
// optional — if it's absent, trees just render the custom Pokémon they contain.

// Everything region-specific (the CSVs, abilities.js, moves.js, and pokemonArt/)
// lives in this folder, so making a new region only means editing what's inside.
const DATA_DIR = "data/";

/**
 * Parse CSV text into an array of row objects keyed by the header row.
 * Handles quoted fields, escaped quotes (""), commas and newlines inside
 * quotes, and both \n and \r\n line endings (RFC-4180 style).
 * @param {string} text
 * @returns {Array<Object<string,string>>}
 */
export function parseCSV(text) {
  const rows = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    rows.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } // escaped quote
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      endField();
    } else if (c === "\n") {
      endRecord();
    } else if (c !== "\r") {
      field += c;
    }
  }
  // Flush a final record that isn't newline-terminated.
  if (field !== "" || record.length > 0) endRecord();

  const header = rows.shift() || [];
  return (
    rows
      // Skip blank lines (e.g. a trailing newline at end of file).
      .filter((r) => r.some((v) => v.trim() !== ""))
      .map((r) =>
        Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])),
      )
  );
}

/** Parse a numeric cell, treating blanks as null. */
function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Turn one CSV row into a Pokémon object in the shape the app renders. */
function parseRow(row) {
  return {
    id: row.id,
    name: row.name,
    forme: row.forme || null,
    types: [row.type1, row.type2].filter(Boolean),
    baseStats: {
      hp: num(row.hp),
      atk: num(row.atk),
      def: num(row.def),
      spa: num(row.spa),
      spd: num(row.spd),
      spe: num(row.spe),
    },
    abilities: {
      0: row.ability0,
      ...(row.ability1 ? { 1: row.ability1 } : {}),
      ...(row.abilityH ? { H: row.abilityH } : {}),
    },
    kind: row.kind,
    heightm: num(row.heightm),
    weightkg: num(row.weightkg),
    signatureMove: row.signatureMove || null,
    description: [row.description1, row.description2].filter(Boolean),
    prevo: row.prevo || null,
    evo: row.evo
      ? row.evo
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    evoMethod: row.evoMethod || null,
  };
}

/**
 * Build a dex object (keyed by id) from parsed CSV rows, assigning each a dex
 * number from row order. Extra-forme rows (a non-empty `forme`) share the number
 * of the base forme above them instead of consuming a new one.
 *
 * Each entry gains:
 *   num         dex number (1-based) — null for Megas and canon (they show none)
 *   speciesId   id of the base forme this row belongs to (its own id if a base)
 *   isForme     true for an extra forme
 *   isMega      true for entries from megadex.csv
 *   isExternal  true for canon reference entries (canondex.csv) — no number, no tile
 *
 * @param {Array<Object>} rows
 * @param {{mega?: boolean, external?: boolean}} [opts]
 * @returns {Object<string, Object>}
 */
export function buildDex(rows, { mega = false, external = false } = {}) {
  const dex = {};
  let counter = 0;
  let speciesId = null;

  for (const row of rows) {
    const entry = parseRow(row);
    const isForme =
      !mega && !external && !!(row.forme && row.forme.trim() !== "");

    if (external) {
      entry.num = null;
      entry.speciesId = entry.id;
    } else if (isForme) {
      entry.num = counter;
      entry.speciesId = speciesId;
    } else {
      counter += 1;
      entry.num = mega ? null : counter;
      speciesId = entry.id;
      entry.speciesId = entry.id;
    }
    entry.isForme = isForme;
    entry.isMega = mega;
    entry.isExternal = external;
    dex[entry.id] = entry;
  }
  return dex;
}

async function fetchDex(url, opts) {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  return buildDex(parseCSV(await res.text()), opts);
}

// Like fetchDex, but a missing/unreadable file yields an empty dex instead of
// throwing — used for canondex.csv, which is optional.
async function fetchDexOptional(url, opts) {
  try {
    const res = await fetch(url);
    if (!res.ok) return {};
    return buildDex(parseCSV(await res.text()), opts);
  } catch {
    return {};
  }
}

/**
 * Load the dex files. Returns { pokedex, megadex, canondex }, each an object
 * keyed by id with dex numbers already assigned. Insertion order matches CSV
 * row order. canondex holds canon reference Pokémon used only in evolution
 * trees, and is empty if canondex.csv is absent.
 * @returns {Promise<{pokedex: Object, megadex: Object, canondex: Object}>}
 */
export async function loadDex() {
  const [pokedex, megadex, canondex] = await Promise.all([
    fetchDex(`${DATA_DIR}pokedex.csv`, { mega: false }),
    fetchDex(`${DATA_DIR}megadex.csv`, { mega: true }),
    fetchDexOptional(`${DATA_DIR}canondex.csv`, { external: true }),
  ]);
  return { pokedex, megadex, canondex };
}
