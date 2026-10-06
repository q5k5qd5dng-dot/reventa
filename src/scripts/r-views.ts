import * as API from "./api";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate, hover, stagger, spring } from "motion";
import { $, $$, toast, eur, reduced, fine, countTo, seeded } from "./util";
import { avatar } from "./avatars";
import { cardHTML, matchEvents, matchPeople, nameOf, artBg, esc, norm, tintOf, SPRING, byId, events, extra, store, fechaLarga, type Ev } from "./r-core";
import { available, seoText } from "../data/extra";
import { openBuy, openSell, openQR, downloadTicket, openEditListing, type Ticket, type Listing } from "./r-sheets";

const pin = `<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.800-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
const plus = `<svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="font-medium text-ink">$1</b>');
const dateRange = (e: Ev) => (e.id === "duro-festival" ? "10 de octubre - 11 de octubre" : fechaLarga(e.date));

/* ═══════════════ Página de evento ═══════════════ */
const SELLERS = ["Walid", "Marina", "Adrián", "Cris", "Jordi", "Paula", "Samir", "Elena", "Rubén", "Alba", "Nacho", "Irene", "Óscar", "Laia", "Hugo", "Sonia"];
const NOTES = ["No podemos ir, disfrutad por nosotros !!", "Vendo porque no puedo asistir", "Las entradas son nominativas, te ayudo con el cambio de nombre", "Me ha surgido un viaje de trabajo", "Al final no puedo ir, ¡que la disfrutéis! 🙌", "Compré de más para un grupo y se han caído dos", "Entrada en PDF, te la envío al instante", "No puedo ir por motivos de salud, lo siento", "¡Si lo necesitas, escríbeme y te ayudo con lo que haga falta!"];
const COLS = ["#5aa02c", "#e8590c", "#1c7ed6", "#c2255c", "#7048e8", "#0ca678", "#f08c00", "#495057"];
export interface Lst { price: number; qty: number; seller: string; note: string; sold: number; bank: boolean; av: boolean; col: string }
/** Anuncios de un tipo de entrada: deterministas, ordenados por precio. */
export function listingsFor(id: string, ti: number): Lst[] {
  const tp = extra[id].tickets[ti], r = seeded(id + ":" + ti), out: Lst[] = [];
  let price = tp.from * 1.12;
  for (let i = 0; i < tp.list; i++) {
    if (i) price *= 1 + 0.015 + r() * 0.05;
    const seller = SELLERS[Math.floor(r() * SELLERS.length)];
    out.push({ price: Math.round(price * 2) / 2, qty: [1, 1, 1, 1, 2, 2, 3, 4][Math.floor(r() * 8)], seller, note: r() < 0.55 ? NOTES[Math.floor(r() * NOTES.length)] : "", sold: Math.floor(r() * 7), bank: r() < 0.85, av: r() < 0.3, col: COLS[Math.floor(r() * COLS.length)] });
  }
  return out;
}
const money = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const tix = `<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v1.500a2 2 0 000 3V15a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.500a2 2 0 000-3V9z"/></svg>`;
const sellerAv = (l: Lst, size = "h-12 w-12", text = "text-lg") => (l.av ? `<span class="${size} block shrink-0 overflow-hidden rounded-full">${avatar(l.seller, "sl" + l.seller)}</span>` : `<span class="${size} ${text} grid shrink-0 place-items-center rounded-full font-medium text-white" style="background:${l.col}">${l.seller[0]}</span>`);

/* ═══════════════ Página de evento / tipo / anuncio ═══════════════ */
export function renderEvent(id: string, ti?: number, li?: number): string {
  const e = byId(id)!, x = extra[id], seo = seoText(e, x);
  const avail = available(id);
  const alerts = store.get<string[]>("alerts", []).includes(id);
  const faq = [
    ["¿Es seguro comprar entradas en Handticket?", "Sí. En Handticket nos aseguramos de que todas las transacciones sean seguras. Contamos con medidas de protección para compradores y vendedores, lo que garantiza la seguridad de todas las partes."],
    ["¿Cuándo recibiré las entradas?", "Normalmente al instante: en cuanto se confirma la compra, la entrada aparece en «Mis entradas» con su QR. En eventos con cambio de nombre te guiamos paso a paso."],
    ["¿Es legal la reventa de entradas?", "Sí. Operamos dentro de la normativa y verificamos a vendedores y entradas antes de publicarlas. Los precios respetan los límites que marca cada evento."],
    ["¿Cómo vender entradas?", "Pulsa «Vender entrada», elige el evento, indica el precio y publica. Cuando se venda te avisamos y cobras automáticamente tras el evento."],
  ];
  const heroFull = `
  <section class="evt-hero" style="--art:var(--art-${id});--tint:var(--tint-${id})">
    <div class="evt-bg" data-evt-bg></div><div class="evt-tint"></div><div class="evt-shade"></div>
    <div class="relative mx-auto grid max-w-[62.5rem] items-end gap-8 px-6 pb-14 pt-32 md:grid-cols-[1fr_auto] md:pb-16 md:pt-44">
      <div>
        <p class="text-sm text-white/80" data-ev-in>${dateRange(e)}</p>
        <h1 class="mt-3 text-balance text-[2.2rem] font-bold leading-[1.05] tracking-tight sm:text-[3.3rem]" data-ev-in>${esc(e.t)}</h1>
        ${x.name === e.t ? "" : `<p class="mt-2 text-lg text-white/85" data-ev-in>${esc(e.a)}</p>`}
        <div class="mt-5 flex flex-wrap gap-2" data-ev-in><span class="chip">${pin}${esc(e.v)}</span><span class="chip">${pin}${esc(x.area)}</span></div>
        <button id="ev-share" class="chip mt-4 transition hover:bg-white/25" data-ev-in><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.500l-6.800 4"/></svg>Compartir</button>
      </div>
      <div id="ev-poster" class="evt-poster aspect-square w-[11.5rem] rounded-2xl sm:w-[19rem]" style="${artBg(id)}" role="img" aria-label="Cartel de ${esc(e.t)}"></div>
    </div>
  </section>`;
  const alertBlock = `
      <div class="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-line p-4 sm:p-5" data-reveal>
        <div class="flex items-center gap-4"><span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-white"><svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8M10.300 21a1.940 1.940 0 003.400 0"/></svg></span><div><p class="font-medium">Alertas de entradas</p><p class="text-sm text-sub">Te notificaremos cuando haya nuevas entradas a la venta para este evento</p></div></div>
        <button id="ev-alert" class="switch" role="switch" aria-checked="${alerts}" aria-label="Activar alertas"><i></i></button>
      </div>
`;
  const entEvent = `
    <section class="pt-10" aria-labelledby="t-ent">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="t-ent" class="text-[1.9rem] font-bold" data-reveal>Entradas</h2>
          <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" data-reveal>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M12 2c1 4-2 5-2 8a2 2 0 004 0c0-1-.4-1.800-1-2.500C15.500 8.500 18 11 18 14a6 6 0 01-12 0c0-5 4-7 6-12z"/></svg>${x.demand}</span>
            <span class="text-ink"><b>${avail}</b> <span class="text-sub">disponibles</span></span><span class="text-ink"><b>${x.wanted}</b> <span class="text-sub">deseadas</span></span>
          </div>
        </div>
        <button class="black-btn" id="ev-sell" data-reveal>${plus}Vender entradas</button>
      </div>
      <div class="mt-6 space-y-3" id="ev-rows">
        ${x.tickets.map((k, i) => `<button type="button" class="row-t" data-trow="${i}" data-list="${k.list}"><span><span class="block text-[1.02rem] font-semibold">${esc(k.n)}</span><span class="mt-0.5 block text-sm text-sub">${esc(k.sub)}</span></span>${k.list ? `<span class="badge-n"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 012-2h14a2 2 0 012 2v1.500a2 2 0 000 3V15a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.500a2 2 0 000-3V9z"/></svg><span data-n="${k.list}">${k.list}</span></span>` : `<span class="text-xs text-sub">Sin anuncios</span>`}</button>`).join("")}
      </div>
${alertBlock}
    </section>`;
  const restHTML = `
    <section class="pt-14" aria-labelledby="t-seo">
      <h2 id="t-seo" class="text-lg font-semibold" data-reveal>${esc(seo.h)}</h2>
      <div class="mt-4 space-y-4 text-[0.92rem] leading-relaxed text-sub" data-reveal>${seo.p.map((p) => `<p>${md(p)}</p>`).join("")}</div>
    </section>

    <section class="pt-14" aria-labelledby="t-ppl">
      <h2 id="t-ppl" class="text-xl font-semibold" data-reveal>Personas relacionadas</h2>
      <div class="scroll-y mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-1" id="ev-people">
        ${x.people.map((p) => `<div class="person" data-person-row><span class="av" data-av>${avatar(p, "p" + p)}</span><span class="flex-1 font-medium">${esc(p)}</span><button class="black-btn !px-4 !py-2.5 text-sm" data-person="${esc(p)}">Explorar eventos</button></div>`).join("")}
      </div>
    </section>

    <section class="pt-14" aria-labelledby="t-venue">
      <div class="map-tile h-56 sm:h-64" id="ev-map">
        <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" class="h-full w-full" aria-hidden="true">
          <rect width="800" height="300" fill="#eceef2"/>
          <path d="M-20 210 C 140 170, 260 250, 420 200 S 700 120, 840 170" stroke="#cfe2f3" stroke-width="46" fill="none" stroke-linecap="round"/>
          <g fill="#dcebd8"><rect x="40" y="30" width="170" height="90" rx="14"/><rect x="560" y="190" width="200" height="80" rx="14"/><rect x="330" y="20" width="110" height="70" rx="12"/></g>
          <g stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"><path d="M0 120H800M0 60H800M0 260H800"/><path d="M120 0V300M300 0V300M520 0V300M700 0V300"/><path d="M0 300L800 0" stroke-width="16"/></g>
          <g stroke="#d9dce3" stroke-width="2" fill="none"><path d="M0 120H800M0 60H800M0 260H800M120 0V300M300 0V300M520 0V300M700 0V300"/></g>
        </svg>
        <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" id="ev-pin"><svg viewBox="0 0 40 52" class="h-14 w-11 drop-shadow-[0_8px_8px_rgba(0,0,0,0.3)]"><path d="M20 51C20 51 3 31 3 19a17 17 0 0134 0c0 12-17 32-17 32z" fill="#e8590c"/><circle cx="20" cy="19" r="7" fill="#fff"/></svg></div>
        <span class="absolute left-1/2 top-1/2 h-3 w-8 -translate-x-1/2 translate-y-1 rounded-[50%] bg-black/25 blur-[2px]" id="ev-pin-s"></span>
        <button id="ev-open-map" class="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium shadow-md transition hover:bg-soft">Abrir en el mapa<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/></svg></button>
      </div>
      <h2 id="t-venue" class="mt-8 text-xl font-semibold" data-reveal>${esc(x.kind)}</h2>
      <p class="mt-1 text-sm text-sub" data-reveal>${esc(x.address)}</p>
      <div class="mt-5 rounded-2xl bg-soft px-6 py-5" data-reveal><p class="font-semibold">${esc(e.v)}</p><p class="text-sm text-sub">${esc(x.kind)}</p></div>
    </section>

    <section class="faq pt-14 pb-4" aria-label="Preguntas frecuentes">
      <div class="divide-y divide-line">
        ${faq.map(([q, a], i) => `<details class="py-5" ${i === 0 ? "open" : ""}><summary class="flex cursor-pointer items-center justify-between gap-4 text-[0.98rem] font-medium">${esc(q)}<span class="faq-i grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span></summary><p class="mt-3 pr-10 text-[0.9rem] leading-relaxed text-sub">${esc(a)}</p></details>`).join("")}
      </div>
    </section>
`;

  // ── Nivel 2: anuncios de un tipo de entrada ──
  if (ti != null && x.tickets[ti]) {
    const tp = x.tickets[ti], lst = listingsFor(id, ti);
    // ── Nivel 3: un anuncio concreto ──
    if (li != null && lst[li]) {
      const l = lst[li];
      return `
  <section class="evt-hero" style="--art:var(--art-${id});--tint:var(--tint-${id})">
    <div class="evt-bg" data-evt-bg></div><div class="evt-tint"></div><div class="evt-shade"></div>
    <div class="relative mx-auto flex max-w-[62.5rem] items-center gap-5 px-6 pb-8 pt-28 sm:gap-8 sm:pb-9 sm:pt-32">
      <div id="ev-poster" class="evt-poster aspect-square w-[6.5rem] shrink-0 rounded-xl sm:w-[14.5rem] sm:rounded-2xl" style="${artBg(id)}" role="img" aria-label="Cartel de ${esc(e.t)}"></div>
      <div class="min-w-0"><p class="text-sm text-white/85 sm:text-base" data-ev-in>${dateRange(e)}</p><h1 class="mt-2 text-balance text-[1.6rem] font-bold leading-tight sm:text-[2.5rem]" data-ev-in>${esc(e.t)}</h1><button id="ev-share" class="chip mt-4 transition hover:bg-white/25" data-ev-in><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.500l-6.800 4"/></svg>Compartir</button></div>
    </div>
  </section>
  <div class="mx-auto max-w-[58rem] px-6 pb-24">
    <a href="#/evento/${id}/${ti}" class="mt-8 inline-flex items-center gap-1.5 text-accent transition hover:opacity-70" data-ev-in><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Entradas</a>
    <h2 class="mt-6 text-[1.9rem] font-bold sm:text-[2.2rem]" data-ev-in>${esc(tp.n)}</h2>
    <p class="mt-2 text-lg text-ink/80" data-ev-in><span id="l-avail">${l.qty}</span> entrada${l.qty > 1 ? "s" : ""} disponible${l.qty > 1 ? "s" : ""}</p>
    <div class="mt-7 flex items-center justify-between rounded-2xl bg-[#f6f6f7] px-6 py-5" data-ev-in><span class="text-xl font-medium"><span id="l-q">${l.qty}</span> entrada${l.qty > 1 ? "s" : ""}</span>${l.qty > 1 ? `<span class="flex items-center gap-3"><button type="button" data-lq="-1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-accent hover:text-white" aria-label="Menos">−</button><button type="button" data-lq="1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-accent hover:text-white" aria-label="Más">+</button></span>` : ""}</div>
    <div class="mt-5 flex items-center justify-end gap-5" data-ev-in>
      <div class="relative text-right"><p class="flex items-center justify-end gap-2 text-[2.1rem] font-semibold leading-none"><span id="l-total">${money(l.price * l.qty)}</span><button id="l-info" type="button" class="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-white" aria-label="Información del precio">i</button></p><p class="mt-1 text-ink/80">Total</p>
        <div id="l-tip" class="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-60 rounded-xl bg-ink px-4 py-3 text-left text-xs leading-relaxed text-white shadow-xl">Incluye el precio de la entrada y los gastos de gestión de Handticket. Sin sorpresas al pagar.</div></div>
      <button id="l-buy" class="black-btn !rounded-xl !px-8 !py-4 text-lg">Comprar</button>
    </div>
    <div class="card-line mt-8 px-6 py-8 text-center sm:px-10" data-ev-in>
      <span class="mx-auto block w-fit">${sellerAv(l, "h-16 w-16", "text-2xl")}</span>
      <p class="mt-3 text-lg">${esc(l.seller)}</p>
      <ul class="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink/80">
        <li class="inline-flex items-center gap-1.5"><span class="relative grid h-5 w-5 place-items-center rounded bg-soft text-sub"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg><i class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></i></span>Teléfono verificado</li>
        ${l.bank ? `<li class="inline-flex items-center gap-1.5"><span class="relative grid h-5 w-5 place-items-center rounded bg-soft text-sub"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg><i class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></i></span>Cuenta bancaria verificada</li>` : ""}
        <li class="inline-flex items-center gap-1.5"><span class="relative grid h-5 w-5 place-items-center rounded bg-soft text-sub">${tix}<i class="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></i></span>${l.sold} entradas vendidas</li>
      </ul>
      ${l.note ? `<div class="mt-6 border-t border-line pt-5 text-left"><p class="text-xs text-sub">Comentario del vendedor:</p><p class="mt-3 text-[0.95rem] text-ink">${esc(l.note)}</p></div>` : ""}
    </div>
  </div>`;
    }
    const entType = `
    <section class="pt-9" aria-labelledby="t-ent">
      <a href="#/evento/${id}" class="inline-flex items-center gap-1.5 text-accent transition hover:opacity-70" data-reveal><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Todas las entradas</a>
      <div class="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="t-ent" class="text-[1.9rem] font-bold" data-reveal>${esc(tp.n)}</h2>
          <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" data-reveal>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M12 2c1 4-2 5-2 8a2 2 0 004 0c0-1-.4-1.800-1-2.500C15.500 8.500 18 11 18 14a6 6 0 01-12 0c0-5 4-7 6-12z"/></svg>${x.demand}</span>
            <span class="text-ink"><b>${lst.length}</b> <span class="text-sub">disponibles</span></span><span class="text-ink"><b>${x.wanted}</b> <span class="text-sub">deseadas</span></span>
          </div>
        </div>
        <button class="black-btn" id="ev-sell" data-reveal>${plus}Vender entradas</button>
      </div>
      <div class="mt-6 space-y-3" id="ev-rows">
        ${lst.map((l, i) => `<a href="#/evento/${id}/${ti}/${i}" class="lrow" data-lrow="${i}">${sellerAv(l)}<span class="min-w-0 flex-1"><span class="flex items-start justify-between gap-4"><span><span class="block text-[1.02rem] font-semibold">${esc(tp.n)}</span><span class="mt-0.5 inline-flex items-center gap-1.5 text-sm text-sub">${tix}${l.qty} entrada${l.qty > 1 ? "s" : ""}</span></span><span class="text-right"><span class="block text-[1.2rem] font-semibold">${money(l.price)}</span><span class="block text-xs text-sub">/ entrada</span></span></span>${l.note ? `<span class="mt-3 block rounded-lg bg-white/70 px-3 py-2 text-sm italic text-sub">“${esc(l.note)}”</span>` : ""}</span></a>`).join("")}
      </div>
${alertBlock}
    </section>`;
    return heroFull + `\n\n  <div class="mx-auto max-w-[62.5rem] px-6">${entType}\n\n` + restHTML + `\n  </div>`;
  }
  return heroFull + `\n\n  <div class="mx-auto max-w-[62.5rem] px-6">${entEvent}\n\n` + restHTML + `\n  </div>`;
}

export function initEvent(root: HTMLElement, id: string, sig: AbortSignal, ti?: number, li?: number) {
  const e = byId(id)!, x = extra[id];
  const has = (sel: string) => !!root.querySelector(sel);
  // fondo desenfocado que respira
  if (!reduced) {
    gsap.to("[data-evt-bg]", { scale: 1.28, xPercent: 3, duration: 14, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.fromTo("[data-ev-in]", { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: "power3.out", delay: 0.1 });
    gsap.fromTo("#ev-poster", { y: 80, rotationY: -28, autoAlpha: 0, scale: 0.9 }, { y: 0, rotationY: 0, autoAlpha: 1, scale: 1, duration: 1.3, ease: "expo.out", transformPerspective: 1000, delay: 0.15 });
    gsap.to("#ev-poster", { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".evt-hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to("[data-evt-bg]", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".evt-hero", start: "top top", end: "bottom top", scrub: true } });
    $$("[data-reveal]", root).forEach((el) => gsap.fromTo(el, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } }));
    if (has("#ev-rows")) gsap.fromTo("#ev-rows > *", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", scrollTrigger: { trigger: "#ev-rows", start: "top 90%", once: true } });
    $$("[data-n]", root).forEach((n) => ScrollTrigger.create({ trigger: n, start: "top 95%", once: true, onEnter: () => countTo(n, +n.dataset.n!, 0, "", "", 1.2) }));
    if (has("#ev-people")) gsap.fromTo("#ev-people > *", { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: "#ev-people", start: "top 90%", once: true } });
    if (has("#ev-map")) ScrollTrigger.create({ trigger: "#ev-map", start: "top 80%", once: true, onEnter: () => {
      gsap.fromTo("#ev-pin", { y: -220, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "bounce.out" });
      gsap.fromTo("#ev-pin-s", { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, delay: 0.7 });
    } });
  }
  if (fine && !reduced) {
    hover("[data-trow], [data-lrow]", (el) => { animate(el, { x: 6 }, SPRING); return () => animate(el, { x: 0 }, SPRING); });
    if (has("#ev-people")) hover("#ev-people .person", (el) => { animate(el, { scale: 1.015 }, SPRING); return () => animate(el, { scale: 1 }, SPRING); });
    const p = $("#ev-poster")!;
    const rx = gsap.quickTo(p, "rotationX", { duration: 0.6, ease: "power3" }), ry = gsap.quickTo(p, "rotationY", { duration: 0.6, ease: "power3" });
    p.addEventListener("pointermove", (ev) => { const r = p.getBoundingClientRect(); ry(((ev.clientX - r.left) / r.width - 0.5) * 14); rx(-((ev.clientY - r.top) / r.height - 0.5) * 14); }, { signal: sig });
    p.addEventListener("pointerleave", () => { rx(0); ry(0); }, { signal: sig });
  }
  // filas de entradas
  $$("[data-trow]", root).forEach((r) => r.addEventListener("click", () => {
    if (!+r.dataset.list!) { toast("No hay anuncios ahora mismo. Activa las alertas y te avisamos.", "🔔"); return; }
    location.hash = `#/evento/${id}/${r.dataset.trow}`;
  }, { signal: sig }));
  $("#ev-sell", root)?.addEventListener("click", () => openSell(id), { signal: sig });
  // alertas
  const sw = $("#ev-alert", root);
  if (sw) sw.addEventListener("click", () => {
    const on = sw.getAttribute("aria-checked") !== "true";
    sw.setAttribute("aria-checked", String(on));
    animate(sw.firstElementChild!, { x: on ? "1.25rem" : "0rem" }, SPRING);
    const a = new Set(store.get<string[]>("alerts", [])); on ? a.add(id) : a.delete(id); store.set("alerts", [...a]);
    toast(on ? "Te avisaremos de nuevas entradas" : "Alertas desactivadas", on ? "🔔" : "🔕");
  }, { signal: sig });
  if (sw?.getAttribute("aria-checked") === "true") (sw.firstElementChild as HTMLElement).style.transform = "translateX(1.25rem)";
  // compartir
  $("#ev-share", root)?.addEventListener("click", async () => {
    const url = location.href;
    try { if (navigator.share) { await navigator.share({ title: e.t, url }); return; } } catch { /* cancelado */ }
    try { await navigator.clipboard.writeText(url); toast("Enlace copiado", "🔗"); } catch { toast("Copia el enlace desde la barra de direcciones", "🔗"); }
  }, { signal: sig });
  // personas → búsqueda
  $$("[data-person]", root).forEach((b) => b.addEventListener("click", () => { location.hash = `#/buscar/${encodeURIComponent(b.dataset.person!)}`; }, { signal: sig }));
  $("#ev-open-map", root)?.addEventListener("click", () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.v}, ${x.address}`)}`, "_blank", "noopener"), { signal: sig });
  // anuncio concreto: cantidad, información del precio y compra
  if (ti != null && li != null) {
    const l = listingsFor(id, ti)[li];
    if (l) {
      let q = l.qty;
      const tot = $("#l-total", root)!, o = { v: l.price * l.qty };
      const upd = () => {
        $("#l-q", root)!.textContent = String(q);
        gsap.to(o, { v: l.price * q, duration: 0.45, ease: "power2.out", onUpdate: () => (tot.textContent = money(o.v)) });
      };
      $$("[data-lq]", root).forEach((b) => b.addEventListener("click", () => {
        const n = q + Number(b.dataset.lq);
        if (n < 1 || n > l.qty) return;
        q = n; upd();
        gsap.fromTo($("#l-q", root)!, { y: b.dataset.lq === "1" ? 8 : -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 });
      }, { signal: sig }));
      const tip = $("#l-tip", root)!;
      $("#l-info", root)!.addEventListener("click", () => {
        const show = tip.classList.contains("hidden");
        tip.classList.toggle("hidden", !show);
        if (show) animate(tip, { opacity: [0, 1], y: [-6, 0] }, SPRING);
      }, { signal: sig });
      $("#l-buy", root)!.addEventListener("click", () => openBuy(id, ti, q, { price: l.price, qty: l.qty, seller: l.seller }), { signal: sig });
      if (!reduced) {
        gsap.fromTo("#l-total", { scale: 0.85 }, { scale: 1, duration: 0.8, ease: "elastic.out(1,0.5)", delay: 0.5, transformOrigin: "100% 50%" });
        gsap.fromTo("#l-buy", { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", delay: 0.45 });
      }
    }
  }
  faqAnim(root, sig);
  void tintOf; void spring; void stagger;
}

export function faqAnim(root: ParentNode, sig: AbortSignal) {
  $$("details", root).forEach((d) => d.addEventListener("toggle", () => {
    const p = d.querySelector("p");
    if (d.open && p && !reduced) gsap.fromTo(p, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" });
  }, { signal: sig }));
}

/* ═══════════════ Resultados de búsqueda ═══════════════ */
const CAT_LABEL: Record<string, string> = { musica: "Conciertos", festival: "Festivales", deporte: "Deportes", teatro: "Teatro", club: "Discotecas" };
export function renderSearch(q: string): string {
  const res = matchEvents(q), people = matchPeople(q);
  const label = CAT_LABEL[norm(q)] ?? (q ? `“${esc(q)}”` : "Todos los eventos");
  const cats = [...new Set(res.map((e) => e.cat))];
  return `<section class="mx-auto max-w-[1500px] px-6 pb-16 pt-32 md:pt-40 min-[1580px]:px-0">
    <p class="text-sm text-sub" data-s-in>${q ? "Resultados de búsqueda" : "Explorar"}</p>
    <h1 class="mt-1 text-[2rem] font-bold leading-tight sm:text-[3rem]" data-s-in>${label}</h1>
    <p class="mt-2 text-sub" data-s-in id="s-count">${res.length} evento${res.length === 1 ? "" : "s"}</p>
    <form id="s-form" class="mt-6 flex max-w-2xl items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-sm focus-within:border-accent" data-s-in role="search"><svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0 text-ink/40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input id="s-q" type="search" value="${esc(q)}" placeholder="Busca eventos, recintos, ciudades o artistas" aria-label="Buscar" class="w-full bg-transparent outline-none" /><button class="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Buscar</button></form>
    ${cats.length > 1 ? `<div class="no-scrollbar -mx-6 mt-5 flex gap-2 overflow-x-auto px-6 min-[1580px]:mx-0 min-[1580px]:px-0" data-s-in role="tablist"><button type="button" role="tab" data-fc="all" aria-selected="true" class="fc rounded-full border border-line px-4 py-2 text-sm transition aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white">Todo</button>${cats.map((c) => `<button type="button" role="tab" data-fc="${c}" aria-selected="false" class="fc rounded-full border border-line px-4 py-2 text-sm transition aria-selected:border-ink aria-selected:bg-ink aria-selected:text-white">${CAT_LABEL[c]}</button>`).join("")}</div>` : ""}
    ${people.length ? `<div class="mt-6" data-s-in><p class="mb-2 text-sm text-sub">Artistas y equipos</p><div class="flex flex-wrap gap-2">${people.map((p) => `<a href="#/buscar/${encodeURIComponent(p)}" class="inline-flex items-center gap-2 rounded-full bg-soft py-1.5 pl-1.5 pr-4 text-sm transition hover:bg-[#ececef]"><span class="h-8 w-8 overflow-hidden rounded-full">${avatar(p, "s" + p)}</span>${esc(p)}</a>`).join("")}</div></div>` : ""}
    <div id="s-grid" class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">${res.map((e) => cardHTML(e)).join("")}</div>
    ${res.length ? "" : `<div class="mx-auto mt-10 max-w-md rounded-2xl border border-line p-10 text-center" id="s-empty"><div class="empty-ill mx-auto"><svg viewBox="0 0 24 24" class="h-10 w-10 text-ink/40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg></div><p class="mt-5 text-lg font-semibold">No hay eventos para esta búsqueda</p><p class="mt-1 text-sub">Prueba con otra ciudad, artista o recinto, o activa una alerta y te avisamos.</p><div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button id="s-alert" class="black-btn justify-center">🔔 Avisarme</button><a href="#/buscar/" class="btn border border-line">Ver todos</a></div></div>`}
  </section>`;
}
export function initSearch(root: HTMLElement, q: string, sig: AbortSignal) {
  if (!reduced) {
    gsap.fromTo("[data-s-in]", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" });
    if ($("#s-grid > *", root)) gsap.fromTo("#s-grid > *", { y: 60, autoAlpha: 0, scale: 0.94 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.8, stagger: 0.06, ease: "power3.out", delay: 0.2 });
  }
  if (fine && !reduced) hover("#s-grid [data-card] a", (el) => { const a = el.querySelector<HTMLElement>(".art")!; animate(a, { scale: 1.07 }, { type: spring, stiffness: 180, damping: 18 }); return () => animate(a, { scale: 1 }, { type: spring, stiffness: 180, damping: 22 }); });
  $("#s-form", root)!.addEventListener("submit", (ev) => { ev.preventDefault(); location.hash = `#/buscar/${encodeURIComponent(($("#s-q", root) as HTMLInputElement).value.trim())}`; }, { signal: sig });
  $$(".fc", root).forEach((b) => b.addEventListener("click", () => {
    $$(".fc", root).forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    const c = b.dataset.fc;
    const cards = $$("#s-grid [data-card]", root); let n = 0;
    cards.forEach((k) => { const ok = c === "all" || k.dataset.cat === c; k.classList.toggle("hidden", !ok); if (ok) n++; });
    $("#s-count", root)!.textContent = `${n} evento${n === 1 ? "" : "s"}`;
    if (!reduced) gsap.fromTo(cards.filter((k) => !k.classList.contains("hidden")), { y: 30, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.05, overwrite: true });
  }, { signal: sig }));
  $("#s-alert", root)?.addEventListener("click", () => toast(`Te avisaremos cuando haya eventos para “${q}”`, "🔔"), { signal: sig });
}

/* ═══════════════ Mis entradas ═══════════════ */
const emptyIll = `<div class="empty-ill mx-auto"><svg viewBox="0 0 64 64" class="h-14 w-14"><rect x="14" y="10" width="36" height="44" rx="6" fill="#fff" stroke="#dcdce2"/><rect x="21" y="17" width="10" height="10" rx="2" fill="#e4e4ea"/><path d="M36 20h9M36 25h6M21 36h24M21 42h18" stroke="#dcdce2" stroke-width="3" stroke-linecap="round"/></svg><span class="absolute bottom-3 right-3 grid h-7 w-7 place-items-center rounded-full bg-[#8d8d97] text-white"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg></span></div>`;
export function renderTickets(): string {
  const list = store.get<Ticket[]>("tickets", []);
  return `<section class="mx-auto max-w-[56rem] px-6 pb-20 pt-32 md:pt-44">
    <h1 class="text-[2.4rem] font-bold leading-none tracking-tight sm:text-[3.3rem]" data-t-in>Entradas compradas</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-t-in>Descarga aquí tus entradas compradas, obtén ayuda o información</p>
    ${list.length ? `<div class="mt-10 space-y-4" id="t-list">${list.map((t) => { const e = byId(t.ev)!; return `<article class="card-line flex flex-col gap-5 p-5 sm:flex-row sm:items-center" data-t-card data-id="${t.id}"><div class="card-art h-28 w-28 shrink-0 !rounded-xl"><div class="art h-full w-full" style="${artBg(e.id)}"></div></div><div class="min-w-0 flex-1"><p class="text-sm text-accent">${fechaLarga(e.date)}</p><p class="truncate text-lg font-semibold">${esc(nameOf(e))}</p><p class="truncate text-sm text-sub">${esc(e.v)}, ${esc(e.c)}</p><p class="mt-1 text-sm text-ink/80">${esc(t.type)} · ${t.qty}× · ${t.total % 1 ? money(t.total) : eur(t.total)} · <span class="font-mono text-xs">${t.code}</span></p></div><div class="flex flex-wrap gap-2 sm:flex-col"><button class="black-btn !px-4 !py-2.5 text-sm" data-dl="${t.id}"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg>Descargar</button><button class="btn border border-line !px-4 !py-2.5 text-sm" data-qr="${t.id}">Ver QR</button><button class="btn border border-line !px-4 !py-2.5 text-sm" data-resell="${t.id}">Revender</button></div></article>`; }).join("")}</div>`
    : `<div class="card-line mt-10 px-6 py-8 text-center sm:py-10" data-t-in>${emptyIll}<p class="mt-4 text-[1.35rem] font-semibold">No tienes entradas compradas todavía</p><p class="mt-3 text-ink/70">Cuando compres una entrada, la podrás descargar desde esta página.</p><a href="#/" class="black-btn mt-7 !px-5">Ir al inicio</a></div>`}
  </section>`;
}
export function initTickets(root: HTMLElement, sig: AbortSignal, rerender: () => void) {
  if (!reduced) {
    gsap.fromTo("[data-t-in]", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    gsap.fromTo("[data-t-card]", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", delay: 0.25 });
    gsap.fromTo(".empty-ill", { scale: 0.6, autoAlpha: 0, rotation: -12 }, { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.9, ease: "back.out(1.8)", delay: 0.3 });
  }
  const find = (id: string) => store.get<Ticket[]>("tickets", []).find((t) => t.id === id)!;
  $$("[data-dl]", root).forEach((b) => b.addEventListener("click", () => downloadTicket(find(b.dataset.dl!)), { signal: sig }));
  $$("[data-qr]", root).forEach((b) => b.addEventListener("click", () => openQR(find(b.dataset.qr!)), { signal: sig }));
  $$("[data-resell]", root).forEach((b) => b.addEventListener("click", () => { const t = find(b.dataset.resell!); openSell(t.ev, t.qty); }, { signal: sig }));
  void rerender;
}

/* ═══════════════ Mis anuncios ═══════════════ */
export function renderListings(): string {
  const list = store.get<Listing[]>("selling", []);
  return `<section class="mx-auto max-w-[56rem] px-6 pb-20 pt-32 md:pt-44">
    <h1 class="text-[2.4rem] font-bold leading-none tracking-tight sm:text-[3.3rem]" data-t-in>Tus anuncios</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-t-in>Modifica la información de tus anuncios.</p>
    ${list.length ? `<div class="mt-10 space-y-4" id="l-list">${list.map((l) => { const e = byId(l.ev)!; return `<article class="card-line flex flex-col gap-5 p-5 sm:flex-row sm:items-center" data-t-card data-id="${l.id}"><div class="card-art h-24 w-24 shrink-0 !rounded-xl"><div class="art h-full w-full" style="${artBg(e.id)}"></div></div><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"><i class="h-1.5 w-1.5 rounded-full bg-emerald-500"></i>Publicado</span><span class="text-xs text-sub">${new Date(l.at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span></div><p class="mt-1 truncate text-lg font-semibold">${esc(nameOf(e))}</p><p class="truncate text-sm text-sub">${fechaLarga(e.date)} · ${esc(e.c)}</p><p class="mt-1 text-sm text-ink/80">${esc(l.type)} · ${l.qty}× a <b>${eur(l.price)}</b> · cobrarías <b class="text-accent">${money(l.qty * l.price * 0.9)}</b></p></div><div class="flex flex-wrap gap-2 sm:flex-col"><button class="btn border border-line !px-4 !py-2.5 text-sm" data-edit="${l.id}">Cambiar precio</button><button class="btn !px-4 !py-2.5 text-sm text-[#e5484d] ring-1 ring-[#e5484d]/25 hover:bg-[#e5484d]/5" data-del="${l.id}">Retirar</button></div></article>`; }).join("")}</div>
      <button class="black-btn mt-8" data-sell data-t-in>${plus}Vender entrada</button>`
    : `<p class="mt-8 text-[1.02rem] text-ink" data-t-in>Aún no hay anuncios creados desde tu cuenta, pero puedes poner a la venta tu primera entrada.</p><button class="black-btn mt-5 !px-5 !py-4 text-base" data-sell data-t-in>${plus}Vender entrada</button>`}
  </section>`;
}
export function initListings(root: HTMLElement, sig: AbortSignal, rerender: () => void) {
  if (!reduced) {
    gsap.fromTo("[data-t-in]", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    gsap.fromTo("[data-t-card]", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", delay: 0.25 });
  }
  $$("[data-edit]", root).forEach((b) => b.addEventListener("click", () => openEditListing(b.dataset.edit!, rerender), { signal: sig }));
  $$("[data-del]", root).forEach((b) => b.addEventListener("click", async () => {
    const card = b.closest("[data-t-card]") as HTMLElement;
    if (!reduced) await gsap.to(card, { x: 40, autoAlpha: 0, height: 0, paddingBlock: 0, marginBlock: 0, duration: 0.45, ease: "power2.in" });
    if (API.serverMode) { try { await API.del(`/api/listings/${b.dataset.del}`); } catch (er) { toast((er as Error).message, "!"); gsap.set(card, { clearProps: "all" }); return; } }
    store.set("selling", store.get<Listing[]>("selling", []).filter((l) => l.id !== b.dataset.del));
    toast("Anuncio retirado", "🗑");
    rerender();
  }, { signal: sig }));
}
void events;
