import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "img", "menu", "menu-oficial.png");
const outputSvg = path.join(root, "img", "menu", "menu-final-art-v3.svg");
const outputPng = path.join(root, "img", "menu", "menu-final-art-v3.png");
const W = 3200;
const H = 5120;

const crops = {
  soup: [22, 525, 100, 125],
  tartar: [285, 560, 92, 105],
  tartiflette: [545, 545, 90, 115],
  filet: [23, 770, 100, 108],
  ribs: [287, 775, 93, 103],
  steak: [545, 770, 95, 105],
  pineapple: [23, 925, 100, 105],
  chicken: [288, 935, 94, 100],
  waldorf: [550, 935, 94, 110],
  salmon: [24, 1070, 100, 100],
  corvina: [287, 1070, 96, 100],
  puree: [35, 1200, 94, 75],
  salad: [295, 1198, 94, 77],
  rice: [555, 1200, 91, 75],
};

const encoded = {};
for (const [name, [left, top, width, height]] of Object.entries(crops)) {
  const buffer = await sharp(source)
    .extract({ left, top, width, height })
    .resize({ width: width * 4, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.65 })
    .png()
    .toBuffer();
  encoded[name] = `data:image/png;base64,${buffer.toString("base64")}`;
}

const esc = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function textLines(lines, x, y, options = {}) {
  const {
    size = 49,
    weight = 400,
    fill = "#26382f",
    anchor = "start",
    italic = false,
    line = 1.18,
    family = "Georgia, 'Times New Roman', serif",
    spacing = 0,
  } = options;
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}"${italic ? ' font-style="italic"' : ""} letter-spacing="${spacing}">${lines
    .map(
      (entry, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : Math.round(size * line)}">${esc(entry)}</tspan>`
    )
    .join("")}</text>`;
}

function dishCard({ x, y, image, title, description, imageWidth = 330 }) {
  const titleLines = Array.isArray(title) ? title : [title];
  const bodyY = y + 95 + titleLines.length * 55;
  return `
    <image href="${encoded[image]}" x="${x}" y="${y + 5}" width="${imageWidth}" height="340" preserveAspectRatio="xMidYMid meet"/>
    ${textLines(titleLines, x + imageWidth + 24, y + 70, { size: 51, weight: 600 })}
    ${textLines(description, x + imageWidth + 24, bodyY, { size: 34, line: 1.27, fill: "#314239" })}
  `;
}

const sectionRule = (title, y) => `
  <line x1="220" y1="${y}" x2="1180" y2="${y}" stroke="#b58a35" stroke-width="5"/>
  <line x1="2020" y1="${y}" x2="2980" y2="${y}" stroke="#b58a35" stroke-width="5"/>
  ${textLines([title], 1600, y + 20, { size: 88, weight: 600, anchor: "middle", spacing: 3 })}
  <circle cx="1215" cy="${y}" r="9" fill="#b58a35"/>
  <circle cx="1985" cy="${y}" r="9" fill="#b58a35"/>
`;

const entryCards = [
  dishCard({
    x: 150, y: 1960, image: "soup", title: ["Sopa de Cebolla", "Gratinada"],
    description: ["Cebollas en reducción de vino tinto", "y salsa de carne, sobre una tostada", "con queso gratinado."],
  }),
  dishCard({
    x: 1090, y: 1960, image: "tartar", title: ["Tartar de Salmón", "sobre Rosti"],
    description: ["Rodajas de salmón salteadas en sal", "pimienta con alcaparras sobre nuestra", "tradicional papa rosti suiza."],
  }),
  dishCard({
    x: 2110, y: 1960, image: "tartiflette", title: "Tartiflette",
    description: ["Plato franco-suizo: patatas cortadas", "en rodajas finas con trozos de tocineta", "y nuestro queso cremoso suizo, gratinado."],
  }),
].join("");

const mainCards = [
  dishCard({
    x: 130, y: 2730, image: "filet", title: "Filet Mignon",
    description: ["Medallones de res a la parrilla, cada", "uno recubierto con tocineta y salteados", "en salsa de champiñones a base de vino tinto."],
  }),
  dishCard({
    x: 1080, y: 2730, image: "ribs", title: ["Costillas de Cerdo", "en Flor de Jamaica"],
    description: ["Rack costillas de cerdo al horno de leña", "cocinadas en nuestra sal gruesa con salsa:", "BBQ, mandarina o teriyaki."],
  }),
  dishCard({
    x: 2100, y: 2730, image: "steak", title: "New York Steak",
    description: ["320 gr de lomo de res, en corte firme", "y marmoleado; se caracteriza por su", "jugosidad y ternura."],
  }),
  dishCard({
    x: 130, y: 3325, image: "pineapple", title: ["Piña Rellena", "al Pomodoro"],
    description: ["Media piña rellena de julianas de pollo", "y camarones salteadas en nuestra salsa", "pomodoro en quesos suizos."],
  }),
  dishCard({
    x: 1080, y: 3325, image: "chicken", title: "Lombarda de Pollo",
    description: ["Pollo a la parrilla salteado en una salsa", "con reducción de vino tinto suizo", "con tocineta y champiñones."],
  }),
  dishCard({
    x: 2100, y: 3325, image: "waldorf", title: "Arroz Waldorf",
    description: ["Arroz blanco con variedad de frutos del mar:", "almejas, mejillones, róbalo, camarones,", "salmón y corvina, con salsa española."],
  }),
  dishCard({
    x: 450, y: 3860, image: "salmon", title: "Salmón Wolford",
    description: ["Filete de salmón a la parrilla salteado", "en frutos del mar, con salsa marinera", "de la casa, camarones, calamar y róbalo."],
  }),
  dishCard({
    x: 1630, y: 3860, image: "corvina", title: "Corvina Bretona",
    description: ["Filete de corvina a la parrilla en una", "salsa al ajillo suave con camarón", "y champiñones flambeado."],
  }),
].join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="paper" cx="50%" cy="42%" r="75%">
      <stop offset="0" stop-color="#fffdf6"/>
      <stop offset="1" stop-color="#f3ead8"/>
    </radialGradient>
    <filter id="softShadow"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#213224" flood-opacity=".14"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#paper)"/>
  <rect x="52" y="52" width="3096" height="5016" fill="none" stroke="#b48732" stroke-width="7"/>
  <path d="M55 470 C160 230 300 120 590 55 C400 130 310 255 250 480 C190 405 125 392 55 470Z" fill="#2a4a2d" opacity=".9"/>
  <path d="M3145 470 C3040 230 2900 120 2610 55 C2800 130 2890 255 2950 480 C3010 405 3075 392 3145 470Z" fill="#2a4a2d" opacity=".9"/>
  <g fill="none" stroke="#b58a35" stroke-width="8" opacity=".8">
    <path d="M70 550 C280 250 530 145 850 95"/>
    <path d="M3130 550 C2920 250 2670 145 2350 95"/>
  </g>

  ${textLines(["S | A"], 1600, 380, { size: 210, weight: 400, fill: "#b07b27", anchor: "middle", spacing: 18 })}
  ${textLines(["MENÚ DE BODA"], 1500, 750, { size: 190, weight: 600, anchor: "middle", spacing: 8 })}
  ${textLines(["Sandra Bonilla & Andrés Patiño"], 1450, 980, { size: 112, fill: "#b07b27", anchor: "middle", italic: true })}
  <line x1="650" y1="1095" x2="1340" y2="1095" stroke="#b58a35" stroke-width="5"/>
  <circle cx="1600" cy="1095" r="19" fill="#b58a35"/>
  <line x1="1860" y1="1095" x2="2550" y2="1095" stroke="#b58a35" stroke-width="5"/>
  ${textLines(["Para nuestra familia y amigos, con amor:"], 1600, 1275, { size: 70, weight: 600, anchor: "middle" })}
  ${textLines(["elige el plato que hará"], 1600, 1395, { size: 88, weight: 600, anchor: "middle" })}
  ${textLines(["este día aún más especial."], 1600, 1520, { size: 104, fill: "#b07b27", anchor: "middle", italic: true })}

  <path d="M2520 310 H3070 V1130 L2795 1380 L2520 1130Z" fill="#173b2b" stroke="#b58a35" stroke-width="10" filter="url(#softShadow)"/>
  ${textLines(["♡"], 2795, 500, { size: 100, fill: "#c59a43", anchor: "middle" })}
  ${textLines(["9 OPCIONES"], 2795, 675, { size: 78, weight: 600, fill: "#fff9e9", anchor: "middle" })}
  ${textLines(["para que llenes", "de más motivos", "hoy en esta", "celebración"], 2795, 800, { size: 68, fill: "#fff9e9", anchor: "middle", line: 1.25 })}

  ${sectionRule("ENTRADAS", 1830)}
  ${entryCards}
  ${sectionRule("PLATOS FUERTES", 2570)}
  ${mainCards}
  ${sectionRule("ACOMPAÑAMIENTOS", 4420)}

  <rect x="150" y="4490" width="2900" height="400" rx="26" fill="#fffaf0" stroke="#b58a35" stroke-width="5"/>
  <image href="${encoded.puree}" x="230" y="4515" width="360" height="300" preserveAspectRatio="xMidYMid meet"/>
  ${textLines(["Puré de Papa"], 610, 4615, { size: 60, weight: 600 })}
  ${textLines(["Suave puré de papa", "cremoso y mantequilloso."], 610, 4710, { size: 40, line: 1.25 })}
  <line x1="1065" y1="4540" x2="1065" y2="4840" stroke="#b58a35" stroke-width="4"/>
  <image href="${encoded.salad}" x="1120" y="4515" width="360" height="300" preserveAspectRatio="xMidYMid meet"/>
  ${textLines(["Ensalada Fresca"], 1500, 4615, { size: 60, weight: 600 })}
  ${textLines(["Mezcla de lechugas frescas", "con vegetales de temporada."], 1500, 4710, { size: 40, line: 1.25 })}
  <line x1="2080" y1="4540" x2="2080" y2="4840" stroke="#b58a35" stroke-width="4"/>
  <image href="${encoded.rice}" x="2115" y="4515" width="360" height="300" preserveAspectRatio="xMidYMid meet"/>
  ${textLines(["Arroz de Almendra"], 2485, 4615, { size: 60, weight: 600 })}
  ${textLines(["Arroz aromático salteado", "con almendras tostadas", "y un toque de mantequilla."], 2485, 4700, { size: 36, line: 1.2 })}

  <rect x="0" y="4930" width="3200" height="190" fill="#173b2b"/>
  <path d="M0 5080 C180 4980 330 4970 510 5020" fill="none" stroke="#b58a35" stroke-width="8" opacity=".65"/>
  <path d="M3200 5080 C3020 4980 2870 4970 2690 5020" fill="none" stroke="#b58a35" stroke-width="8" opacity=".65"/>
  ${textLines(["CON AMOR, CUIDAMOS CADA DETALLE PARA QUE DISFRUTEN DE"], 1600, 5010, { size: 53, fill: "#d4aa53", anchor: "middle", spacing: 4 })}
  ${textLines(["UNA EXPERIENCIA INOLVIDABLE."], 1600, 5080, { size: 55, fill: "#d4aa53", anchor: "middle", spacing: 5 })}
</svg>`;

await fs.writeFile(outputSvg, svg, "utf8");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPng);
console.log(JSON.stringify({ outputSvg, outputPng, width: W, height: H }));
