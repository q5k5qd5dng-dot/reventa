import { gsap } from "gsap";
import { animate, stagger } from "motion";
import { $, $$, toast, paintQR, eur, reduced } from "./util";
import { confetti } from "./confetti";
import { openSheet, closeSheet, closeBtn, spinner, field, err, emailOk, sleep, SPRING, FEE, nameOf, artBg, renderUser, byId, events, extra, store, getUser, fechaLarga, type Ev } from "./r-core";

export interface Ticket { id: string; ev: string; type: string; qty: number; total: number; code: string; at: number }
export interface Listing { id: string; ev: string; type: string; qty: number; price: number; at: number }
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();

/* ═════ Comprar (hoja del evento / tipo de entrada) ═════ */
export interface Pick { price: number; qty: number; seller: string }
export function openBuy(id: string, typeIdx = 0, qty = 2, pick?: Pick) {
  const ev = byId(id);
  if (!ev) return;
  const x = extra[id], tp = x.tickets[typeIdx] ?? x.tickets[0];
  const maxQ = pick ? pick.qty : 6;
  let q = Math.min(maxQ, Math.max(1, qty));
  const html = `<div class="relative">${closeBtn}
    <div class="card-art h-48 !rounded-none sm:!rounded-t-[1.75rem]"><div class="art h-full w-full" style="${artBg(ev.id)}"></div></div>
    <div class="p-6 sm:p-8">
      <p class="text-sm text-accent">${fechaLarga(ev.date)}</p>
      <h3 class="mt-1 text-2xl font-semibold leading-tight">${nameOf(ev)}</h3>
      <p class="mt-1 text-sub">${ev.v}, ${ev.c}</p>
      <div class="mt-5">${pick ? `<div class="rounded-xl bg-soft px-4 py-3 text-sm"><span class="text-sub">Tipo</span> <b>${tp.n}</b><br><span class="text-sub">Vendedor</span> <b>${pick.seller}</b> · <span class="text-sub">${pick.qty} entrada${pick.qty > 1 ? "s" : ""} disponibles</span></div>` : ""}<label class="text-sm text-sub ${pick ? "hidden" : ""}">Tipo de entrada<select id="b-type" class="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-ink outline-none focus:border-accent">${x.tickets.map((k, i) => `<option value="${i}" ${i === typeIdx ? "selected" : ""} ${k.list ? "" : "disabled"}>${k.n} — desde ${k.from} €${k.list ? ` (${k.list} anuncios)` : " (sin anuncios)"}</option>`).join("")}</select></label></div>
      <div class="mt-4 flex items-center justify-between rounded-2xl bg-soft p-3">
        <div><p class="text-sm text-sub">Entradas</p><p class="font-semibold"><span id="b-unit">${eur(pick ? pick.price : tp.from)}</span> <span class="text-sm font-normal text-sub">c/u</span></p></div>
        <div class="flex items-center gap-3"><button type="button" data-q="-1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-accent hover:text-white" aria-label="Menos">−</button><span id="b-q" class="w-6 text-center text-xl font-semibold tabular-nums">${q}</span><button type="button" data-q="1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-accent hover:text-white" aria-label="Más">+</button></div>
      </div>
      <div class="mt-5 space-y-1.5 text-sm text-sub"><div class="flex justify-between"><span>Entradas</span><span id="b-base"></span></div><div class="flex justify-between"><span>Gastos de gestión</span><span id="b-fee"></span></div></div>
      <div class="mt-3 flex items-end justify-between border-t border-line pt-4"><span class="font-medium">Total</span><span class="text-3xl font-semibold"><span id="b-total">0</span> €</span></div>
      <button id="b-buy" class="btn btn-accent mt-5 w-full !py-4">Comprar entradas</button>
      <p class="mt-3 text-center text-xs text-sub">🔒 Pago protegido hasta que entras · Demostración, no se realiza ningún cobro</p>
    </div></div>`;
  openSheet(html, (s) => {
    const total = $("#b-total", s)!, shown = { v: 0 }, sel = $<HTMLSelectElement>("#b-type", s)!;
    const cur = () => x.tickets[+sel.value];
    const unit = () => (pick ? pick.price : cur().from);
    const calc = () => {
      const b = Math.round(q * unit() * 100) / 100, f = pick ? 0 : Math.round(b * FEE), t = pick ? b : Math.round(b + f);
      const m2 = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      $("#b-q", s)!.textContent = String(q); $("#b-unit", s)!.textContent = pick ? m2(unit()) : eur(unit()); $("#b-base", s)!.textContent = pick ? m2(b) : eur(b); $("#b-fee", s)!.textContent = pick ? "Incluidos" : eur(f);
      gsap.to(shown, { v: t, duration: 0.5, ease: "power2.out", onUpdate: () => (total.textContent = pick ? shown.v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(shown.v).toString()) });
    };
    calc();
    sel.addEventListener("change", calc);
    $$("[data-q]", s).forEach((b) => b.addEventListener("click", () => {
      const n = q + Number(b.dataset.q);
      if (n < 1 || n > maxQ) { toast(n < 1 ? "Mínimo 1 entrada" : pick ? `El vendedor solo tiene ${pick.qty}` : "Máximo 6 entradas por compra", "!"); return; }
      q = n; calc();
      gsap.fromTo($("#b-q", s)!, { y: b.dataset.q === "1" ? 10 : -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 });
    }));
    $("#b-buy", s)!.addEventListener("click", async (e) => {
      if (!getUser()) { toast("Inicia sesión para comprar", "i"); openLogin("login", () => openBuy(id, +sel.value, q, pick)); return; }
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true; btn.innerHTML = `${spinner} Procesando…`;
      await sleep(1300);
      const base = Math.round(q * unit() * 100) / 100, list = store.get<Ticket[]>("tickets", []);
      const code = `HT-${uid().slice(0, 6)}`;
      list.unshift({ id: uid(), ev: ev.id, type: cur().n, qty: q, total: pick ? base : Math.round(base + base * FEE), code, at: Date.now() });
      store.set("tickets", list);
      success(ev, q, code, cur().n);
    });
  });
}
function success(ev: Ev, q: number, code: string, type: string) {
  openSheet(`<div class="relative px-6 pb-8 pt-12 text-center sm:px-8">${closeBtn}
    <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white"><svg viewBox="0 0 24 24" class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path id="ok" d="M5 12l5 5 9-10"/></svg></div>
    <h3 class="mt-5 text-3xl font-semibold">¡Listo!</h3><p class="mt-2 text-sub">Tus ${q} entrada${q > 1 ? "s" : ""} (${type}) para <b class="text-ink">${nameOf(ev)}</b> ya están en tu cuenta.</p>
    <div id="tk" class="mx-auto mt-6 flex max-w-xs items-center gap-4 rounded-2xl bg-soft p-4 text-left"><div class="qr w-20 shrink-0 rounded-lg bg-white p-1.5 shadow-sm" data-code></div><div class="min-w-0"><p class="text-xs text-accent">${fechaLarga(ev.date)}</p><p class="truncate font-medium">${ev.t}</p><p class="text-sm text-sub">${code} · ${q}×</p></div></div>
    <div class="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" id="s-mine" class="btn btn-accent flex-1">Ver mis entradas</button><button type="button" data-close class="btn flex-1 border border-line">Seguir explorando</button></div></div>`, (s) => {
    paintQR($("[data-code]", s)!, code);
    const p = $<SVGPathElement>("#ok", s)!, l = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", delay: 0.25 });
    gsap.fromTo("#tk", { y: 30, autoAlpha: 0, rotationX: -40 }, { y: 0, autoAlpha: 1, rotationX: 0, duration: 0.9, ease: "back.out(1.4)", delay: 0.5, transformPerspective: 600 });
    $("#s-mine", s)!.addEventListener("click", async () => { await closeSheet(); if (location.hash === "#/mis-entradas") dispatchEvent(new Event("ht:rerender")); else location.hash = "#/mis-entradas"; });
    confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.4);
  });
}

/* ═════ Acceso ═════ */
export function openLogin(mode: "login" | "register" = "login", after?: () => void) {
  const html = `<div class="relative p-6 pt-8 sm:p-8">${closeBtn}
    <p class="logo-word text-4xl text-accent">handticket</p>
    <div class="relative mt-6 grid grid-cols-2 rounded-xl bg-soft p-1 text-sm font-medium" role="tablist"><i id="pill" class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm"></i>
      <button type="button" role="tab" data-m="login" class="relative z-10 rounded-lg py-2.5">Iniciar sesión</button><button type="button" role="tab" data-m="register" class="relative z-10 rounded-lg py-2.5">Crear cuenta</button></div>
    <form id="lf" class="mt-6 space-y-3" novalidate>
      <h3 id="l-title" class="text-2xl font-semibold"></h3>
      <div id="l-name" class="hidden">${field("l-n", "Nombre", "text", 'autocomplete="name"')}</div>
      ${field("l-e", "Email", "email", 'autocomplete="email"')}
      ${field("l-p", "Contraseña", "password", 'autocomplete="current-password"')}
      <button class="btn btn-accent w-full !py-4" id="l-go"></button>
      <div class="flex items-center gap-3 py-1 text-xs text-sub"><i class="h-px flex-1 bg-line"></i>o<i class="h-px flex-1 bg-line"></i></div>
      <button type="button" data-social class="btn w-full border border-line">Continuar con Google</button>
      <p class="pt-1 text-center text-xs text-sub">Demostración: tus datos se guardan solo en este navegador.</p>
    </form></div>`;
  openSheet(html, (s) => {
    let m = mode;
    const title = $("#l-title", s)!, go = $("#l-go", s)!, nameBox = $("#l-name", s)!, pill = $("#pill", s)!;
    const set = (next: "login" | "register", first = false) => {
      m = next;
      $$("[data-m]", s).forEach((b) => b.classList.toggle("text-accent", b.dataset.m === m));
      animate(pill, { x: m === "register" ? "100%" : "0%" }, first ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 });
      title.textContent = m === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta";
      go.textContent = m === "login" ? "Entrar" : "Crear cuenta";
      nameBox.classList.toggle("hidden", m === "login");
      if (!first && !reduced) animate($$("#lf .fld", s), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.05), ...SPRING });
    };
    set(m, true);
    $$("[data-m]", s).forEach((b) => b.addEventListener("click", () => set(b.dataset.m as "login" | "register")));
    $("[data-social]", s)!.addEventListener("click", () => toast("Demo: acceso con Google no disponible", "i"));
    $("#lf", s)!.addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = $<HTMLInputElement>("#l-n", s)!, em = $<HTMLInputElement>("#l-e", s)!, pw = $<HTMLInputElement>("#l-p", s)!;
      const ok = [err(em, emailOk(em.value) ? "" : "Introduce un email válido"), err(pw, pw.value.length >= (m === "register" ? 8 : 6) ? "" : `Mínimo ${m === "register" ? 8 : 6} caracteres`)];
      if (m === "register") ok.push(err(n, n.value.trim().length >= 2 ? "" : "Dinos tu nombre"));
      if (!ok.every(Boolean)) return;
      (go as HTMLButtonElement).disabled = true; go.innerHTML = `${spinner} Un momento…`;
      await sleep(900);
      const name = m === "register" ? n.value.trim() : em.value.split("@")[0].replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
      store.set("user", { name, email: em.value });
      renderUser();
      toast(`¡Hola, ${name.split(" ")[0]}!`, "👋");
      await closeSheet();
      if (after) after();
      else { const nx = store.get<string>("next", ""); if (nx) { store.set("next", ""); location.hash = nx; } }
    });
    setTimeout(() => $<HTMLInputElement>(m === "register" ? "#l-n" : "#l-e", s)?.focus(), 350);
  });
}

/* ═════ Vender ═════ */
export function openSell(presetId?: string, presetQty = 2) {
  const html = `<div class="relative p-6 pt-8 sm:p-8">${closeBtn}
    <h3 class="text-2xl font-semibold">Vender entrada</h3><p class="mt-1 text-sub">Publica gratis. Cobras automáticamente tras el evento.</p>
    <form id="sf" class="mt-6 space-y-4" novalidate>
      <label class="block text-sm text-sub">Evento<select id="s-ev" class="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-ink outline-none focus:border-accent">${events.map((e) => `<option value="${e.id}" ${e.id === presetId ? "selected" : ""}>${nameOf(e)} · ${e.c}</option>`).join("")}</select></label>
      <label class="block text-sm text-sub">Tipo de entrada<select id="s-type" class="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-ink outline-none focus:border-accent"></select></label>
      <div class="grid grid-cols-2 gap-3"><div class="flex items-center justify-between rounded-xl bg-soft p-2"><button type="button" data-q="-1" class="grid h-10 w-10 place-items-center rounded-lg bg-white text-xl shadow-sm" aria-label="Menos">−</button><span id="s-q" class="text-xl font-semibold tabular-nums">${presetQty}</span><button type="button" data-q="1" class="grid h-10 w-10 place-items-center rounded-lg bg-white text-xl shadow-sm" aria-label="Más">+</button></div>
        ${field("s-p", "€ por entrada", "number", 'min="1" max="999" value="60"')}</div>
      <div class="rounded-2xl bg-accent/10 p-5"><p class="text-sm text-accent">Cobrarías</p><p class="text-4xl font-semibold text-accent"><span id="s-earn">0</span> €</p><p class="mt-1 text-xs text-sub">Venta bruta <span id="s-gross"></span> · comisión 10 %</p></div>
      <button class="btn btn-accent w-full !py-4" id="s-go">Publicar entradas</button></form></div>`;
  openSheet(html, (s) => {
    let q = presetQty;
    const sel = $<HTMLSelectElement>("#s-ev", s)!, tsel = $<HTMLSelectElement>("#s-type", s)!, price = $<HTMLInputElement>("#s-p", s)!, earn = $("#s-earn", s)!, o = { v: 0 };
    const types = () => extra[sel.value].tickets;
    const fillTypes = () => { tsel.innerHTML = types().map((k, i) => `<option value="${i}">${k.n}</option>`).join(""); price.value = String(types()[+tsel.value || 0].from); };
    const calc = () => {
      const g = q * (+price.value || 0), e = g - Math.round(g * 0.1);
      $("#s-q", s)!.textContent = String(q); $("#s-gross", s)!.textContent = eur(g);
      gsap.to(o, { v: e, duration: 0.45, ease: "power2.out", onUpdate: () => (earn.textContent = Math.round(o.v).toString()) });
    };
    fillTypes();
    sel.addEventListener("change", () => { tsel.value = "0"; fillTypes(); calc(); });
    tsel.addEventListener("change", () => { price.value = String(types()[+tsel.value].from); calc(); });
    price.addEventListener("input", calc);
    $$("[data-q]", s).forEach((b) => b.addEventListener("click", () => { q = Math.max(1, Math.min(10, q + Number(b.dataset.q))); calc(); }));
    calc();
    $("#sf", s)!.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!(+price.value > 0)) { err(price, "Indica un precio"); return; }
      if (!getUser()) { toast("Inicia sesión para publicar", "i"); openLogin("login", () => openSell(sel.value, q)); return; }
      const b = $("#s-go", s) as HTMLButtonElement; b.disabled = true; b.innerHTML = `${spinner} Publicando…`;
      await sleep(1000);
      const list = store.get<Listing[]>("selling", []);
      list.unshift({ id: uid(), ev: sel.value, type: types()[+tsel.value].n, qty: q, price: +price.value, at: Date.now() });
      store.set("selling", list);
      await closeSheet();
      confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.5, 180);
      toast("¡Entradas publicadas! Te avisamos cuando se vendan", "🚀");
      if (location.hash === "#/mis-anuncios") dispatchEvent(new Event("ht:rerender")); else location.hash = "#/mis-anuncios";
    });
  });
}

/* ═════ Editar precio de un anuncio ═════ */
export function openEditListing(id: string, done: () => void) {
  const list = store.get<Listing[]>("selling", []), l = list.find((x) => x.id === id);
  if (!l) return;
  openSheet(`<div class="relative p-6 pt-8 sm:p-8">${closeBtn}<h3 class="text-2xl font-semibold">Cambiar precio</h3><p class="mt-1 text-sub">${nameOf(byId(l.ev)!)} · ${l.type}</p>
    <form id="ef" class="mt-6 space-y-4" novalidate>${field("e-p", "€ por entrada", "number", `min="1" max="999" value="${l.price}"`)}<button class="btn btn-accent w-full !py-4">Guardar</button></form></div>`, (s) => {
    $("#ef", s)!.addEventListener("submit", async (e) => {
      e.preventDefault();
      const p = $<HTMLInputElement>("#e-p", s)!;
      if (!(+p.value > 0)) { err(p, "Indica un precio"); return; }
      l.price = +p.value; store.set("selling", list);
      await closeSheet(); toast("Precio actualizado", "✓"); done();
    });
  });
}

/* ═════ Ver QR grande ═════ */
export function openQR(t: Ticket) {
  const ev = byId(t.ev)!;
  openSheet(`<div class="relative px-6 pb-8 pt-12 text-center sm:px-8">${closeBtn}<p class="text-sm text-accent">${fechaLarga(ev.date)}</p><h3 class="mt-1 text-2xl font-semibold">${nameOf(ev)}</h3><p class="text-sub">${t.type} · ${t.qty}×</p>
    <div class="qr mx-auto mt-6 w-56 rounded-2xl bg-white p-3 shadow-[0_14px_40px_-16px_rgba(0,0,0,0.3)] ring-1 ring-black/5" data-code></div><p class="mt-4 font-mono tracking-widest text-sub">${t.code}</p>
    <button type="button" data-close class="btn btn-dark mt-6 w-full">Cerrar</button></div>`, (s) => paintQR($("[data-code]", s)!, t.code));
}

/* ═════ Descargar entrada (PNG generado en el navegador) ═════ */
export function downloadTicket(t: Ticket) {
  const ev = byId(t.ev)!, c = document.createElement("canvas");
  c.width = 1200; c.height = 520;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff"; x.fillRect(0, 0, 1200, 520);
  x.fillStyle = "#f6f6f7"; x.fillRect(0, 0, 1200, 520);
  x.fillStyle = "#fff"; x.beginPath(); x.roundRect(20, 20, 1160, 480, 28); x.fill();
  x.fillStyle = "#e8590c"; x.beginPath(); x.roundRect(20, 20, 24, 480, [28, 0, 0, 28]); x.fill();
  x.fillStyle = "#17171c"; x.font = "700 54px Poppins, sans-serif"; x.fillText("handticket", 80, 100);
  x.font = "500 44px Poppins, sans-serif"; const nm = nameOf(ev); x.fillText(nm.length > 30 ? nm.slice(0, 29) + "…" : nm, 80, 190);
  x.fillStyle = "#e8590c"; x.font = "400 32px Poppins, sans-serif"; x.fillText(fechaLarga(ev.date), 80, 240);
  x.fillStyle = "#5f6068"; x.fillText(`${ev.v}, ${ev.c}`, 80, 290);
  x.fillText(`${t.type} · ${t.qty}×`, 80, 340);
  x.font = "500 40px monospace"; x.fillStyle = "#17171c"; x.fillText(t.code, 80, 430);
  // QR
  const N = 13, cell = 17, ox = 880, oy = 130;
  let h = 2166136261; for (const ch of t.code) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h >>> 0) % 1000) / 1000);
  x.fillStyle = "#0a0a14";
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const f = [[0, 0], [N - 4, 0], [0, N - 4]].find(([a, b]) => i >= a && i < a + 4 && j >= b && j < b + 4);
    const on = f ? (i - f[0] === 0 || j - f[1] === 0 || i - f[0] === 3 || j - f[1] === 3 || (i - f[0] === 1 && j - f[1] === 1)) : rnd() > 0.52;
    if (on) x.fillRect(ox + i * cell * 1.0, oy + j * cell * 1.0, cell - 2, cell - 2);
  }
  x.strokeStyle = "#e2e2e8"; x.setLineDash([10, 10]); x.lineWidth = 3; x.beginPath(); x.moveTo(820, 40); x.lineTo(820, 480); x.stroke();
  c.toBlob((b) => {
    if (!b) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `entrada-${t.code}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Entrada descargada", "⬇");
  });
}
