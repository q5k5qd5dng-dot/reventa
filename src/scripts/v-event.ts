import { gsap } from "gsap";
import { $, $$, on, every, seeded, toast, eur, store, countTo } from "./util";
import { bindAll, splitReveal, footerFx, bindTilt } from "./global";
import { events, byId, poster, type Ev } from "../data/events";

export interface Cart { id: string; seats: { label: string; price: number }[] }
const FEE = 0.08;

export function init(sig: AbortSignal, id: string) {
  const ev = byId(id);
  if (!ev) { location.hash = "#/eventos"; return; }
  fill(ev);
  const tpl = $<HTMLTemplateElement>(`template[data-poster="${ev.id}"]`);
  $("#ev-art")!.innerHTML = tpl?.innerHTML ?? "";
  $("#ev-bg")!.style.background = `radial-gradient(circle at 30% 20%, ${ev.col[0]}, transparent 60%), radial-gradient(circle at 80% 70%, ${ev.col[1]}, transparent 55%)`;

  /* Cuenta atrás */
  const cds = $$("[data-cd]");
  const tick = () => {
    let d = Math.max(0, +new Date(ev.date) - Date.now());
    const parts = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
    parts.forEach((v, i) => { const t = String(v).padStart(2, "0"); if (cds[i].textContent !== t) { cds[i].textContent = t; if (i === 3) gsap.fromTo(cds[i], { y: -8, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.3 }); } });
  };
  tick();
  every(sig, 1000, tick);

  /* Mapa de asientos */
  const svg = $<SVGSVGElement>("#seatmap")!;
  const rnd = seeded(ev.id);
  const taken = Math.max(0.15, Math.min(0.85, 1 - ev.left / 140));
  const sel = new Map<string, { label: string; price: number }>();
  const rows = 8, blocks = [{ x: 40, n: 8 }, { x: 240, n: 8 }, { x: 440, n: 8 }];
  let html = `<defs><linearGradient id="stg" x1="0" x2="1"><stop offset="0" stop-color="${ev.col[0]}"/><stop offset="1" stop-color="${ev.col[1]}"/></linearGradient></defs>
    <path d="M60 60 Q320 10 580 60 L560 92 Q320 50 80 92Z" fill="url(#stg)" opacity=".9"/><text x="320" y="68" text-anchor="middle" fill="#fff" font-size="13" font-weight="700" letter-spacing="6">ESCENARIO</text>`;
  const seats: { el?: Element; id: string }[] = [];
  blocks.forEach((b, bi) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < b.n; c++) {
        const tier = r < 2 ? 1.4 : r < 5 ? 1 : 0.8;
        const price = Math.round(ev.p * tier);
        const label = `Bloque ${"ABC"[bi]} · Fila ${r + 1} · Asiento ${c + 1}`;
        const sid = `${bi}-${r}-${c}`;
        const isTaken = rnd() < taken * (r < 2 ? 1.15 : 0.9);
        const x = b.x + c * 20 + 10, y = 120 + r * 29 + Math.abs(c - b.n / 2) * 0.8;
        html += `<circle class="seat${isTaken ? " taken" : ""}" data-id="${sid}" data-label="${label}" data-price="${price}" cx="${x}" cy="${y}" r="7.5" fill="${r < 2 ? "#e6dcff" : "#ffffffd9"}"><title>${label} · ${price} €</title></circle>`;
      }
    }
  });
  svg.innerHTML = html;
  gsap.fromTo(svg.querySelectorAll(".seat"), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: { each: 0.004, from: "start" }, ease: "back.out(2)", transformOrigin: "50% 50%" });

  const list = $("#sel-list")!, base = $("#sum-base")!, fee = $("#sum-fee")!, tot = $("#sum-total")!, buy = $<HTMLButtonElement>("#buy")!;
  let shown = 0;
  const render = () => {
    const arr = [...sel.entries()];
    const b = arr.reduce((s, [, v]) => s + v.price, 0);
    const f = Math.round(b * FEE), t = b + f;
    list.innerHTML = arr.length ? arr.map(([k, v]) => `<li class="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"><span class="truncate">${v.label}</span><span class="flex items-center gap-2"><b>${v.price}€</b><button type="button" data-rm="${k}" class="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs hover:bg-pink" aria-label="Quitar">✕</button></span></li>`).join("") : `<li class="text-mute">Elige hasta 6 asientos en el mapa.</li>`;
    base.textContent = eur(b); fee.textContent = eur(f);
    const o = { v: shown };
    gsap.to(o, { v: t, duration: 0.5, ease: "power2.out", onUpdate: () => (tot.textContent = Math.round(o.v).toString()) });
    shown = t;
    buy.disabled = !arr.length;
    buy.textContent = arr.length ? `Comprar ${arr.length} entrada${arr.length > 1 ? "s" : ""}` : "Comprar entradas";
    if (arr.length) gsap.fromTo(list.lastElementChild!, { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35 });
  };
  const toggle = (c: SVGElement) => {
    const k = c.dataset.id!;
    if (sel.has(k)) { sel.delete(k); c.classList.remove("sel"); }
    else {
      if (sel.size >= 6) { toast("Máximo 6 entradas por compra", "!"); return; }
      sel.set(k, { label: c.dataset.label!, price: +c.dataset.price! });
      c.classList.add("sel");
      gsap.fromTo(c, { scale: 1.9 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.4)", transformOrigin: "50% 50%" });
    }
    render();
  };
  on(svg, "click", (e: Event) => { const c = (e.target as Element).closest(".seat") as SVGElement | null; if (c && !c.classList.contains("taken")) toggle(c); }, sig);
  on(list, "click", (e: Event) => { const b = (e.target as HTMLElement).closest("[data-rm]") as HTMLElement | null; if (!b) return; const c = svg.querySelector(`[data-id="${b.dataset.rm}"]`) as SVGElement; c.classList.remove("sel"); sel.delete(b.dataset.rm!); render(); }, sig);
  on(buy, "click", () => {
    const cart: Cart = { id: ev.id, seats: [...sel.values()] };
    store.set("cart", cart);
    location.hash = `#/checkout`;
  }, sig);
  render();

  /* Relacionados */
  const rel = events.filter((e) => e.id !== ev.id && (e.cat === ev.cat || e.c === ev.c)).concat(events.filter((e) => e.id !== ev.id)).filter((e, i, a) => a.indexOf(e) === i).slice(0, 4);
  $("#related")!.innerHTML = rel.map((e, i) => card(e, i)).join("");
  bindTilt($("#related")!, sig);

  gsap.fromTo("#ev-poster", { rotationY: -30, y: 80, autoAlpha: 0 }, { rotationY: 0, y: 0, autoAlpha: 1, duration: 1.4, ease: "expo.out", transformPerspective: 1200, clearProps: "opacity,visibility" });
  gsap.fromTo("#v-evento h1, #v-evento .glass.rounded-full, #ev-desc, #cd-box", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", delay: 0.2 });
  gsap.fromTo("#buybox", { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: "power3.out", delay: 0.4 });
  void countTo;
  bindAll($("#v-evento")!, sig);
  splitReveal($("#v-evento")!);
  footerFx();
}

function fill(ev: Ev) {
  $("#ev-art-name")!.textContent = ev.a;
  $("#ev-title")!.textContent = ev.t;
  $("#ev-date")!.textContent = ev.d;
  $("#ev-time")!.textContent = `${ev.time} h`;
  $("#ev-venue")!.textContent = `${ev.v} · ${ev.c}`;
  $("#ev-desc")!.textContent = ev.desc;
  $("#ev-left")!.innerHTML = ev.left < 30 ? `🔥 Quedan solo <b>${ev.left}</b> entradas` : `✓ <b>${ev.left}</b> entradas disponibles`;
  document.title = `${ev.t} · Handticket`;
}

function card(e: Ev, i: number) {
  return `<a href="#/evento/${e.id}" class="group block" data-view-cursor><div class="poster-wrap aspect-[4/5] tilt" data-tilt><div class="poster absolute -inset-[4%] transition duration-700 group-hover:scale-110">${poster(e, 900 + i)}</div><div class="glare"></div><div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"></div><div class="absolute left-4 top-4 rounded-2xl bg-white/95 px-3 py-1.5 text-center leading-none text-black"><p class="font-display text-xl font-bold">${e.day}</p><p class="text-[10px] font-bold tracking-widest">${e.mon}</p></div><div class="absolute inset-x-0 bottom-0 p-5"><p class="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">${e.a}</p><p class="font-display text-xl font-semibold leading-tight">${e.t}</p></div></div><div class="mt-3 flex items-center justify-between"><p class="truncate text-sm text-mute">${e.v} · ${e.c}</p><p class="shrink-0 text-sm"><span class="text-mute">desde</span> <b>${e.p}€</b></p></div></a>`;
}
export { card as eventCard };
