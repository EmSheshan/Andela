// sharableImageGenerator.js — batch-generates a 3-page shareable image set for
// every Pokémon, styled after the site (Chile/Andela region card UI).
//
//   node sharableImageGenerator.js            → generate for every mon
//   node sharableImageGenerator.js grismirk   → generate just one (by id)
//
// Each mon gets three 1080×1080 PNGs in sharablePokemonArt/:
//   <id>-1-art.png     the main artwork, in the type-tinted ring + title/types
//   <id>-2-dex.png     the shiny artwork + the Pokédex description
//   <id>-3-stats.png   base stats, abilities, signature move, and the evo line
//
// Data comes straight from the same CSVs the site reads (data/*.csv), so the
// output stays in sync with the dex automatically.

import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import { parseCSV, buildDex } from "./pokeData.js";
import { region } from "./data/region.js";
import { moves } from "./data/moves.js";
import { abilities } from "./data/abilities.js";

const BASE = path.resolve();
const ART_DIR = path.join(BASE, "data", "pokemonArt");
const TYPE_ICON_DIR = path.join(BASE, "typeIcons");
const MOVE_ICON_DIR = path.join(BASE, "moveIcons");
const OUT_DIR = path.join(BASE, "sharablePokemonArt");
const FONT_DIR = path.join(BASE, "assets", "fonts-ttf");

// --- Fonts -----------------------------------------------------------------
// The site uses Syne (display) + DM Sans (body). node-canvas needs static TTFs
// (see assets/fonts-ttf/). Register under non-colliding alias families: keying
// on a font's real name makes node-canvas honor its embedded weight/style and
// reject our requests, so we alias instead. Syne (display) and DM Sans italic
// (the subtitle) load this way; DM Sans upright won't load in node-canvas from
// any source, so body copy uses the platform's neutral sans — close enough.
registerFont(path.join(FONT_DIR, "Syne-Bold.ttf"), { family: "SyneDisplay" });
registerFont(path.join(FONT_DIR, "DMSans-400italic.ttf"), {
  family: "DMSansItalic",
});

const SYNE = (px) => `${px}px "SyneDisplay"`;
const BODY = (px) => `${px}px "DejaVu Sans", sans-serif`;
const BODY_ITALIC = (px) => `${px}px "DMSansItalic"`;

// --- Theme (light, from styles.css :root) ----------------------------------
const C = {
  bg1: "#e8ebd9",
  bg2: "#d7dcc6",
  bg3: "#f5f4e9",
  accent1: "#c5542e", // terracotta
  accent2: "#cf9622", // gold
  accent5: "#2c7d54", // emerald
  accent6: "#1b3324",
  mainText: "#23291c",
  secondText: "#316b4c",
  shadow: "rgba(28,20,10,0.24)",
};

const TYPE_COLORS = {
  Normal: "#cdc9c4",
  Grass: "#83c18b",
  Fire: "#ed8163",
  Water: "#7acde5",
  Electric: "#ede263",
  Ice: "#9bded5",
  Fighting: "#d59d9b",
  Poison: "#bc8dc4",
  Ground: "#ddbd8b",
  Flying: "#acc5ee",
  Psychic: "#f591ac",
  Bug: "#bcd15a",
  Rock: "#cd956b",
  Ghost: "#a4a9dd",
  Dragon: "#7ab1e5",
  Dark: "#a4a9ac",
  Steel: "#acc1bc",
  Fairy: "#f5b5ee",
};

// Per-stat fill colors (styles.css .bar-fill.<stat>).
const STAT_FILL = {
  hp: "#ef5a52",
  atk: "#f0a35a",
  def: "#f2ce56",
  spa: "#7fa8e6",
  spd: "#8bcf7a",
  spe: "#ef86a6",
  bst: "#ca72f2",
};

const SIZE = 1080;
const PAD = 72;

// --- Small color helpers ---------------------------------------------------
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
// color-mix(in srgb, a pct%, b) — linear mix in sRGB space.
function mix(hexA, hexB, pctA) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = pctA / 100;
  const c = (x, y) => Math.round(x * t + y * (1 - t));
  return `rgb(${c(a.r, b.r)},${c(a.g, b.g)},${c(a.b, b.b)})`;
}

// --- Dex + evolution index (mirrors cardPage.js) ---------------------------
const read = (f) => fs.readFileSync(path.join(BASE, "data", f), "utf8");
const pokedex = buildDex(parseCSV(read("pokedex.csv")), { mega: false });
const megadex = buildDex(parseCSV(read("megadex.csv")), { mega: true });
const canondex = fs.existsSync(path.join(BASE, "data", "canondex.csv"))
  ? buildDex(parseCSV(read("canondex.csv")), { external: true })
  : {};

const byId = new Map();
for (const dex of [pokedex, megadex, canondex])
  for (const e of Object.values(dex)) byId.set(e.id, e);

const prevoChildren = new Map();
for (const e of byId.values()) {
  if (!e.prevo) continue;
  if (!prevoChildren.has(e.prevo)) prevoChildren.set(e.prevo, []);
  prevoChildren.get(e.prevo).push(e);
}

function evolutionRoot(id) {
  let cur = byId.get(id);
  const seen = new Set();
  while (cur && cur.prevo && byId.has(cur.prevo) && !seen.has(cur.id)) {
    seen.add(cur.id);
    cur = byId.get(cur.prevo);
  }
  return cur;
}
function evoChildren(entry) {
  const ids = [...(entry.evo || [])];
  for (const child of prevoChildren.get(entry.id) || [])
    if (!ids.includes(child.id)) ids.push(child.id);
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
function familySize(root) {
  const seen = new Set();
  (function walk(e) {
    if (!e || seen.has(e.id)) return;
    seen.add(e.id);
    evoChildren(e).forEach(walk);
  })(root);
  return seen.size;
}

// --- Image cache -----------------------------------------------------------
const imgCache = new Map();
async function safeLoad(file) {
  if (imgCache.has(file)) return imgCache.get(file);
  let img = null;
  try {
    if (fs.existsSync(file)) img = await loadImage(file);
  } catch {
    img = null;
  }
  imgCache.set(file, img);
  return img;
}
const artOf = (id) => safeLoad(path.join(ART_DIR, `${id}.png`));
const shinyOf = (id) => safeLoad(path.join(ART_DIR, `${id}_shiny.png`));
const typeIcon = (t) => safeLoad(path.join(TYPE_ICON_DIR, `${t}.png`));
const moveIcon = (c) => safeLoad(path.join(MOVE_ICON_DIR, `${c}.png`));

// --- Canvas drawing helpers ------------------------------------------------
// Draw an image scaled to *contain* within (w,h). anchor: "center" | "bottom".
function drawContain(ctx, img, x, y, w, h, anchor = "center") {
  if (!img) return;
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = anchor === "bottom" ? y + (h - dh) : y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// A carved bottom-right notch, the site's recurring clip-path signature.
function notchPath(ctx, x, y, w, h, cut) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - cut);
  ctx.lineTo(x + w - cut, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

function withShadow(ctx, draw, blur = 14, dx = 3, dy = 5) {
  ctx.save();
  ctx.shadowColor = C.shadow;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
  draw();
  ctx.restore();
}

// Word-wrap `text` at `maxW`, return the array of lines.
function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Draw one or more paragraphs into a box, shrinking the body font (maxPx→minPx)
// until every line fits in `h`. If even the smallest size overflows, the last
// visible line is ellipsized rather than spilling out.
function drawFittedParagraphs(ctx, paras, { x, y, w, h, maxPx, minPx, color }) {
  let px = maxPx;
  let layout = null;
  for (; px >= minPx; px -= 2) {
    ctx.font = BODY(px);
    const lineH = px * 1.45;
    const paraGap = lineH * 0.45;
    const lines = [];
    let cursor = 0;
    for (const para of paras) {
      for (const line of wrapLines(ctx, para, w)) {
        lines.push({ line, y: cursor });
        cursor += lineH;
      }
      cursor += paraGap;
    }
    const used = cursor - paraGap;
    if (used <= h || px === minPx) {
      layout = { lines, lineH, used };
      break;
    }
  }
  ctx.fillStyle = color;
  ctx.font = BODY(px);
  const maxLines = Math.floor(h / layout.lineH);
  layout.lines.forEach((l, i) => {
    if (i >= maxLines) return;
    let text = l.line;
    // Ellipsize the last line we can show if content was clipped.
    if (i === maxLines - 1 && layout.lines.length > maxLines) {
      while (ctx.measureText(text + "…").width > w && text.length)
        text = text.slice(0, -1);
      text += "…";
    }
    ctx.fillText(text, x, y + l.y + layout.lineH * 0.75);
  });
}

// Base background: warm limestone + a bottom-up type-tinted overlay (the site's
// #typeColorOverlay), plus the region wordmark and a page indicator.
function drawBackground(ctx, type1, pageNo) {
  ctx.fillStyle = C.bg1;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const tint = TYPE_COLORS[type1] || TYPE_COLORS.Normal;
  const grad = ctx.createLinearGradient(0, SIZE, 0, SIZE * 0.4);
  grad.addColorStop(0, rgba(tint, 0.32));
  grad.addColorStop(1, rgba(tint, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Wordmark, top-left.
  ctx.fillStyle = C.secondText;
  ctx.font = SYNE(24);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillText(`${region.name.toUpperCase()} POKÉDEX`, PAD, 58);
  ctx.restore();

  // Page indicator, top-right.
  ctx.textAlign = "right";
  ctx.fillStyle = C.accent2;
  ctx.font = SYNE(24);
  ctx.fillText(`${pageNo} / 3`, SIZE - PAD, 58);
  ctx.textAlign = "left";
}

// The type-tinted art ring (styles.css .circle-background).
function drawArtRing(ctx, cx, cy, outerR, type1, img) {
  const ringColor = mix(TYPE_COLORS[type1] || C.bg2, C.bg2, 30);
  const border = outerR * 0.26;
  ctx.save();
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = border;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - border / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Art fills the inner circle, allowed to breathe slightly past it.
  const inner = (outerR - border) * 2 * 1.15;
  withShadow(
    ctx,
    () => drawContain(ctx, img, cx - inner / 2, cy - inner / 2, inner, inner),
    22,
    0,
    10,
  );
}

// A type badge pill (styles.css .type-badge). Returns its width.
async function drawTypeBadge(ctx, type, x, y) {
  const h = 46;
  ctx.font = SYNE(26);
  const label = type.toUpperCase();
  const icon = await typeIcon(type);
  const iconW = icon ? 30 : 0;
  const gap = icon ? 12 : 0;
  const textW = ctx.measureText(label).width;
  const w = 22 + iconW + gap + textW + 22;
  withShadow(
    ctx,
    () => {
      ctx.fillStyle = TYPE_COLORS[type] || TYPE_COLORS.Normal;
      notchPath(ctx, x, y, w, h, 8);
      ctx.fill();
    },
    8,
    1,
    2,
  );
  let tx = x + 22;
  if (icon) {
    drawContain(ctx, icon, tx, y + (h - 30) / 2, iconW, 30);
    tx += iconW + gap;
  }
  ctx.fillStyle = C.accent6;
  ctx.textBaseline = "middle";
  ctx.fillText(label, tx, y + h / 2 + 2);
  ctx.textBaseline = "alphabetic";
  return w;
}

// Convert "Yakoyza-Oni" → "Yakoyza (Oni)" for non-mega formes (matches the site
// title). Megas keep their full name.
function displayName(entry) {
  if (!entry.isMega && entry.name.includes("-")) {
    const [a, b] = entry.name.split("-");
    return `${a} (${b})`;
  }
  return entry.name;
}
const shortName = (entry) => (entry.name || entry.id).split("-")[0];

// Fit a single line of Syne into maxW by shrinking the size (down to min).
function fitSyne(ctx, text, maxPx, minPx, maxW) {
  let px = maxPx;
  ctx.font = SYNE(px);
  while (ctx.measureText(text).width > maxW && px > minPx) {
    px -= 2;
    ctx.font = SYNE(px);
  }
  return px;
}

// ===========================================================================
// PAGE 1 — main art
// ===========================================================================
async function renderArtPage(entry) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  const type1 = entry.types[0];
  drawBackground(ctx, type1, 1);

  const art = await artOf(entry.id);
  drawArtRing(ctx, SIZE / 2, 470, 340, type1, art);

  // Title block, bottom.
  const name = displayName(entry);
  ctx.textAlign = "left";
  const maxW = SIZE - PAD * 2;
  if (entry.num != null) {
    ctx.font = BODY(34);
    ctx.fillStyle = C.accent2;
    ctx.fillText(`Nº ${String(entry.num).padStart(3, "0")}`, PAD, 812);
  }
  const namePx = fitSyne(ctx, name, 96, 52, maxW);
  ctx.font = SYNE(namePx);
  ctx.fillStyle = C.mainText;
  ctx.fillText(name, PAD, 812 + namePx * 0.9);

  const kindY = 812 + namePx * 0.9 + 46;
  if (entry.kind) {
    ctx.font = BODY_ITALIC(34);
    ctx.fillStyle = C.secondText;
    ctx.fillText(`The ${entry.kind} Pokémon`, PAD, kindY);
  }

  // Type badges.
  let bx = PAD;
  const by = kindY + 26;
  for (const t of entry.types) {
    const w = await drawTypeBadge(ctx, t, bx, by);
    bx += w + 16;
  }

  // Height / weight pills, bottom-right.
  const pills = [];
  if (entry.heightm != null) pills.push(`${entry.heightm} m`);
  if (entry.weightkg != null) pills.push(`${entry.weightkg} kg`);
  ctx.font = SYNE(28);
  let px = SIZE - PAD;
  ctx.textAlign = "right";
  for (const label of pills.reverse()) {
    const w = ctx.measureText(label).width + 44;
    const y = by;
    withShadow(
      ctx,
      () => {
        ctx.fillStyle = C.bg3;
        notchPath(ctx, px - w, y, w, 46, 8);
        ctx.fill();
      },
      8,
      1,
      2,
    );
    ctx.fillStyle = C.mainText;
    ctx.textBaseline = "middle";
    ctx.fillText(label, px - 22, y + 25);
    ctx.textBaseline = "alphabetic";
    px -= w + 16;
  }
  ctx.textAlign = "left";
  return canvas;
}

// ===========================================================================
// PAGE 2 — shiny art + dex description
// ===========================================================================
async function renderDexPage(entry) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  const type1 = entry.types[0];
  drawBackground(ctx, type1, 2);

  // Header: name + a SHINY tag.
  ctx.textAlign = "left";
  const name = shortName(entry);
  const namePx = fitSyne(ctx, name, 76, 44, SIZE - PAD * 2 - 200);
  ctx.font = SYNE(namePx);
  ctx.fillStyle = C.mainText;
  ctx.fillText(name, PAD, 150);

  const shiny = await shinyOf(entry.id);
  const shinyArt = shiny || (await artOf(entry.id));

  drawArtRing(ctx, SIZE / 2, 380, 252, type1, shinyArt);

  // "SHINY" chip (gold, dark text — like a type badge) next to the name, drawn
  // after the ring so it sits cleanly on top. Only when a real shiny exists.
  if (shiny) {
    ctx.font = SYNE(namePx);
    const nameW = ctx.measureText(name).width;
    ctx.font = SYNE(24);
    const label = "SHINY";
    const w = ctx.measureText(label).width + 40;
    const chipX = PAD + nameW + 32;
    const chipY = 116;
    withShadow(
      ctx,
      () => {
        ctx.fillStyle = C.accent2;
        notchPath(ctx, chipX, chipY, w, 42, 8);
        ctx.fill();
      },
      8,
      1,
      2,
    );
    ctx.fillStyle = C.accent6;
    ctx.textBaseline = "middle";
    ctx.fillText(label, chipX + 20, chipY + 22);
    ctx.textBaseline = "alphabetic";
  }

  // Description box (styles.css .pokemon-description) — bg3 surface, gold left
  // rule, a big translucent opening quote. The body font auto-fits so both
  // Pokédex paragraphs always land inside the box.
  const paras =
    entry.description && entry.description.length
      ? entry.description
      : ["No description available."];
  const boxX = PAD;
  const boxW = SIZE - PAD * 2;
  const boxY = 660;
  const boxH = SIZE - boxY - PAD;
  withShadow(ctx, () => {
    ctx.fillStyle = C.bg3;
    ctx.fillRect(boxX, boxY, boxW, boxH);
  });
  ctx.fillStyle = C.accent2;
  ctx.fillRect(boxX, boxY, 6, boxH); // left accent rule
  ctx.fillStyle = rgba(C.accent5, 0.24);
  ctx.font = SYNE(90);
  ctx.fillText('"', boxX + 22, boxY + 66);

  drawFittedParagraphs(ctx, paras, {
    x: boxX + 44,
    y: boxY + 72,
    w: boxW - 88,
    h: boxH - 96,
    maxPx: 32,
    minPx: 22,
    color: C.secondText,
  });
  return canvas;
}

// ===========================================================================
// PAGE 3 — stats, abilities, signature move, evolution
// ===========================================================================
function drawStatBar(ctx, label, value, x, y, w, key, isBst) {
  const max = isBst ? 700 : 180;
  const trackH = isBst ? 16 : 12;
  const labelW = 92;
  const valueW = 64;
  const barX = x + labelW;
  const barW = w - labelW - valueW - 20;

  // Label.
  ctx.font = SYNE(24);
  ctx.fillStyle = isBst ? C.accent2 : C.secondText;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), x + labelW - 14, y);

  // Track.
  const trackY = y - trackH / 2;
  ctx.fillStyle = C.bg2;
  ctx.fillRect(barX, trackY, barW, trackH);
  // Fill.
  const pct = Math.max(0, Math.min(1, value / max));
  const fill = STAT_FILL[key] || C.accent5;
  const grad = ctx.createLinearGradient(0, trackY, 0, trackY + trackH);
  grad.addColorStop(0, mix(fill, "#ffffff", 84));
  grad.addColorStop(0.58, fill);
  grad.addColorStop(1, mix(fill, "#4a3a28", 90));
  ctx.fillStyle = grad;
  ctx.fillRect(barX, trackY, barW * pct, trackH);
  // Tick marks (quarter divisions), matching the site track.
  ctx.fillStyle = C.bg1;
  for (let i = 1; i < 4; i++)
    ctx.fillRect(barX + (barW * i) / 4 - 1, trackY, 2, trackH);

  // Value.
  ctx.font = BODY(26);
  ctx.fillStyle = isBst ? C.accent2 : C.mainText;
  ctx.textAlign = "left";
  ctx.fillText(String(value), barX + barW + 16, y);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

// Render the evolution line to an offscreen canvas at natural size, so page 3
// can blit it scaled to fit. Returns {canvas} or null when there's nothing.
async function renderEvoStrip(selectedPokemon) {
  // Megas/Xenos: show the base ("og") form only, like the card page.
  if (selectedPokemon.isMega) {
    const root = evolutionRoot(selectedPokemon.speciesId);
    if (!root || root.id === selectedPokemon.speciesId) return null;
    return renderEvoNodes([{ node: root, x: 0, y: 0 }], [], root.width, null);
  }

  const root = evolutionRoot(selectedPokemon.speciesId);
  if (!root || familySize(root) < 2) {
    // Single-stage: just the lone chip. (Skip on page 3 to save room.)
    return null;
  }

  // Tree layout: x by depth, y by leaf slot.
  const NW = 150;
  const NH = 168;
  const GAPX = 96; // arrow column
  const GAPY = 44;
  const placed = [];
  const edges = [];
  const seen = new Set();
  let leaf = 0;

  function layout(entry, depth) {
    seen.add(entry.id);
    const kids = evoChildren(entry).filter((c) => !seen.has(c.id));
    kids.forEach((c) => seen.add(c.id));
    let y;
    if (!kids.length) {
      y = leaf * (NH + GAPY);
      leaf += 1;
    } else {
      const kidYs = kids.map((c) => layout(c, depth + 1));
      y = (kidYs[0] + kidYs[kidYs.length - 1]) / 2;
      kids.forEach((c) =>
        edges.push({ from: entry.id, to: c.id, method: c.evoMethod }),
      );
    }
    placed.push({ node: entry, x: depth * (NW + GAPX), y });
    return y;
  }
  layout(root, 0);

  const maxX = Math.max(...placed.map((p) => p.x)) + NW;
  const maxY = Math.max(...placed.map((p) => p.y)) + NH + 34; // +name
  return renderEvoNodes(placed, edges, maxX, maxY, {
    NW,
    NH,
    currentId: selectedPokemon.speciesId,
  });
}

async function renderEvoNodes(placed, edges, w, h, opts = {}) {
  const NW = opts.NW || 150;
  const NH = opts.NH || 168;
  const currentId = opts.currentId || null;
  const width = w || NW;
  const height = h || NH + 34;
  const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
  const ctx = canvas.getContext("2d");
  const pos = new Map(placed.map((p) => [p.node.id, p]));

  // Edges first (arrows + method labels), so nodes draw over the line ends.
  for (const e of edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const x1 = a.x + NW;
    const x2 = b.x;
    const midX = (x1 + x2) / 2;
    const y1 = a.y + NH / 2;
    const y2 = b.y + NH / 2;
    ctx.strokeStyle = C.secondText;
    ctx.fillStyle = C.secondText;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    // elbow connector
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(midX, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(x2 - 12, y2);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 14, y2 - 8);
    ctx.lineTo(x2 - 14, y2 + 8);
    ctx.closePath();
    ctx.fill();
    // method label
    if (e.method) {
      ctx.font = SYNE(18);
      ctx.textAlign = "center";
      const tw = ctx.measureText(e.method).width + 20;
      ctx.fillStyle = C.bg3;
      notchPath(ctx, midX - tw / 2, y1 - 40, tw, 30, 6);
      ctx.fill();
      ctx.fillStyle = C.mainText;
      ctx.textBaseline = "middle";
      ctx.fillText(e.method, midX, y1 - 25);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }
  }

  // Nodes: art resting on a type-colored slanted baseline, name beneath.
  for (const p of placed) {
    const { node, x, y } = p;
    const type1 = node.types[0] || "Normal";
    const art = await artOf(node.id);
    withShadow(
      ctx,
      () => drawContain(ctx, art, x + 6, y, NW - 12, NH - 18, "bottom"),
      14,
      0,
      6,
    );
    // Slanted baseline bar.
    const isCurrent = node.id === currentId;
    const barColor = isCurrent ? C.accent2 : TYPE_COLORS[type1] || C.accent5;
    const barH = isCurrent ? 12 : 9;
    const by = y + NH - 10;
    const lean = 14;
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.moveTo(x + lean, by);
    ctx.lineTo(x + NW * 0.82, by);
    ctx.lineTo(x + NW * 0.82 - lean, by + barH);
    ctx.lineTo(x, by + barH);
    ctx.closePath();
    ctx.fill();
    // Name.
    ctx.font = SYNE(22);
    ctx.fillStyle = isCurrent ? C.accent2 : C.mainText;
    ctx.textAlign = "center";
    ctx.fillText(shortName(node), x + NW / 2, y + NH + 18);
    ctx.textAlign = "left";
  }
  return canvas;
}

async function renderStatsPage(entry) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  const type1 = entry.types[0];
  drawBackground(ctx, type1, 3);

  // Header.
  ctx.textAlign = "left";
  const name = shortName(entry);
  const namePx = fitSyne(ctx, name, 64, 40, SIZE - PAD * 2);
  ctx.font = SYNE(namePx);
  ctx.fillStyle = C.mainText;
  ctx.fillText(name, PAD, 130);
  ctx.font = BODY(26);
  ctx.fillStyle = C.secondText;
  ctx.fillText("BASE STATS · ABILITIES · SIGNATURE MOVE", PAD, 168);

  // --- Left column: stats ---
  const colTop = 240;
  const s = entry.baseStats;
  const bst = Object.values(s).reduce((a, b) => a + (b || 0), 0);
  const rows = [
    ["HP", s.hp, "hp"],
    ["Atk", s.atk, "atk"],
    ["Def", s.def, "def"],
    ["Sp.Atk", s.spa, "spa"],
    ["Sp.Def", s.spd, "spd"],
    ["Speed", s.spe, "spe"],
  ];
  const statX = PAD;
  const statW = 468;
  let sy = colTop + 20;
  const step = 62;
  for (const [label, value, key] of rows) {
    drawStatBar(ctx, label, value ?? 0, statX, sy, statW, key, false);
    sy += step;
  }
  sy += 14;
  drawStatBar(ctx, "BST", bst, statX, sy, statW, "bst", true);

  // --- Right column: abilities + signature move ---
  const rx = 596;
  const rw = SIZE - rx - PAD;
  let ry = colTop;

  // Abilities card (styles.css .ability-list): bg2 surface, emerald top rule.
  // Rows are variable-height: an ability with a (wrapped) description takes more
  // vertical room than a bare one, so we lay them out measured rather than on a
  // fixed step (which used to let a 2-line description collide with the next).
  const abilityKeys = [
    entry.abilities?.["0"],
    entry.abilities?.["1"],
    entry.abilities?.["H"],
  ].filter(Boolean);
  ctx.font = BODY(20);
  const abilityRows = abilityKeys.map((key) => {
    const meta = abilities[key];
    const special = meta?.tag === "andela" || meta?.tag === "mega";
    const descLines = meta?.description
      ? wrapLines(ctx, meta.description, rw - 74).slice(0, 2)
      : [];
    return { key, special, descLines };
  });
  const rowHeight = (r) =>
    42 + (r.descLines.length ? r.descLines.length * 26 + 6 : 0);
  const abBodyH = abilityRows.reduce((s, r) => s + rowHeight(r), 0);
  const abH = 62 + abBodyH;
  withShadow(ctx, () => {
    ctx.fillStyle = C.bg2;
    ctx.fillRect(rx, ry, rw, abH);
  });
  ctx.fillStyle = C.accent5;
  ctx.fillRect(rx, ry, rw, 6); // top accent rule
  ctx.font = SYNE(22);
  ctx.fillStyle = C.secondText;
  ctx.fillText("ABILITIES", rx + 22, ry + 40);
  let ay = ry + 64;
  for (const row of abilityRows) {
    // diamond bullet
    ctx.fillStyle = row.special ? C.accent1 : C.accent5;
    ctx.save();
    ctx.translate(rx + 30, ay + 4);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
    // name
    ctx.font = SYNE(28);
    ctx.fillStyle = row.special ? C.accent1 : C.mainText;
    ctx.fillText(row.key, rx + 52, ay + 12);
    // description (wrapped, small)
    ctx.font = BODY(20);
    ctx.fillStyle = C.secondText;
    let ly = ay + 36;
    for (const line of row.descLines) {
      ctx.fillText(line, rx + 52, ly);
      ly += 26;
    }
    ay += rowHeight(row);
  }
  ry += abH + 30;

  // Signature move box (styles.css .pokemon-sigmove): bg3, terracotta left rule.
  const sig = entry.signatureMove;
  const move = sig && moves[sig];
  if (move) {
    const boxH = 250;
    withShadow(ctx, () => {
      ctx.fillStyle = C.bg3;
      notchPath(ctx, rx, ry, rw, boxH, 12);
      ctx.fill();
    });
    ctx.fillStyle = C.accent1;
    ctx.fillRect(rx, ry, 6, boxH - 12);
    ctx.font = SYNE(22);
    ctx.fillStyle = C.secondText;
    ctx.fillText("SIGNATURE MOVE", rx + 24, ry + 38);
    ctx.font = SYNE(30);
    ctx.fillStyle = C.mainText;
    ctx.fillText(sig, rx + 24, ry + 74);

    // icons + numbers row
    let ix = rx + 24;
    const iconY = ry + 92;
    const tIcon = move.type && (await typeIcon(move.type));
    const cIcon = move.category && (await moveIcon(move.category));
    if (tIcon) {
      drawContain(ctx, tIcon, ix, iconY, 34, 34);
      ix += 44;
    }
    if (cIcon) {
      drawContain(ctx, cIcon, ix, iconY, 34, 34);
      ix += 44;
    }
    ctx.font = BODY(22);
    ctx.fillStyle = C.secondText;
    const bits = [];
    if (move.power) bits.push(`Pow ${move.power}`);
    if (move.accuracy) bits.push(`Acc ${move.accuracy}`);
    if (move.pp) bits.push(`${move.pp} PP`);
    ctx.textBaseline = "middle";
    ctx.fillText(bits.join("   ·   "), ix + 4, iconY + 17);
    ctx.textBaseline = "alphabetic";

    if (move.description) {
      ctx.font = BODY(21);
      ctx.fillStyle = C.secondText;
      let dy = ry + 150;
      for (const line of wrapLines(ctx, move.description, rw - 48).slice(
        0,
        4,
      )) {
        ctx.fillText(line, rx + 24, dy);
        dy += 28;
      }
    }
  }

  // --- Bottom band: evolution line ---
  const evo = await renderEvoStrip(entry);
  const evoTop = 800;
  const evoH = SIZE - evoTop - PAD;
  ctx.font = SYNE(22);
  ctx.fillStyle = C.secondText;
  ctx.textAlign = "center";
  if (evo) {
    ctx.fillText("EVOLUTION", SIZE / 2, evoTop);
    const availW = SIZE - PAD * 2;
    const availH = evoH - 40;
    const scale = Math.min(availW / evo.width, availH / evo.height, 1);
    const dw = evo.width * scale;
    const dh = evo.height * scale;
    ctx.drawImage(evo, (SIZE - dw) / 2, evoTop + 20, dw, dh);
  } else {
    ctx.fillText(
      entry.isMega ? "TEMPORARY FORM CHANGE" : "DOES NOT EVOLVE",
      SIZE / 2,
      evoTop + 40,
    );
  }
  ctx.textAlign = "left";
  return canvas;
}

// --- Batch runner ----------------------------------------------------------
async function writeCanvas(canvas, file) {
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

async function generateFor(entry) {
  const pages = [
    ["1-art", await renderArtPage(entry)],
    ["2-dex", await renderDexPage(entry)],
    ["3-stats", await renderStatsPage(entry)],
  ];
  for (const [suffix, canvas] of pages)
    await writeCanvas(canvas, path.join(OUT_DIR, `${entry.id}-${suffix}.png`));
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const only = process.argv[2]?.toLowerCase();
  // Generate for real dex entries (main + mega). Canon reference mons have no
  // card, so they aren't given a set — they only appear inside evo lines.
  const entries = [...Object.values(pokedex), ...Object.values(megadex)].filter(
    (e) => (only ? e.id === only : true),
  );

  if (!entries.length) {
    console.error(only ? `No Pokémon with id "${only}".` : "No dex entries.");
    process.exit(1);
  }

  let ok = 0;
  for (const entry of entries) {
    try {
      await generateFor(entry);
      ok += 1;
      console.log(`✓ ${entry.id}  (${ok}/${entries.length})`);
    } catch (err) {
      console.error(`✗ ${entry.id}: ${err.message}`);
    }
  }
  console.log(`\nDone — ${ok}/${entries.length} sets → ${OUT_DIR}`);
}

main();
