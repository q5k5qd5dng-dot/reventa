// Genera los carteles de fiesta (JPG 1080x1440) que se usan en el vídeo. Determinista: PRNG con semilla.
// Uso: node scripts/make-posters.mjs   (necesita playwright y assets/fonts/inter-tight-latin.woff2)
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const font = fs.readFileSync(path.join(root, "assets/fonts/inter-tight-latin.woff2")).toString("base64");

const W = 720, H = 960;
const prng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

const defs = (id, c1, c2) => `
  <filter id="bl${id}"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="bs${id}"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="ne${id}" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="gr${id}"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0"/></filter>
  <radialGradient id="g1${id}"><stop offset="0" stop-color="${c1}" stop-opacity=".9"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2${id}"><stop offset="0" stop-color="${c2}" stop-opacity=".85"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
  <linearGradient id="bm${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

const bokeh = (r, n, cols, yMax = 520) => Array.from({ length: n }, () => {
  const c = cols[(r() * cols.length) | 0];
  return `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * yMax).toFixed(0)}" r="${(4 + r() * 26).toFixed(0)}" fill="${c}" opacity="${(0.08 + r() * 0.22).toFixed(2)}"/>`;
}).join("");

const crowd = (r, y0, fill = "#050309", arms = 0.55) => {
  let s = `<g fill="${fill}" stroke="${fill}">`;
  for (let i = 0; i < 24; i++) {
    const x = (i / 23) * (W + 80) - 40 + (r() - 0.5) * 20, h = 40 + r() * 80, y = y0 - h, hr = 16 + r() * 9;
    s += `<circle cx="${x}" cy="${y}" r="${hr}" stroke="none"/><ellipse cx="${x}" cy="${y + hr + 34}" rx="${hr + 18}" ry="46" stroke="none"/>`;
    if (r() < arms) s += `<path d="M${x} ${y + hr + 8} L${x + (r() - 0.5) * 60} ${y - 52 - r() * 30}" stroke-width="13" stroke-linecap="round" fill="none"/>`;
  }
  return s + `<rect x="0" y="${y0 + 20}" width="${W}" height="${H - y0}" stroke="none"/></g>`;
};

const title = (id, t, y, size, glow, sub, subY, fill = "#fff") => `
  <g text-anchor="middle" font-family="IT, system-ui" font-weight="800" filter="url(#ne${id})">
    <text x="${W / 2 - 3}" y="${y - 3}" font-size="${size}" fill="none" stroke="${glow}" stroke-width="3" letter-spacing="${-size * 0.03}">${t}</text>
    <text x="${W / 2}" y="${y}" font-size="${size}" fill="${fill}" letter-spacing="${-size * 0.03}">${t}</text>
  </g>
  <text x="${W / 2}" y="${subY}" text-anchor="middle" font-family="IT, system-ui" font-weight="600" font-size="26" letter-spacing="9" fill="#fff" opacity=".85">${sub}</text>`;

const wrap = (id, body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${bg.defs}</defs><rect width="${W}" height="${H}" fill="${bg.fill}"/>${body}<rect width="${W}" height="${H}" filter="url(#gr${id})" opacity=".13" style="mix-blend-mode:overlay"/></svg>`;

const P = {};

P.neon = () => { const r = prng(11), id = "a";
  return wrap(id, `
  <circle cx="170" cy="260" r="430" fill="url(#g1a)"/><circle cx="560" cy="200" r="380" fill="url(#g2a)"/>
  <g filter="url(#bla)" opacity=".55"><polygon points="90,-20 170,-20 360,980 240,980" fill="url(#bma)"/><polygon points="470,-20 560,-20 700,980 520,980" fill="url(#bma)" opacity=".75"/><polygon points="300,-20 360,-20 560,980 440,980" fill="url(#bma)" opacity=".55"/></g>
  ${bokeh(r, 22, ["#21aec0", "#ff3d8b", "#fff"])}
  ${crowd(r, 880)}
  ${title(id, "SALA NEÓN", 290, 104, "#21aec0", "SÁBADO · 23:30", 360)}
  <text x="360" y="470" text-anchor="middle" font-family="IT" font-weight="600" font-size="22" letter-spacing="6" fill="#fff" opacity=".7">DJ CASSINO · SANTI B.</text>`,
  { fill: "#0a0714", defs: defs(id, "#21aec0", "#ff3d8b") }); };

P.aurora = () => { const r = prng(23), id = "b";
  const fan = Array.from({ length: 13 }, (_, i) => { const a = -62 + i * 10.4; return `<polygon points="360,-30 ${360 + Math.tan(a * Math.PI / 180) * 1100 - 20},1000 ${360 + Math.tan(a * Math.PI / 180) * 1100 + 20},1000" fill="url(#bmb)" opacity="${0.35 + (i % 2) * 0.2}"/>`; }).join("");
  return wrap(id, `
  <circle cx="360" cy="150" r="520" fill="url(#g1b)"/><circle cx="640" cy="780" r="360" fill="url(#g2b)"/>
  <g filter="url(#bsb)">${fan}</g>
  ${bokeh(r, 18, ["#a855f7", "#ec4899", "#fff"], 700)}
  ${crowd(r, 900, "#04020a", 0.8)}
  ${title(id, "AURORA", 300, 138, "#c084fc", "CLUB · 00:00", 372)}`,
  { fill: "#12061f", defs: defs(id, "#8b5cf6", "#ec4899") }); };

P.noir = () => { const r = prng(37), id = "c";
  return wrap(id, `
  <circle cx="360" cy="420" r="500" fill="url(#g1c)" opacity=".5"/>
  <g filter="url(#blc)" opacity=".7"><polygon points="360,420 -60,-40 140,-40" fill="url(#bmc)"/><polygon points="360,420 580,-40 780,-40" fill="url(#bmc)"/><polygon points="360,420 260,-40 460,-40" fill="url(#bmc)" opacity=".6"/></g>
  <g fill="#050505"><path d="M270 960 L285 600 Q360 560 435 600 L450 960Z"/><circle cx="360" cy="520" r="46"/><path d="M300 505 Q360 440 420 505" stroke="#050505" stroke-width="16" fill="none"/><path d="M296 620 L205 470 M424 620 L515 470" stroke="#050505" stroke-width="34" stroke-linecap="round"/><circle cx="205" cy="466" r="22"/><circle cx="515" cy="466" r="22"/><rect x="110" y="720" width="500" height="240" rx="8"/></g>
  <g fill="none" stroke="#8a8a8a" stroke-width="3" opacity=".7"><circle cx="230" cy="800" r="56"/><circle cx="490" cy="800" r="56"/><circle cx="230" cy="800" r="16"/><circle cx="490" cy="800" r="16"/></g>
  ${title(id, "NOIR", 220, 190, "#e5e5e5", "LUNES A DOMINGO", 290, "#f5f5f5")}`,
  { fill: "#0b0b0c", defs: defs(id, "#9a9a9a", "#555") }); };

P.sol = () => { const r = prng(53), id = "d";
  const palms = [[90, 1], [630, -1]].map(([x, d]) => `<g transform="translate(${x} 960) scale(${d} 1)" fill="#12040a"><rect x="-8" y="-420" width="16" height="420"/>${[-70, -35, 0, 35, 70].map((a) => `<path d="M0 -420 C${a * 2} ${-470 + Math.abs(a)} ${a * 3.4} ${-400 + Math.abs(a) * 2} ${a * 4.4} ${-340 + Math.abs(a) * 3} C${a * 3} ${-420 + Math.abs(a) * 2} ${a} ${-440} 0 -420Z"/>`).join("")}</g>`).join("");
  return wrap(id, `
  <rect width="${W}" height="${H}" fill="url(#sg)"/><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a3a"/><stop offset=".45" stop-color="#e9446a"/><stop offset=".72" stop-color="#ff9a3c"/><stop offset="1" stop-color="#3a0d2a"/></linearGradient></defs>
  <circle cx="360" cy="600" r="190" fill="#ffd36e"/><circle cx="360" cy="600" r="420" fill="url(#g2d)"/>
  <rect x="0" y="690" width="${W}" height="270" fill="#1c0a1f"/><g opacity=".5">${Array.from({ length: 7 }, (_, i) => `<rect x="${360 - 150 + i * 6}" y="${700 + i * 26}" width="${300 - i * 12}" height="6" rx="3" fill="#ffd36e"/>`).join("")}</g>
  ${palms}
  ${bokeh(r, 20, ["#ffd36e", "#fff", "#ff7aa8"], 420)}
  ${title(id, "TERRAZA SOL", 250, 80, "#ffb454", "VIERNES · 22:00", 318)}`,
  { fill: "#2a0a3a", defs: defs(id, "#ff7a3c", "#ffb454") }); };

P.afterglow = () => { const r = prng(71), id = "e";
  return wrap(id, `
  <circle cx="360" cy="560" r="520" fill="url(#g2e)"/><circle cx="360" cy="560" r="250" fill="#ff4d1f"/><circle cx="360" cy="560" r="250" fill="url(#g1e)" opacity=".8"/>
  <g filter="url(#bse)" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<ellipse cx="360" cy="${330 + i * 55}" rx="${300 - Math.abs(4 - i) * 20}" ry="3" fill="#ffd1b0"/>`).join("")}</g>
  ${bokeh(r, 16, ["#ff8a5c", "#ffd1b0"], 900)}
  ${title(id, "AFTERGLOW", 190, 92, "#ff7849", "CLUB · DOMINGOS", 250)}`,
  { fill: "#1a0505", defs: defs(id, "#ff6a2c", "#ff3d1f") }); };

P.onda = () => { const r = prng(89), id = "f";
  return wrap(id, `
  <circle cx="360" cy="520" r="520" fill="url(#g1f)" opacity=".7"/>
  ${Array.from({ length: 9 }, (_, i) => `<circle cx="360" cy="560" r="${70 + i * 52}" fill="none" stroke="#5eead4" stroke-width="${i % 3 === 0 ? 4 : 2}" opacity="${0.75 - i * 0.07}"/>`).join("")}
  <circle cx="360" cy="560" r="46" fill="#0b2b30" stroke="#5eead4" stroke-width="4"/>
  <g filter="url(#bsf)" opacity=".6"><path d="M-20 700 C140 630 220 780 360 700 S580 640 740 720 V980 H-20Z" fill="#0f766e"/></g>
  ${bokeh(r, 14, ["#5eead4", "#fff", "#2dd4bf"], 500)}
  ${title(id, "ONDA", 220, 190, "#5eead4", "SÁBADO · 01:00", 290)}`,
  { fill: "#04181c", defs: defs(id, "#14b8a6", "#0ea5e9") }); };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1.5 });
for (const [name, make] of Object.entries(P)) {
  const svg = make();
  await page.setContent(`<style>@font-face{font-family:IT;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900}html,body{margin:0;background:#000}svg{display:block}</style>${svg}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(root, `assets/posters/${name}.jpg`), type: "jpeg", quality: 90 });
  console.log("poster", name);
}
await browser.close();
