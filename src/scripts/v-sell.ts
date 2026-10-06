import { gsap } from "gsap";
import { $, $$, on, toast, getUser, store, eur } from "./util";
import { bindAll, splitReveal, footerFx } from "./global";
import { events, byId } from "../data/events";
import { confetti } from "./confetti";

export function init(sig: AbortSignal) {
  const root = $("#v-vender")!;
  bindAll(root, sig);
  let qty = 2;
  const ev = $<HTMLSelectElement>("#s-ev")!, price = $<HTMLInputElement>("#s-price")!, range = $<HTMLInputElement>("#s-range")!;
  const earn = $("#s-earn")!, gross = $("#s-gross")!, fee = $("#s-fee")!, sug = $("#s-sug")!, qEl = $("#s-qty")!;
  let shown = 0;
  const calc = () => {
    const g = qty * (+price.value || 0), f = Math.round(g * 0.1), e = g - f;
    gross.textContent = eur(g); fee.textContent = `−${eur(f)}`; qEl.textContent = String(qty);
    const o = { v: shown };
    gsap.to(o, { v: e, duration: 0.5, ease: "power2.out", onUpdate: () => (earn.textContent = Math.round(o.v).toString()) });
    shown = e;
  };
  const suggested = () => { const e = byId(ev.value) ?? events[0]; sug.textContent = `${e.p} €`; return e.p; };
  on(ev, "change", () => { price.value = range.value = String(suggested()); calc(); gsap.fromTo(sug, { scale: 1.4, color: "#c6ff3d" }, { scale: 1, color: "#fff", duration: 0.6 }); }, sig);
  on(price, "input", () => { range.value = price.value; calc(); }, sig);
  on(range, "input", () => { price.value = range.value; calc(); }, sig);
  $$("[data-q]", root).forEach((b) => on(b, "click", () => { qty = Math.max(1, Math.min(10, qty + +b.dataset.q!)); calc(); gsap.fromTo(qEl, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 }); }, sig));
  price.value = range.value = String(suggested());
  calc();
  on($("#sell-form"), "submit", (e: Event) => {
    e.preventDefault();
    if (!getUser()) { toast("Inicia sesión para publicar tus entradas", "!"); store.set("next", "#/vender"); location.hash = "#/login"; return; }
    if (!(+price.value > 0)) { toast("Indica un precio", "!"); return; }
    const list = store.get<{ ev: string; qty: number; price: number }[]>("selling", []);
    list.unshift({ ev: ev.value, qty, price: +price.value });
    store.set("selling", list);
    confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.5, 160);
    toast("¡Entradas publicadas! Te avisaremos cuando se vendan", "🚀");
    setTimeout(() => (location.hash = "#/cuenta"), 900);
  }, sig);
  gsap.fromTo("#sell-form, #v-vender aside", { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.3 });
  splitReveal(root);
  footerFx();
}
