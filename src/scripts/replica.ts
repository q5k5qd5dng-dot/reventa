import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, hover, press, stagger } from "motion";
import { $, $$, toast, reduced, fine } from "./util";
import {
  SPRING, closeSheet, modalEvents, renderUser, matchEvents, nameOf, artBg, esc, byId, store, getUser, fechaLarga,
} from "./r-core";
import { openLogin, openSell } from "./r-sheets";
import { renderEvent, initEvent, renderSearch, initSearch, renderTickets, initTickets, renderListings, initListings } from "./r-views";
import { initSell } from "./r-sell";
import { renderHelp, initHelp, renderProfile, initProfile, renderPick, initPick } from "./r-pages";
import * as W from "./r-wizard";
import { renderLegal, initLegal } from "./r-legal";
import { legalBy } from "../data/legal";
import { intro, heroSearch, carousels, cards, reveals, why, phone, cookies, placeTooltip } from "./r-home";

gsap.registerPlugin(ScrollTrigger);

/* ═════ Rutas ═════ */
type Name = "home" | "event" | "search" | "sell" | "tickets" | "listings" | "help" | "profile" | "pick" | "wizard" | "legal";
interface Route { name: Name; arg?: string; ti?: number; li?: number; sub?: string; art?: string }
const VIEW: Record<Name, string> = { home: "#v-home", event: "#v-event", search: "#v-search", sell: "#v-sell", tickets: "#v-tickets", listings: "#v-listings", help: "#v-help", profile: "#v-profile", pick: "#v-pick", wizard: "#v-wizard", legal: "#v-legal" };
const MODE = (r: Route) => (r.name === "home" ? "home" : r.name === "event" && r.li == null ? "dark" : "light");
const needsUser = (r: Route) => ["tickets", "listings", "profile", "pick", "wizard"].includes(r.name);

function parse(): Route {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const [a, ...rest] = h.split("/");
  const arg = rest.join("/");
  switch (a) {
    case "evento": { const [i, t, l] = arg.split("/"); return byId(i) ? { name: "event", arg: i, ti: t != null && t !== "" ? +t : undefined, li: l != null && l !== "" ? +l : undefined } : { name: "home" }; }
    case "buscar": return { name: "search", arg };
    case "vender": {
      if (arg === "evento") return { name: "pick" };
      if (["anuncio", "entradas", "precio", "informacion", "pago"].includes(arg)) return { name: "wizard", sub: arg };
      return { name: "sell" };
    }
    case "ayuda": { const [c, ar] = arg.split("/"); return { name: "help", arg: c || undefined, art: ar || undefined }; }
    case "legal": return { name: "legal", arg: arg || "terminos" };
    case "perfil": return { name: "profile", sub: arg === "pagos" ? "pagos" : "perfil" };
    case "mis-entradas": return { name: "tickets" };
    case "mis-anuncios": return { name: "listings" };
    default: return { name: "home" };
  }
}

let current: Route | null = null;
let ctx: gsap.Context | null = null;
let ac: AbortController | null = null;
let homeReady = false;
let homeTriggers: ScrollTrigger[] = [];

function title(r: Route) {
  const ev = r.name === "event" && r.arg ? byId(r.arg) : undefined;
  const t: Record<Name, string> = { home: "Reventa de entradas segura y legal", event: ev ? nameOf(ev) : "Evento", search: r.arg ? `Resultados para ${r.arg}` : "Eventos", sell: "Vender entradas online de forma rápida y segura", tickets: "Entradas compradas", listings: "Tus anuncios", help: "Centro de ayuda", profile: "Perfil", pick: "Selecciona el evento", wizard: "Completa tu anuncio", legal: legalBy(r.arg)?.n ?? "Legal" };
  document.title = `${t[r.name]} · Handticket`;
}

function ensureHome() {
  if (homeReady) return;
  homeReady = true;
  const before = new Set(ScrollTrigger.getAll());
  heroSearch(); carousels(); cards(); reveals(); why(); phone(); intro(0.15);
  homeTriggers = ScrollTrigger.getAll().filter((t) => !before.has(t));
}

function show(r: Route, first: boolean) {
  const hdr = $("#hdr")!;
  hdr.dataset.hdr = MODE(r);
  const minimal = r.name === "pick" || r.name === "wizard";
  document.body.classList.toggle("hdr-min", minimal);
  if (minimal) { const a = $("#hmin-a")!; if (r.name === "pick") { a.textContent = "Ver todo"; a.setAttribute("href", "#/vender/anuncio"); } else if (r.sub === "anuncio") { a.textContent = "Volver"; a.setAttribute("href", "#/vender/evento"); } else { a.textContent = "Ver todo"; a.setAttribute("href", "#/vender/anuncio"); } }
  $$(".view").forEach((v) => v.classList.add("hidden"));
  const el = $(VIEW[r.name])!;
  el.classList.remove("hidden");
  scrollTo(0, 0);
  ac?.abort(); ctx?.revert(); ctx = null;
  // limpiamos los triggers de otras vistas; los de la portada se conservan
  ScrollTrigger.getAll().forEach((t) => { if (!homeTriggers.includes(t)) t.kill(false); });
  ac = new AbortController();
  const sig = ac.signal;
  title(r);

  const rerender = () => { current = null; route(); };
  switch (r.name) {
    case "home":
      ensureHome();
      break;
    case "event":
      el.innerHTML = renderEvent(r.arg!, r.ti, r.li);
      ctx = gsap.context(() => initEvent(el, r.arg!, sig, r.ti, r.li));
      break;
    case "search":
      el.innerHTML = renderSearch(r.arg ?? "");
      ctx = gsap.context(() => initSearch(el, r.arg ?? "", sig));
      break;
    case "sell":
      ctx = gsap.context(() => initSell(el, sig));
      break;
    case "tickets":
      el.innerHTML = renderTickets();
      ctx = gsap.context(() => initTickets(el, sig, rerender));
      break;
    case "listings":
      el.innerHTML = renderListings();
      ctx = gsap.context(() => initListings(el, sig, rerender));
      break;
    case "help":
      el.innerHTML = renderHelp(r.arg, r.art);
      ctx = gsap.context(() => initHelp(el, r.arg, r.art, sig));
      break;
    case "profile":
      el.innerHTML = renderProfile(r.sub as "perfil" | "pagos");
      ctx = gsap.context(() => initProfile(el, r.sub as "perfil" | "pagos", sig));
      break;
    case "legal":
      el.innerHTML = renderLegal(r.arg);
      ctx = gsap.context(() => initLegal(el, sig));
      break;
    case "pick":
      el.innerHTML = renderPick();
      ctx = gsap.context(() => initPick(el, sig));
      break;
    case "wizard": {
      const s2 = r.sub!;
      el.innerHTML = s2 === "anuncio" ? W.renderHub() : s2 === "entradas" ? W.renderTickets() : s2 === "precio" ? W.renderPrice() : s2 === "informacion" ? W.renderInfo() : W.renderPay();
      ctx = gsap.context(() => (s2 === "anuncio" ? W.initHub(el, sig) : s2 === "entradas" ? W.initTickets(el, sig, rerender) : s2 === "precio" ? W.initPrice(el, sig) : s2 === "informacion" ? W.initInfo(el, sig) : W.initPay(el, sig)));
      break;
    }
  }
  if (!first && !reduced) gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out", clearProps: "opacity,visibility" });
  current = r;
  closeMenu();
  closePalette();
  requestAnimationFrame(() => { ScrollTrigger.refresh(); if (r.name === "home") placeTooltip(); });
  headerState();
}

function route(first = false) {
  const r = parse();
  if (!first && current && current.name === r.name && current.arg === r.arg && current.ti === r.ti && current.li === r.li && current.sub === r.sub && current.art === r.art) return;
  if (needsUser(r) && !getUser()) {
    store.set("next", location.hash);
    toast(r.name === "tickets" || r.name === "listings" ? "Inicia sesión para ver tus " + (r.name === "tickets" ? "entradas" : "anuncios") : "Inicia sesión para continuar", "i");
    if (!current) show({ name: "home" }, first);
    else history.replaceState(null, "", current.name === "home" ? "#/" : location.hash);
    openLogin("login");
    return;
  }
  // el asistente necesita un evento elegido
  if (r.name === "wizard" && !W.getDraft().ev) { location.hash = "#/vender/evento"; return; }
  if (r.name === "wizard" && r.sub !== "anuncio" && r.sub !== "entradas" && !(W.getDraft().files.some((f) => f.pages.some((p) => p.ok && p.sel)))) { location.hash = "#/vender/entradas"; return; }
  show(r, first);
}

/* ═════ Cabecera ═════ */
function headerState() {
  const h = $("#hdr")!;
  h.classList.toggle("solid", scrollY > 60 && h.dataset.hdr !== "light");
}
let lastY = 0;
function header() {
  const h = $("#hdr")!;
  addEventListener("scroll", () => {
    const y = scrollY;
    headerState();
    h.classList.toggle("hide", y > lastY + 4 && y > 520);
    if (y < lastY - 4) h.classList.remove("hide");
    lastY = y;
  }, { passive: true });
  if (fine && !reduced) {
    hover("#hdr .hb, #hdr .hs, #hdr .hs2, #hdr nav a", (el) => { animate(el, { y: -2 }, SPRING); return () => animate(el, { y: 0 }, SPRING); });
    $("#logo")!.addEventListener("pointerenter", () => gsap.fromTo("#logo", { scale: 1 }, { scale: 1.06, duration: 0.5, ease: "elastic.out(1,0.4)", yoyo: true, repeat: 1 }));
  }
  press("#hdr button, #hdr a", (el) => { animate(el, { scale: 0.95 }, { duration: 0.1 }); return () => animate(el, { scale: 1 }, SPRING); });
}

/* ═════ Menú de cuenta ═════ */
function closeMenu() {
  const m = $("#acc-menu")!;
  if (m.classList.contains("hidden")) return;
  animate(m, { opacity: 0, y: -8 }, { duration: 0.15 }).finished.then(() => m.classList.add("hidden"));
  $("#avatar")?.setAttribute("aria-expanded", "false");
  $("#menu-btn")?.setAttribute("aria-expanded", "false");
}
function menu() {
  const m = $("#acc-menu")!;
  const toggle = () => {
    if (!m.classList.contains("hidden")) return closeMenu();
    m.classList.remove("hidden");
    $("#avatar")!.setAttribute("aria-expanded", "true");
    $("#menu-btn")!.setAttribute("aria-expanded", "true");
    animate(m, { opacity: [0, 1], y: [-10, 0], scale: [0.96, 1] }, SPRING);
    if (!reduced) animate($$("a, button", m), { opacity: [0, 1], x: [-8, 0] }, { delay: stagger(0.04), duration: 0.25 });
  };
  $("#avatar")!.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  $("#menu-btn")!.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener("click", (e) => { const t = e.target as HTMLElement; if (!t.closest("#acc-menu") || t.closest("#acc-menu a")) closeMenu(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  $("#m-profile")!.addEventListener("click", () => { closeMenu(); location.hash = "#/perfil"; });
  $("#m-help")!.addEventListener("click", () => { closeMenu(); location.hash = "#/ayuda"; });
  $("#logout")!.addEventListener("click", () => {
    store.set("user", null); renderUser(); closeMenu(); toast("Sesión cerrada", "👋");
    if (current && (current.name === "tickets" || current.name === "listings")) location.hash = "#/";
  });
}

/* ═════ Paleta de búsqueda (icono de la cabecera, / y Ctrl+K) ═════ */
const sp = () => $("#sp")!;
function closePalette() {
  const o = sp();
  if (!o.classList.contains("open")) return;
  o.classList.remove("open"); o.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
}
function palette() {
  const o = sp(), q = $<HTMLInputElement>("#sp-q")!, list = $("#sp-list")!;
  const draw = () => {
    const t = q.value.trim();
    const m = matchEvents(t).slice(0, 6);
    list.innerHTML = m.length
      ? m.map((e) => `<li><a href="#/evento/${e.id}" class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-soft focus:bg-soft focus:outline-none"><span class="card-art h-12 w-12 shrink-0 !rounded-lg"><span class="art block h-full w-full" style="${artBg(e.id)}"></span></span><span class="min-w-0 flex-1"><b class="block truncate text-sm font-medium">${esc(nameOf(e))}</b><span class="block truncate text-xs text-sub">${fechaLarga(e.date)} · ${esc(e.c)}</span></span><span class="text-sm font-semibold text-accent">${e.p} €</span></a></li>`).join("") + (t ? `<li><a href="#/buscar/${encodeURIComponent(t)}" class="mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-accent transition hover:bg-soft">Ver todos los resultados</a></li>` : "")
      : `<li class="px-4 py-8 text-center text-sm text-sub">No hay eventos para «${esc(t)}».</li>`;
    if (!reduced) animate(list.children as unknown as Element[], { opacity: [0, 1], y: [8, 0] }, { delay: stagger(0.03), duration: 0.25 });
  };
  const open = () => {
    o.classList.add("open"); o.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    animate("#sp-box", { opacity: [0, 1], y: [-24, 0], scale: [0.97, 1] }, SPRING);
    q.value = ""; draw(); setTimeout(() => q.focus(), 60);
  };
  $("#open-search")!.addEventListener("click", open);
  o.addEventListener("click", (e) => { if (e.target === o || (e.target as HTMLElement).closest("a")) closePalette(); });
  q.addEventListener("input", draw);
  q.addEventListener("keydown", (e) => {
    const items = $$<HTMLAnchorElement>("a", list);
    if (e.key === "Enter") { e.preventDefault(); const t = q.value.trim(); closePalette(); location.hash = `#/buscar/${encodeURIComponent(t)}`; }
    if (e.key === "ArrowDown" && items[0]) { e.preventDefault(); items[0].focus(); }
  });
  list.addEventListener("keydown", (e) => {
    const items = $$<HTMLAnchorElement>("a", list), i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); i <= 0 ? q.focus() : items[i - 1].focus(); }
  });
  addEventListener("keydown", (e) => {
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === "Escape") closePalette();
    if (((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag))) { e.preventDefault(); if (!$("#ov")!.classList.contains("open")) open(); }
  });
}

/* ═════ Interacciones globales ═════ */
function globals() {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-store]")) { e.preventDefault(); toast("Próximamente en las tiendas de apps", "📱"); return; }
    if (t.closest("[data-soon]")) { e.preventDefault(); toast("Próximamente", "⏳"); return; }
    if (t.closest("[data-sell]") || t.closest("#sell-btn") || t.closest("#sell-btn2")) { e.preventDefault(); openSell(); return; }
    if (t.closest("#login-btn")) { openLogin(); return; }
    const a = t.closest<HTMLAnchorElement>("a[href^='#']");
    if (a) {
      const h = a.getAttribute("href")!;
      if (h.startsWith("#/")) {
        if (h === location.hash || (h === "#/" && !location.hash)) { e.preventDefault(); scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }
      } else { e.preventDefault(); if (h === "#") scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); else document.querySelector(h)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }
    }
    const b = t.closest<HTMLElement>(".btn");
    if (b && !reduced) {
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  });
  addEventListener("hashchange", () => { closeSheet(); route(); });
  addEventListener("ht:rerender", () => { current = null; route(); });
}

/* ═════ Arranque ═════ */
function boot() {
  renderUser();
  header();
  menu();
  palette();
  modalEvents();
  globals();
  cookies();
  route(true);
  document.fonts?.ready.then(() => { ScrollTrigger.refresh(); placeTooltip(); });
  addEventListener("load", () => ScrollTrigger.refresh());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
