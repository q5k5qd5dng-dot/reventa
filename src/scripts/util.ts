import { gsap } from "gsap";
import { animate, spring } from "motion";

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
export const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} €`;

/** addEventListener con AbortSignal */
export function on<K extends keyof HTMLElementEventMap>(el: EventTarget | null | undefined, type: string, fn: (e: any) => void, sig?: AbortSignal, opts: AddEventListenerOptions = {}) {
  el?.addEventListener(type, fn, { ...opts, signal: sig });
}
export function every(sig: AbortSignal, ms: number, fn: () => void) {
  const id = setInterval(fn, ms);
  sig.addEventListener("abort", () => clearInterval(id));
}

/* ───────── almacenamiento seguro ───────── */
const mem: Record<string, string> = {};
export const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem("ht:" + k) ?? mem[k];
      return v ? (JSON.parse(v) as T) : d;
    } catch {
      return mem[k] ? (JSON.parse(mem[k]) as T) : d;
    }
  },
  set(k: string, v: unknown) {
    const s = JSON.stringify(v);
    mem[k] = s;
    try {
      localStorage.setItem("ht:" + k, s);
    } catch {
      /* sin almacenamiento */
    }
  },
};
export interface User { name: string; email: string }
export const getUser = () => store.get<User | null>("user", null);

/* ───────── toast ───────── */
export function toast(msg: string, icon = "✓", live = false) {
  const host = document.getElementById("toasts");
  if (!host) return;
  const t = document.createElement("div");
  t.className = "toast" + (live ? " live-toast" : "");
  t.setAttribute("role", "status");
  t.innerHTML = `<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime text-black">${icon}</span><span>${msg}</span>`;
  host.appendChild(t);
  const [x, y0] = live ? [0, 30] : [-50, 30];
  gsap.set(t, { xPercent: live ? 0 : x });
  animate(t, { opacity: [0, 1], y: [y0, 0] }, { type: spring, stiffness: 300, damping: 24 });
  setTimeout(() => {
    animate(t, { opacity: 0, y: 20 }, { duration: 0.3 }).finished.then(() => t.remove());
  }, live ? 4200 : 3000);
}

/* ───────── QR decorativo (determinista) ───────── */
export function paintQR(el: HTMLElement, seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h >>> 0) % 1000) / 1000);
  const N = 13;
  const finder = (x: number, y: number): boolean | null => {
    const corners: [number, number][] = [[0, 0], [N - 4, 0], [0, N - 4]];
    for (const [ox, oy] of corners) {
      if (x >= ox && x < ox + 4 && y >= oy && y < oy + 4) {
        const bx = x - ox, by = y - oy;
        return bx === 0 || by === 0 || bx === 3 || by === 3 || (bx === 1 && by === 1);
      }
    }
    return null;
  };
  el.innerHTML = "";
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const f = finder(x, y);
      const i = document.createElement("i");
      const on = f === null ? rnd() > 0.52 : f;
      if (!on) i.className = "off";
      el.appendChild(i);
    }
}

/* ───────── scramble de texto ───────── */
const GLYPHS = "!<>-_\\/[]{}—=+*^?#ABCXYZ0123456789";
export function scramble(el: HTMLElement, dur = 0.6) {
  const final = el.dataset.orig ?? (el.dataset.orig = el.textContent ?? "");
  const o = { p: 0 };
  gsap.killTweensOf(o);
  gsap.to(o, {
    p: 1, duration: dur, ease: "none",
    onUpdate: () => {
      const n = Math.floor(o.p * final.length);
      el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    },
    onComplete: () => (el.textContent = final),
  });
}

/* ───────── contador animado ───────── */
export function countTo(el: HTMLElement, to: number, dec = 0, pre = "", suf = "", dur = 1.8) {
  const o = { v: 0 };
  return gsap.to(o, { v: to, duration: dur, ease: "power2.out", onUpdate: () => (el.textContent = pre + o.v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf) });
}

/* ───────── PRNG con semilla ───────── */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function shake(el: HTMLElement) {
  animate(el, { x: [0, -10, 10, -8, 8, -4, 0] }, { duration: 0.45 });
}
