import { gsap } from "gsap";
import { animate, spring } from "motion";
import { $, $$, shake, reduced, store, getUser, type User } from "./util";
import { events, byId, fechaLarga, type Ev } from "../data/events";
import { extra } from "../data/extra";
import art from "../data/art.json";
import { initialColor } from "./avatars";

export const SPRING = { type: spring, stiffness: 320, damping: 28 } as const;
export const FEE = 0.08;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const nameOf = (e: Ev) => extra[e.id].name;
export const artBg = (id: string) => `background-image:var(--art-${id})`;
export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const tintOf = (id: string) => (art as Record<string, { tint: string }>)[id]?.tint ?? "#444";

const CATS: Record<string, string[]> = {
  musica: ["musica", "concierto", "conciertos", "gira"],
  festival: ["festival", "festivales"],
  deporte: ["deporte", "deportes", "futbol", "liga", "baloncesto"],
  teatro: ["teatro", "musical", "musicales"],
  club: ["club", "discoteca", "discotecas", "techno", "sala"],
};

/** Búsqueda: título, artista, recinto, ciudad, categoría y personas relacionadas. */
export function matchEvents(q: string): Ev[] {
  const t = norm(q.trim());
  if (!t) return events.slice();
  const words = t.split(/\s+/);
  const catHit = Object.entries(CATS).find(([, a]) => a.includes(t))?.[0];
  return events.filter((e) => {
    const x = extra[e.id];
    const hay = norm([e.t, e.a, e.v, e.c, x.name, x.area, x.people.join(" "), x.tickets.map((k) => k.n).join(" ")].join(" "));
    return (catHit && e.cat === catHit) || words.every((w) => hay.includes(w));
  });
}
export const matchPeople = (q: string) => {
  const t = norm(q.trim());
  if (!t) return [];
  const all = [...new Set(events.flatMap((e) => extra[e.id].people))];
  return all.filter((p) => norm(p).includes(t));
};

/** Tarjeta de evento (misma que en las secciones de portada). */
export function cardHTML(e: Ev, extraCls = "") {
  return `<article class="w-full ${extraCls}" data-card data-cat="${e.cat}"><a href="#/evento/${e.id}" class="block w-full text-left" aria-label="Ver ${esc(e.t)}"><div class="card-art aspect-square"><div class="art h-full w-full" style="${artBg(e.id)}"></div></div><p class="mt-3.5 text-sm text-accent">${fechaLarga(e.date)}</p><p class="mt-0.5 truncate text-base font-medium">${esc(nameOf(e))}</p><p class="truncate text-sm text-sub">${esc(e.v)}, ${esc(e.c)}</p></a></article>`;
}

/* ═════ Usuario ═════ */
export const user = (): User | null => getUser();
export function renderUser() {
  const u = getUser();
  document.body.classList.toggle("is-logged", !!u);
  const av = $("#avatar");
  if (av && u) { av.textContent = u.name[0].toUpperCase(); av.style.background = initialColor(u.name); }
  const mav = $("#acc-av");
  if (mav && u) { mav.textContent = u.name[0].toUpperCase(); mav.style.background = initialColor(u.name); }
  if (u) { $("#acc-name")!.textContent = u.name; $("#acc-email")!.textContent = u.email; }
}

/* ═════ Hoja modal ═════ */
let lastFocus: HTMLElement | null = null;
export function openSheet(html: string, mount?: (s: HTMLElement) => void) {
  const o = $("#ov")!, s = $("#sheet")!;
  const was = o.classList.contains("open");
  if (!was) lastFocus = document.activeElement as HTMLElement;
  s.innerHTML = html;
  o.classList.add("open");
  o.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (!was) {
    gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    animate(s, innerWidth < 640 ? { y: ["100%", "0%"] } : { opacity: [0, 1], y: [50, 0], scale: [0.95, 1] }, { type: spring, stiffness: 300, damping: 32 });
  } else if (!reduced) animate(s, { opacity: [0.4, 1], y: [14, 0] }, SPRING);
  s.scrollTop = 0;
  mount?.(s);
  s.focus({ preventScroll: true });
}
export async function closeSheet() {
  const o = $("#ov")!, s = $("#sheet")!;
  if (!o.classList.contains("open")) return;
  gsap.to(o, { opacity: 0, duration: 0.25 });
  await animate(s, innerWidth < 640 ? { y: "100%" } : { opacity: 0, y: 30, scale: 0.97 }, { duration: 0.28 }).finished;
  o.classList.remove("open");
  o.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  s.innerHTML = "";
  s.style.cssText = "";
  gsap.set(o, { clearProps: "opacity" });
  lastFocus?.focus?.({ preventScroll: true });
}
export const closeBtn = `<button type="button" data-close class="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white" aria-label="Cerrar"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
export const spinner = `<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>`;

export function modalEvents() {
  const o = $("#ov")!;
  o.addEventListener("click", (e) => { if (e.target === o || (e.target as HTMLElement).closest("[data-close]")) closeSheet(); });
  addEventListener("keydown", (e) => {
    if (!o.classList.contains("open")) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "Tab") {
      const f = $$<HTMLElement>("button, input, select, a[href], [tabindex]:not([tabindex='-1'])", $("#sheet")!).filter((x) => !x.hasAttribute("disabled") && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ═════ Formularios ═════ */
export function field(id: string, label: string, type = "text", extraAttrs = "") {
  return `<div class="fld"><input id="${id}" type="${type}" placeholder=" " ${extraAttrs} /><label for="${id}">${label}</label><p class="msg" aria-live="polite"></p></div>`;
}
export function err(input: HTMLInputElement, msg: string) {
  const f = input.closest(".fld") as HTMLElement;
  f.classList.toggle("err", !!msg);
  (f.querySelector(".msg") as HTMLElement).textContent = msg;
  if (msg) shake(f);
  return !msg;
}

export { events, byId, fechaLarga, extra, store, getUser };
export type { Ev };
