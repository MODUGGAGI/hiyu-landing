import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mapStamps } from "../src/model.js";

const require = createRequire(import.meta.url);
// Use an existing canvas runtime; this artwork tool is not a site dependency.
const { createCanvas, GlobalFonts, SvgExportFlag } = require(
  process.env.HIYU_CANVAS_MODULE || "@napi-rs/canvas",
);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assets = join(root, "public", "assets");
const destination = join(assets, "map-stamps");
const fontRoot = join(root, "node_modules/@fontsource-variable/noto-sans-kr");
const fontCSS = await readFile(join(fontRoot, "index.css"), "utf8");
const fontFaces = [...fontCSS.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(
  ([, block], index) => ({
    alias: `HiyuMapNoto${index}`,
    file: join(fontRoot, block.match(/url\(\.\/([^)]*)\)/)[1]),
    ranges: block
      .match(/unicode-range:\s*([^;]+)/)[1]
      .split(",")
      .map((range) => {
        const [start, end] = range
          .trim()
          .replace(/^U\+/i, "")
          .split("-")
          .map((n) => parseInt(n, 16));
        return [start, end ?? start];
      }),
  }),
);
const registered = new Set();
const xmlEscape = (value) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character],
  );

function fontFor(character) {
  const codepoint = character.codePointAt(0);
  const face = fontFaces.find(({ ranges }) =>
    ranges.some(([start, end]) => codepoint >= start && codepoint <= end),
  );
  if (!face) throw new Error(`No bundled Noto Sans KR glyph: ${character}`);
  if (!registered.has(face.alias)) {
    if (!GlobalFonts.registerFromPath(face.file, face.alias)) {
      throw new Error(`Cannot load bundled Noto Sans KR font: ${face.file}`);
    }
    registered.add(face.alias);
  }
  return face.alias;
}

function labelArtwork({ shape, label, labelLines, textColor }, viewBox) {
  const [originX, originY, width, height] = viewBox.split(/\s+/).map(Number);
  if (originX !== 0 || originY !== 0)
    throw new Error(`Unexpected origin: ${shape.id}`);
  if (Array.from(label).length !== 4 || labelLines.join("") !== label) {
    throw new Error(
      `Map stamps require an explicit four-character layout: ${shape.id}`,
    );
  }
  const canvas = createCanvas(width, height, SvgExportFlag.ConvertTextToPaths);
  const context = canvas.getContext("2d");
  context.fillStyle = textColor;
  const measure = (character, size) => {
    context.font = `800 ${size}px "${fontFor(character)}"`;
    context.fontVariationSettings = '"wght" 800';
    return context.measureText(character);
  };
  const rows = labelLines.map((line) => Array.from(line));
  const units = rows.map((row) =>
    row.reduce(
      (total, character) => total + measure(character, 1000).width / 1000,
      0,
    ),
  );
  const lineHeight = 1.12;
  const fontSize = Math.min(
    (width * shape.tw * 0.96) / Math.max(...units),
    (height * shape.th * 0.96) / (1 + (rows.length - 1) * lineHeight),
  );
  rows.forEach((row, index) => {
    const metrics = row.map((character) => measure(character, fontSize));
    const advance = metrics.reduce((total, metric) => total + metric.width, 0);
    const ascent = Math.max(
      ...metrics.map((metric) => metric.actualBoundingBoxAscent),
    );
    const descent = Math.max(
      ...metrics.map((metric) => metric.actualBoundingBoxDescent),
    );
    const center =
      height * shape.cy +
      (index - (rows.length - 1) / 2) * fontSize * lineHeight;
    const baseline = center + (ascent - descent) / 2;
    let x = width * shape.cx - advance / 2;
    row.forEach((character, characterIndex) => {
      context.font = `800 ${fontSize}px "${fontFor(character)}"`;
      context.fontVariationSettings = '"wght" 800';
      context.fillText(character, x, baseline);
      x += metrics[characterIndex].width;
    });
  });
  const body = canvas
    .getContent()
    .toString()
    .match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (!body || !body.includes("<path") || /<text\b/.test(body)) {
    throw new Error(`Label was not converted to vector outlines: ${shape.id}`);
  }
  return `<!-- Noto Sans KR Variable, weight 800; ${xmlEscape(labelLines.join(" / "))} -->\n<g data-stamp-label="${xmlEscape(label)}" data-line-count="${rows.length}">${body}</g>`;
}

async function readLayer(id, layer) {
  const filename = `group_stamp_${id}_${layer}.svg`;
  const source = await readFile(join(assets, filename), "utf8");
  const match = source.match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
  if (!match) throw new Error(`Unexpected SVG document: ${filename}`);
  const viewBox = match[1].match(/\bviewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error(`Missing viewBox: ${filename}`);
  return { filename, attributes: match[1], body: match[2], viewBox };
}

await mkdir(destination, { recursive: true });
const identifiers = new Set();
for (const stamp of mapStamps) {
  const { shape, fill, label, textColor } = stamp;
  const id = shape.id;
  if (
    !/^[a-z_]+$/.test(id) ||
    !/^#[a-f\d]{6}$/i.test(fill) ||
    !/^#[a-f\d]{6}$/i.test(textColor)
  ) {
    throw new Error(`Invalid map stamp appearance: ${id}`);
  }
  if (identifiers.has(id)) throw new Error(`Duplicate map stamp id: ${id}`);
  identifiers.add(id);

  const layers = await Promise.all([
    readLayer(id, "backdrop"),
    readLayer(id, "fill"),
    ...(shape.overlay ? [readLayer(id, "overlay")] : []),
  ]);
  const [backdrop] = layers;
  if (layers.some((layer) => layer.viewBox !== backdrop.viewBox)) {
    throw new Error(`Layer coordinate systems differ: ${id}`);
  }
  const artwork = layers
    .map((layer, index) => {
      // Tint only the fill layer. Preserve the original app paths and geometry.
      const body =
        index === 1
          ? layer.body.replace(/\bfill="#[a-f\d]{6}"/gi, `fill="${fill}"`)
          : layer.body;
      return `<!-- ${layer.filename} -->\n${body}`;
    })
    .join("\n");
  const svg = `<svg${backdrop.attributes}>\n<title>${xmlEscape(label)} 그룹 스탬프</title>\n${artwork}\n${labelArtwork(stamp, backdrop.viewBox)}\n</svg>\n`;
  const svgPath = join(destination, `${id}.svg`);
  await writeFile(svgPath, svg);
  execFileSync(process.env.HIYU_RSVG_CONVERT || "rsvg-convert", [
    "--width",
    "1024",
    "--output",
    join(destination, `${id}.png`),
    svgPath,
  ]);
}
console.log(
  `Generated ${identifiers.size} outlined map stamps and 1024px PNGs from the original SVG layers and bundled Noto Sans KR.`,
);
