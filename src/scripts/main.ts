import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, $$, toast, reduced, getUser, store, scramble } from "./util";
import { initScroll, initNav, initCursor, initDelegated, scrollTop, scrollToEl, lenis } from "./global";
import * as Home from "./v-home";
import * as Explore from "./v-explore";
import * as Event_ from "./v-event";
import * as Auth from "./v-auth";
import * as Checkout from "./v-checkout";
import * as Sell from "./v-sell";
import * as Account from "./v-account";
import * as Help from "./v-help";
import { events } from "../data/events";

gsap.registerPlugin(ScrollTrigger);

interface Route { name: string; param?: string }
const VIEW: Record<string, string> = { home: "#v-home", eventos: "#v-eventos", evento: "#v-evento", login: "#v-login", checkout: "#v-checkout", vender: "#v-vender", cuenta: "#v-cuenta", ayuda: "#v-ayuda" };
const TITLE: Record<string, string> = { home: "Reventa de entradas segura y legal", eventos: "Eventos", login: "Acceso", checkout: "Checkout", vender: "Vender entradas", cuenta: "Mi cuenta", ayuda: "Centro de ayuda" };

const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, "");
  const [a, b] = h.split("/");
  if (!a) return { name: "home" };
  if (a === "registro") return { name: "login", param: "register" };
  return VIEW[a] ? { name: a, param: b } : { name: "home" };
};

let ctx: gsap.Context | null = null;
let ac: AbortController | null = null;
let running = false;
let queued = false;
let current: Route | null = null;
let introDelay = 0;

function swap(r: Route) {
  ac?.abort();
  ctx?.revert();
  ScrollTrigger.getAll().forEach((t) => t.kill());
  $$(".view").forEach((v) => v.classList.remove("active"));
  $(VIEW[r.name])!.classList.add("active");
  scrollTop();
  document.title = (r.name === "evento" ? "Evento" : TITLE[r.name] ?? "Handticket") + " · Handticket";
  ac = new AbortController();
  const sig = ac.signal;
  ctx = gsap.context(() => {
    switch (r.name) {
      case "home": Home.init(sig, introDelay); break;
      case "eventos": Explore.init(sig); break;
      case "evento": Event_.init(sig, r.param ?? ""); break;
      case "login": Auth.init(sig, r.param === "register" ? "register" : "login"); break;
      case "checkout": Checkout.init(sig); break;
      case "vender": Sell.init(sig); break;
      case "cuenta": Account.init(sig); break;
      case "ayuda": Help.init(sig); break;
    }
  });
  introDelay = 0;
  current = r;
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function route(first = false) {
  if (running) { queued = true; return; }
  const r = parse();
  if (!first && current && current.name === r.name && current.param === r.param) return;
  // misma vista con otro parámetro: sin cortina larga
  if (first || reduced) { swap(r); return; }
  running = true;
  lenis?.stop();
  const bars = $$("#curtain i");
  const tl = gsap.timeline({ onComplete: () => { running = false; lenis?.start(); if (queued) { queued = false; route(); } } });
  tl.set(bars, { transformOrigin: "bottom" })
    .to(bars, { scaleY: 1, duration: 0.55, stagger: 0.06, ease: "power3.inOut" })
    .add(() => swap(r))
    .set(bars, { transformOrigin: "top" })
    .to(bars, { scaleY: 0, duration: 0.65, stagger: 0.06, ease: "power3.inOut" }, "+=0.08");
}

/* ───────── Preloader ───────── */
function preloader(done: () => void) {
  const pl = $("#preloader")!, cnt = $("#pl-count")!;
  if (reduced) { pl.remove(); done(); return; }
  const path = $<SVGPathElement>("#pl-path")!;
  const L = path.getTotalLength();
  gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
  const o = { v: 0 };
  const tl = gsap.timeline();
  tl.to(path, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0)
    .to(o, { v: 100, duration: 1.8, ease: "power2.inOut", onUpdate: () => (cnt.textContent = String(Math.round(o.v))) }, 0)
    .add(() => { introDelay = 0.55; done(); }, 1.9)
    .to(pl.children, { y: -60, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, 1.9)
    .to(pl, { yPercent: -100, duration: 1, ease: "expo.inOut", onComplete: () => pl.remove() }, 2.05);
}

/* ───────── Toasts de actividad en vivo ───────── */
function liveToasts() {
  const names = ["Marta", "Pablo", "Lucía", "Hugo", "Carla", "Álex", "Noa", "Dani"], cities = ["Madrid", "Barcelona", "Sevilla", "Zaragoza", "Bilbao"];
  const loop = () => {
    const ok = document.visibilityState === "visible" && ["home", "eventos", "evento"].includes(current?.name ?? "");
    if (ok) {
      const e = events[(Math.random() * events.length) | 0], q = 1 + ((Math.random() * 3) | 0);
      toast(`<b>${names[(Math.random() * names.length) | 0]}</b> de ${cities[(Math.random() * cities.length) | 0]} acaba de comprar ${q} entrada${q > 1 ? "s" : ""} para <b>${e.t}</b>`, "🎟", true);
    }
    setTimeout(loop, 16000 + Math.random() * 9000);
  };
  setTimeout(loop, 11000);
}

function boot() {
  initScroll();
  initNav();
  initCursor();
  initDelegated();

  // enlaces ancla internos (no rutas)
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null;
    if (!a) return;
    const h = a.getAttribute("href")!;
    if (h === "#") { e.preventDefault(); toast("Próximamente en las tiendas de apps", "📱"); return; }
    if (!h.startsWith("#/")) { e.preventDefault(); const t = $(h); if (t) scrollToEl(t); return; }
    if (h === location.hash) { e.preventDefault(); scrollTop(); }
  });
  addEventListener("hashchange", () => route());

  // newsletter
  $("#newsletter")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const i = (e.currentTarget as HTMLElement).querySelector("input")!;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i.value)) { toast("¡Apuntado! Te avisaremos de nuevas entradas", "✉"); i.value = ""; } else toast("Introduce un email válido", "!");
  });
  // scramble inicial del logo del nav no necesario
  void scramble; void getUser; void store;

  preloader(() => route(true));
  liveToasts();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
