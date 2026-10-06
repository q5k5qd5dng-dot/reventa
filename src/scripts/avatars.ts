/** Avatares ilustrados (SVG) generados con semilla: no son fotos de personas reales. */
const SKIN = ["#f6d3b9", "#e8b894", "#d39a73", "#b97c56", "#8d5a3b", "#6b4229"];
const HAIR = ["#1b1410", "#3a261a", "#5a3a22", "#8a5a2b", "#c28b3c", "#d9d2c5", "#a1382b", "#2a2a40"];
const SHIRT = ["#e8590c", "#3f7bf0", "#1f9d6b", "#111118", "#f2b705", "#d6336c", "#7048e8", "#495057", "#fff"];
const BG = [["#ffe4d0", "#ffc9a3"], ["#dbe7ff", "#b9d0ff"], ["#d8f5e6", "#b4ecd0"], ["#ffe3ee", "#ffc2d9"], ["#fff3c4", "#ffe28a"], ["#e6e0ff", "#cfc4ff"], ["#e3e6ee", "#c9cfdc"]];

function rnd(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h >>> 0) % 10000) / 10000);
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

export function avatar(seed: string, uid = Math.random().toString(36).slice(2, 7)): string {
  const r = rnd(seed);
  const skin = pick(r, SKIN), hair = pick(r, HAIR), shirt = pick(r, SHIRT), [b1, b2] = pick(r, BG);
  const style = Math.floor(r() * 6), glasses = r() < 0.28, beard = r() < 0.25 && style !== 3, smile = r() < 0.5;
  const long = style === 1 || style === 4;
  const id = `av${uid}`;
  const hairBack =
    style === 1 ? `<path d="M26 56c-4-30 8-40 24-40s28 10 24 40c-1 12 2 22 0 30H26c-2-8 1-18 0-30z" fill="${hair}"/>`
    : style === 4 ? `<path d="M24 60c-6-32 10-44 26-44s32 12 26 44c-1 10 5 20 3 30H21c-2-10 4-20 3-30z" fill="${hair}"/>`
    : style === 5 ? `<circle cx="50" cy="14" r="9" fill="${hair}"/>` : "";
  const hairFront =
    style === 0 ? `<path d="M30 42c0-16 9-24 20-24s20 8 20 24c-6-8-12-11-20-11s-14 3-20 11z" fill="${hair}"/>`
    : style === 1 ? `<path d="M30 44c2-14 10-22 20-22s18 8 20 22c-8-4-14-12-20-12s-12 8-20 12z" fill="${hair}"/>`
    : style === 2 ? `<g fill="${hair}"><circle cx="34" cy="34" r="9"/><circle cx="44" cy="26" r="10"/><circle cx="56" cy="26" r="10"/><circle cx="66" cy="34" r="9"/><circle cx="50" cy="30" r="11"/></g>`
    : style === 4 ? `<path d="M28 46c2-16 10-26 22-26s20 10 22 26c-6-8-14-14-22-14s-16 6-22 14z" fill="${hair}"/>`
    : style === 5 ? `<path d="M30 42c0-14 9-22 20-22s20 8 20 22c-5-6-12-9-20-9s-15 3-20 9z" fill="${hair}"/>` : "";
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true"><defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient><clipPath id="${id}c"><circle cx="50" cy="50" r="50"/></clipPath></defs>
<g clip-path="url(#${id}c)"><rect width="100" height="100" fill="url(#${id}b)"/>${hairBack}
<path d="M16 100c0-20 14-30 34-30s34 10 34 30z" fill="${shirt}"/><path d="M42 70h16v10c0 5-3 8-8 8s-8-3-8-8z" fill="${skin}"/>
<ellipse cx="50" cy="48" rx="19" ry="22" fill="${skin}"/><ellipse cx="31" cy="50" rx="3.4" ry="5" fill="${skin}"/><ellipse cx="69" cy="50" rx="3.4" ry="5" fill="${skin}"/>
${hairFront}
${beard ? `<path d="M32 54c1 14 8 20 18 20s17-6 18-20c-3 6-9 9-18 9s-15-3-18-9z" fill="${hair}" opacity=".9"/>` : ""}
<circle cx="42" cy="49" r="2.2" fill="#2a1a12"/><circle cx="58" cy="49" r="2.2" fill="#2a1a12"/>
${glasses ? `<g fill="none" stroke="#1d1d26" stroke-width="1.8"><circle cx="42" cy="49" r="6.4"/><circle cx="58" cy="49" r="6.4"/><path d="M48.4 49h3.2"/></g>` : ""}
<path d="${smile ? "M42 59c3 4 13 4 16 0" : "M44 60c3 2 9 2 12 0"}" fill="none" stroke="#7a3b2a" stroke-width="2" stroke-linecap="round"/>
${long ? "" : ""}</g></svg>`;
}

/** Iniciales con color para el avatar de la cuenta. */
export function initialColor(name: string) {
  const r = rnd(name);
  return ["#e8590c", "#c2255c", "#1c7ed6", "#2f9e44", "#7048e8", "#f08c00"][Math.floor(r() * 6)];
}
