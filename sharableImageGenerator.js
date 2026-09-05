import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import fs from "fs";
import { parseCSV, buildDex } from "./pokeData.js";

const BASE = path.resolve();

// Load the dex straight from the CSVs (same source of truth the site uses),
// keyed by id — which is also the art filename this script matches against.
const pokedex = {
  ...buildDex(
    parseCSV(fs.readFileSync(path.join(BASE, "data", "pokedex.csv"), "utf8")),
    { mega: false },
  ),
  ...buildDex(
    parseCSV(fs.readFileSync(path.join(BASE, "data", "megadex.csv"), "utf8")),
    { mega: true },
  ),
};
registerFont(path.join(BASE, "assets", "SmileySans-Oblique.otf"), {
  family: "SmileyOblique",
});

const bg = await loadImage(path.join(BASE, "assets", "SharableImageBg.png"));
const POKEMON_FOLDER = path.join(BASE, "data", "pokemonArt");
const OUTPUT_FOLDER = path.join(BASE, "sharablePokemonArt");
const TYPEBAR_FOLDER = path.join(BASE, "typeIcons");
if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER);

const TYPE_COLORS = {
  Normal: "#c3c29b",
  Fire: "#ff6320",
  Water: "#4b99ff",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#ff2b23",
  Poison: "#a622a3",
  Ground: "#e39b49",
  Flying: "#baa2ff",
  Psychic: "#ff4baa",
  Bug: "#A6B91A",
  Rock: "#958150",
  Ghost: "#4d4260",
  Dragon: "#5935fc",
  Dark: "#322d28",
  Steel: "#8c8c9a",
  Fairy: "#ff98b5",
};

const files = fs.readdirSync(POKEMON_FOLDER);

for (const filename of files) {
  if (!filename.toLowerCase().endsWith(".png")) continue;
  if (filename.toLowerCase().includes("_shiny")) continue;

  const pokemonImg = await loadImage(path.join(POKEMON_FOLDER, filename));

  const canvas = createCanvas(bg.width, bg.height);
  const ctx = canvas.getContext("2d");

  // --- Get Pokémon info from pokedex ---
  const baseName = path.parse(filename).name.toLowerCase();
  const pokeData = pokedex[baseName];
  const primaryType = pokeData?.types[0] || "Normal";
  const secondaryType = pokeData?.types[1] || primaryType;

  const primaryColor = TYPE_COLORS[primaryType] || "#AAAAAA";
  const secondaryColor = TYPE_COLORS[secondaryType] || primaryColor;

  // --- Fill top and bottom halves ---
  const halfHeight = canvas.height / 2;
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, canvas.width, halfHeight);
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(0, halfHeight, canvas.width, halfHeight);

  // --- Draw background image on top ---
  ctx.drawImage(bg, 0, 0);

  // --- Draw name ---
  const displayName = pokeData?.name || baseName;
  ctx.fillStyle = "black";
  ctx.font = '90px "SmileyOblique"';
  ctx.fillText(displayName, 70, 135);

  // --- Draw type icons ---
  const typeImages = [];
  const typeIcons = pokeData.types;

  for (const t of typeIcons) {
    const typePath = path.join(TYPEBAR_FOLDER, `${t}.png`);
    if (fs.existsSync(typePath)) {
      typeImages.push(await loadImage(typePath));
    }
  }

  const iconSize = 100; // resize width (height auto)
  let tx = 30; // starting X (bottom-left)
  const ty = canvas.height - 130; // Y position

  for (const img of typeImages) {
    const scale = iconSize / img.width;
    const h = img.height * scale;
    ctx.drawImage(img, tx, ty, iconSize, h);
    tx += iconSize + 20; // spacing between icons
  }

  // --- Shadow ---
  const x = (bg.width - 1100) / 2;
  const y = (bg.height - 1100) / 2;
  const shadowOffset = { x: 12, y: 12 };

  const shadowLayer = createCanvas(canvas.width, canvas.height);
  const shadowCtx = shadowLayer.getContext("2d");
  shadowCtx.drawImage(
    pokemonImg,
    x + shadowOffset.x,
    y + shadowOffset.y,
    1100,
    1100,
  );
  shadowCtx.globalCompositeOperation = "source-in";
  shadowCtx.fillStyle = "rgb(255,210,0)";
  shadowCtx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(shadowLayer, 0, 0);

  // --- Draw Pokémon ---
  ctx.drawImage(pokemonImg, x, y, 1100, 1100);

  // Save
  const out = fs.createWriteStream(path.join(OUTPUT_FOLDER, filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  await new Promise((resolve) => out.on("finish", resolve));
}
