import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = path.resolve(import.meta.dirname, "..");
const W = 3200;
const H = 5120;
const menuSource = path.join(root, "img", "menu", "menu-oficial.png");
const thanksSource = path.join(root, "img", "pages", "agradecimiento.png");
const menuOutput = path.join(root, "img", "menu", "menu-aprobado-final-v4.png");
const thanksOutput = path.join(root, "img", "pages", "agradecimiento-final-v4.png");

const footerHeight = 165;
const footer = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${footerHeight}">
    <rect width="${W}" height="${footerHeight}" fill="#173b2b"/>
    <text x="${W / 2}" y="70" text-anchor="middle" fill="#d4aa53"
      font-family="Georgia, 'Times New Roman', serif" font-size="48" letter-spacing="4">
      CON AMOR, CUIDAMOS CADA DETALLE PARA QUE DISFRUTEN DE
    </text>
    <text x="${W / 2}" y="132" text-anchor="middle" fill="#d4aa53"
      font-family="Georgia, 'Times New Roman', serif" font-size="50" letter-spacing="5">
      UNA EXPERIENCIA INOLVIDABLE.
    </text>
  </svg>
`);

const menuBody = await sharp(menuSource)
  .resize({
    width: W,
    height: H - footerHeight,
    fit: "contain",
    background: "#f7f1e4",
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.55 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: "#f7f1e4",
  },
})
  .composite([
    { input: menuBody, left: 0, top: 0 },
    { input: footer, left: 0, top: H - footerHeight },
  ])
  .png({ compressionLevel: 9, palette: true, colours: 256, quality: 92 })
  .toFile(menuOutput);

const thanksBody = await sharp(thanksSource)
  .resize({
    height: H,
    fit: "inside",
    withoutEnlargement: false,
    kernel: sharp.kernel.lanczos3,
  })
  .sharpen({ sigma: 0.45 })
  .png()
  .toBuffer();
const thanksMeta = await sharp(thanksBody).metadata();

await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: "#25321e",
  },
})
  .composite([
    {
      input: thanksBody,
      left: Math.round((W - thanksMeta.width) / 2),
      top: 0,
    },
  ])
  .png({ compressionLevel: 9, palette: true, colours: 256, quality: 94 })
  .toFile(thanksOutput);

console.log(JSON.stringify({
  menu: { path: menuOutput, width: W, height: H },
  thanks: { path: thanksOutput, width: W, height: H },
}));
