import * as API from "./api";
import { gsap } from "gsap";
import { animate, hover, stagger } from "motion";
import { $, $$, toast, reduced, fine } from "./util";
import { esc, norm, matchEvents, nameOf, artBg, fechaLarga, SPRING, store, getUser, renderUser, err, emailOk, events, extra, openSheet, closeSheet, closeBtn, field } from "./r-core";
import { openLogin } from "./r-sheets";
import { startSell, getDraft, resetDraft } from "./r-wizard";
import { help, allArticles, count, type Collection } from "../data/help";

const ICON: Record<Collection["icon"], string> = {
  ticket: `<svg viewBox="0 0 48 48" class="h-11 w-11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14h36a2 2 0 012 2v5a3 3 0 000 6v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a3 3 0 000-6v-5a2 2 0 012-2zM30 14v20" stroke-dasharray="2.5 3.5"/><path d="M12 22h8M12 27h5"/></svg>`,
  rocket: `<svg viewBox="0 0 48 48" class="h-11 w-11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 8c6 0 10 4 10 10 0 8-8 15-16 17l-9-9C17 18 24 10 30 8zM15 26l-6 2 3 3-1 6 6-1 3 3 2-6M31 17a2 2 0 100 4 2 2 0 000-4z"/></svg>`,
  bank: `<svg viewBox="0 0 48 48" class="h-11 w-11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18L24 7l18 11M10 18v18M18 18v18M30 18v18M38 18v18M6 38h36M4 42h40"/></svg>`,
  finger: `<svg viewBox="0 0 48 48" class="h-11 w-11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16c3-6 9-9 15-8 6 1 10 5 11 11v6M8 24c0-2 .3-4 1-6M16 40c1-3 2-6 2-10 0-4 3-7 7-7s7 3 7 7c0 4-1 8-3 12M22 42c1-3 2-6 2-9 0-2 2-3 3-3M11 36c2-3 3-7 3-11 0-6 5-11 11-11 4 0 7 2 9 5"/></svg>`,
};
const chev = `<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;

/* ═══════════════ Centro de ayuda ═══════════════ */
function banner(title: string, sub = "", crumbs = "") {
  return `<section class="bg-accent text-white"><div class="mx-auto max-w-[70rem] px-6 pb-10 pt-28 sm:pt-32">
    ${crumbs}<h1 class="text-[1.7rem] font-bold sm:text-[2.1rem]" data-h-in>${title}</h1>${sub ? `<p class="mt-2 max-w-2xl text-white/85" data-h-in>${sub}</p>` : ""}
    <label class="mt-6 flex h-[4.2rem] items-center gap-3 rounded-xl bg-white/20 px-5 backdrop-blur transition focus-within:bg-white/30" data-h-in><svg viewBox="0 0 24 24" class="h-7 w-7 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input id="h-q" type="search" autocomplete="off" placeholder="Buscar artículos..." aria-label="Buscar artículos" class="w-full bg-transparent text-lg outline-none placeholder:text-white/90" /></label>
  </div></section>`;
}
const contact = `<div class="card-line mt-14 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center" data-h-in><div><p class="text-lg font-semibold">¿No encuentras lo que buscas?</p><p class="text-sub">Nuestro equipo te responde en menos de 24 horas.</p></div><button id="h-contact" class="black-btn">Contactar con soporte</button></div>`;
const foot = `<div class="mt-16 text-center text-sm text-sub"><p class="text-base text-ink/50">Soporte - Handticket</p><p class="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2"><a href="#/legal/terminos">Términos y condiciones</a><a href="#/legal/cookies">Política de cookies</a><a href="#/legal/privacidad">Política de privacidad</a></p></div>`;

export function renderHelp(cat?: string, art?: string): string {
  const c = help.find((x) => x.id === cat);
  const a = c?.items.find((x) => x.slug === art);
  if (c && a) {
    const rel = c.items.filter((x) => x !== a).slice(0, 4);
    const body = a.body.map((p) => /^\d\.\s/.test(p) ? `<li class="pl-1">${esc(p.replace(/^\d\.\s/, ""))}</li>` : `<p>${esc(p)}</p>`);
    const html: string[] = []; let steps: string[] = [];
    a.body.forEach((p, i) => { if (/^\d\.\s/.test(p)) { steps.push(body[i]); } else { if (steps.length) { html.push(`<ol class="ml-5 list-decimal space-y-2">${steps.join("")}</ol>`); steps = []; } html.push(body[i]); } });
    if (steps.length) html.push(`<ol class="ml-5 list-decimal space-y-2">${steps.join("")}</ol>`);
    return `${banner("Centro de ayuda - Handticket")}<div class="mx-auto max-w-[56rem] px-6 pb-20 pt-8" id="h-main">
      <nav class="flex flex-wrap items-center gap-2 text-sm text-sub" aria-label="Ruta" data-h-in><a href="#/ayuda" class="hover:text-accent">Todas las colecciones</a>${chev}<a href="#/ayuda/${c.id}" class="hover:text-accent">${esc(c.n)}</a></nav>
      <h2 class="mt-6 text-[1.8rem] font-bold leading-tight sm:text-[2.3rem]" data-h-in>${esc(a.t)}</h2><p class="mt-2 text-sm text-sub" data-h-in>Actualizado ${a.upd}</p>
      <div class="mt-8 space-y-4 text-[1.02rem] leading-[1.75] text-ink/85" data-h-in>${html.join("")}</div>
      <div class="mt-12 rounded-2xl bg-soft p-6 text-center" data-h-in><p class="font-medium">¿Te ha sido útil este artículo?</p><div class="mt-3 flex justify-center gap-3" id="h-fb">${["😞", "😐", "😃"].map((e) => `<button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl shadow-sm transition hover:-translate-y-0.5" aria-label="Valoración">${e}</button>`).join("")}</div></div>
      <h3 class="mt-12 text-lg font-semibold" data-h-in>Artículos relacionados</h3>
      <ul class="mt-3 divide-y divide-line rounded-xl border border-line" data-h-in>${rel.map((r) => `<li><a href="#/ayuda/${c.id}/${r.slug}" class="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-soft">${esc(r.t)}${chev}</a></li>`).join("")}</ul>
      ${contact}</div>`;
  }
  if (c) return `${banner(esc(c.n), esc(c.d))}<div class="mx-auto max-w-[56rem] px-6 pb-20 pt-8" id="h-main">
      <nav class="flex items-center gap-2 text-sm text-sub" aria-label="Ruta" data-h-in><a href="#/ayuda" class="hover:text-accent">Todas las colecciones</a></nav>
      <p class="mt-4 text-sm text-sub" data-h-in>${count(c)}</p>
      <ul class="mt-4 divide-y divide-line rounded-xl border border-line" id="h-list">${c.items.map((r) => `<li data-h-row><a href="#/ayuda/${c.id}/${r.slug}" class="flex items-center justify-between gap-4 px-5 py-[1.15rem] transition hover:bg-soft"><span class="font-medium">${esc(r.t)}</span>${chev}</a></li>`).join("")}</ul>
      ${contact}</div>`;
  return `${banner("Centro de ayuda - Handticket")}<div class="mx-auto max-w-[70rem] px-6 pb-20 pt-10" id="h-main">
    <div id="h-cols" class="space-y-5">${help.map((x) => `<a href="#/ayuda/${x.id}" class="hcol card-line flex items-center gap-8 px-8 py-8 transition hover:shadow-[0_14px_34px_-18px_rgba(0,0,0,0.25)] sm:px-12" data-h-card><span class="hicon grid h-16 w-16 shrink-0 place-items-center text-accent">${ICON[x.icon]}</span><span class="min-w-0"><span class="block text-lg font-semibold">${esc(x.n)}</span><span class="mt-1 block text-ink/85">${esc(x.d)}</span><span class="mt-3 block text-sm text-sub">${count(x)}</span></span></a>`).join("")}</div>
    <div id="h-res" class="hidden"></div>
    ${contact}${foot}</div>`;
}

export function initHelp(root: HTMLElement, cat: string | undefined, art: string | undefined, sig: AbortSignal) {
  if (!reduced) {
    gsap.fromTo("[data-h-in]", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" });
    gsap.fromTo("[data-h-card], [data-h-row]", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", delay: 0.25 });
    gsap.fromTo(".hicon", { scale: 0.5, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.9, stagger: 0.09, ease: "back.out(2)", delay: 0.4 });
  }
  if (fine && !reduced) hover(".hcol", (el) => { animate(el, { y: -4 }, SPRING); const i = el.querySelector(".hicon")!; animate(i, { rotate: [0, -8, 8, 0] }, { duration: 0.5 }); return () => animate(el, { y: 0 }, SPRING); });
  $("#h-contact", root)?.addEventListener("click", () => {
    if (!API.serverMode) { toast("Escríbenos a ayuda@handticket.es (demo)", "✉"); return; }
    const u = getUser();
    openSheet(`<div class="relative p-6 pt-8 sm:p-8">${closeBtn}<h3 class="text-2xl font-semibold">Contactar con soporte</h3><p class="mt-1 text-sub">Te respondemos por email en menos de 24 horas.</p>
      <form id="cf" class="mt-6 space-y-3" novalidate>${field("c-e", "Email", "email", `value="${u?.email ?? ""}"`)}${field("c-s", "Asunto")}
      <div class="fld"><textarea id="c-m" placeholder=" " rows="5" class="w-full rounded-xl border border-line px-4 pb-3 pt-6 outline-none focus:border-accent" style="resize:vertical"></textarea><label for="c-m">Cuéntanos qué ha pasado (incluye el código del pedido si lo tienes)</label><p class="msg" aria-live="polite"></p></div>
      <button class="btn btn-accent w-full !py-4">Enviar mensaje</button></form></div>`, (sh) => {
      $("#cf", sh)!.addEventListener("submit", async (e) => {
        e.preventDefault();
        const em = $<HTMLInputElement>("#c-e", sh)!, su = $<HTMLInputElement>("#c-s", sh)!, ms = $<HTMLTextAreaElement>("#c-m", sh)!;
        if (![err(em, emailOk(em.value) ? "" : "Introduce un email válido"), err(su, su.value.trim().length >= 3 ? "" : "Cuéntanos el asunto")].every(Boolean)) return;
        if (ms.value.trim().length < 10) { toast("Describe un poco más tu problema", "!"); return; }
        try { await API.post("/api/support", { email: em.value, subject: su.value, message: ms.value }); await closeSheet(); toast("Mensaje enviado. Te responderemos por email", "✉"); }
        catch (er) { toast((er as Error).message, "!"); }
      });
    });
  }, { signal: sig });
  $$("#h-fb button", root).forEach((b) => b.addEventListener("click", () => { $$("#h-fb button", root).forEach((x) => x.classList.toggle("ring-2", x === b)); b.classList.add("ring-accent"); toast("¡Gracias por tu opinión!", "💛"); animate(b, { scale: [1, 1.35, 1] }, { duration: 0.4 }); }, { signal: sig }));
  // buscador de artículos
  const q = $<HTMLInputElement>("#h-q", root)!, res = $("#h-res", root), cols = $("#h-cols", root);
  const hl = (s: string, t: string) => esc(s).replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), '<mark class="rounded bg-accent/15 px-0.5 text-inherit">$1</mark>');
  q.addEventListener("input", () => {
    const t = q.value.trim();
    if (!res) { if (t) location.hash = "#/ayuda"; return; }
    if (!t) { res.classList.add("hidden"); cols?.classList.remove("hidden"); return; }
    const n = norm(t), m = allArticles().filter((a) => norm(a.t + " " + a.body.join(" ")).includes(n));
    cols?.classList.add("hidden"); res.classList.remove("hidden");
    res.innerHTML = m.length
      ? `<p class="mb-3 text-sm text-sub">${m.length} resultado${m.length === 1 ? "" : "s"}</p><ul class="divide-y divide-line rounded-xl border border-line">${m.map((a) => `<li><a href="#/ayuda/${a.cat.id}/${a.slug}" class="block px-5 py-4 transition hover:bg-soft"><span class="block font-medium">${hl(a.t, t)}</span><span class="mt-1 block text-xs text-accent">${esc(a.cat.n)}</span><span class="mt-1 line-clamp-2 block text-sm text-sub">${hl(a.body.find((b) => norm(b).includes(n)) ?? a.body[0], t)}</span></a></li>`).join("")}</ul>`
      : `<div class="card-line p-10 text-center"><p class="text-lg font-semibold">No hemos encontrado artículos para «${esc(t)}»</p><p class="mt-1 text-sub">Prueba con otras palabras o contacta con soporte.</p></div>`;
    if (!reduced) animate(res.querySelectorAll("li"), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.03), duration: 0.3 });
  }, { signal: sig });
  void cat; void art;
}

/* ═══════════════ Perfil / Mis pagos ═══════════════ */
const lbl = (id: string, text: string, val = "", type = "text", extraAttr = "") => `<div><label for="${id}" class="mb-2.5 ml-2 block font-medium">${text}</label><div class="fld !static"><input id="${id}" type="${type}" value="${esc(val)}" placeholder=" " ${extraAttr} class="!h-16 !rounded-xl !border-0 !bg-[#f6f6f7] !px-5 !py-0 !text-base" /><p class="msg"></p></div></div>`;
export function renderProfile(tab: "perfil" | "pagos"): string {
  const u = getUser()!;
  const pay = store.get<{ holder: string; last4: string } | null>("pay", null);
  const tabs = `<div class="mx-auto max-w-[52rem]"><nav class="flex items-center gap-2 border-b border-line pb-4" aria-label="Zona de perfil" data-p-in>
      <a href="#/perfil" class="ptab ${tab === "perfil" ? "on" : ""}"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>Perfil</a>
      <a href="#/perfil/pagos" class="ptab ${tab === "pagos" ? "on" : ""}"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>Mis pagos</a></nav>`;
  if (tab === "pagos")
    return `<section class="px-6 pb-24 pt-32 md:pt-40">${tabs}<form id="p-form" class="mt-12 space-y-7" novalidate data-p-in>
      ${lbl("p-holder", "Nombre y apellidos del titular", pay?.holder ?? "", "text", 'autocomplete="off"')}
      ${lbl("p-iban", "IBAN", pay ? `•••• •••• •••• •••• ${pay.last4}` : "", "text", 'autocomplete="off" inputmode="text" placeholder="ES00 0000 0000 0000 0000 0000"')}
      <p class="-mt-3 text-ink/90">Estos datos solo serán visibles para ti, y serán encriptados de forma segura.</p>
      <p class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Demostración: no introduzcas datos bancarios reales. Solo se guardan el titular y los 4 últimos dígitos en este navegador.</p>
      <button class="black-btn !px-6 !py-4 text-base">Guardar</button></form></div></section>`;
  return `<section class="px-6 pb-24 pt-32 md:pt-40">${tabs}<form id="p-form" class="mt-12 space-y-7" novalidate data-p-in>
      ${lbl("p-name", "Nombre y apellidos", u.name, "text", 'autocomplete="name"')}${lbl("p-email", "Email", u.email, "email", 'autocomplete="email"')}
      <button class="black-btn !px-6 !py-4 text-base">Guardar</button></form></div></section>`;
}
export function initProfile(root: HTMLElement, tab: "perfil" | "pagos", sig: AbortSignal) {
  if (!reduced) {
    gsap.fromTo("[data-p-in]", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" });
    gsap.fromTo(".ptab.on", { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "back.out(2)", delay: 0.15 });
  }
  $("#p-form", root)!.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (tab === "perfil") {
      const n = $<HTMLInputElement>("#p-name", root)!, em = $<HTMLInputElement>("#p-email", root)!;
      if (![err(n, n.value.trim().length >= 2 ? "" : "Dinos tu nombre"), err(em, emailOk(em.value) ? "" : "Introduce un email válido")].every(Boolean)) return;
      if (API.serverMode) { try { await API.patch("/api/me", { name: n.value.trim() }); } catch (er) { err(n, (er as Error).message); return; } }
      store.set("user", { name: n.value.trim(), email: API.serverMode ? (getUser()?.email ?? em.value.trim()) : em.value.trim() }); renderUser(); toast("Perfil actualizado", "✓");
    } else {
      const h = $<HTMLInputElement>("#p-holder", root)!, ib = $<HTMLInputElement>("#p-iban", root)!;
      const raw = ib.value.replace(/\s/g, "").toUpperCase(), masked = ib.value.includes("•");
      const okI = masked || /^ES\d{22}$/.test(raw);
      if (![err(h, h.value.trim().length >= 3 ? "" : "Nombre y apellidos del titular"), err(ib, okI ? "" : "IBAN no válido (ES + 22 dígitos)")].every(Boolean)) return;
      const prev = store.get<{ holder: string; last4: string } | null>("pay", null);
      if (API.serverMode && !masked) { try { await API.put("/api/me/payout", { holder: h.value.trim(), iban: raw }); } catch (er) { err(ib, (er as Error).message); return; } }
      store.set("pay", { holder: h.value.trim(), last4: masked ? prev?.last4 ?? "0000" : raw.slice(-4) });
      toast("Datos de pago guardados", "✓");
    }
  }, { signal: sig });
  $("#p-iban", root)?.addEventListener("input", (e) => { const i = e.target as HTMLInputElement; if (!i.value.includes("•")) i.value = i.value.replace(/[^\dA-Za-z]/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim(); }, { signal: sig });
  $("#p-iban", root)?.addEventListener("focus", (e) => { const i = e.target as HTMLInputElement; if (i.value.includes("•")) i.value = ""; }, { signal: sig });
}

/* ═══════════════ Vender · selecciona el evento ═══════════════ */
export function renderPick(q = ""): string {
  const list = matchEvents(q);
  const d = getDraft(), de = d.ev ? events.find((e) => e.id === d.ev) : undefined;
  const draftCard = de ? `<div id="k-draft" data-k-in><p class="text-[1.15rem]">Tienes un anuncio sin terminar</p><div class="mt-3 flex items-center gap-4 rounded-xl bg-[#efeff0] p-3"><span class="card-art h-[6.2rem] w-[6.2rem] shrink-0 !rounded-lg"><span class="art block h-full w-full" style="${artBg(de.id)}"></span></span><span class="min-w-0 flex-1"><span class="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">Borrador</span><span class="mt-1 block truncate text-[1.1rem] font-medium">${esc(nameOf(de))}</span><span class="block text-sub">${fechaLarga(de.date)}</span></span><button id="k-drop" class="px-3 text-sub hover:text-ink">Descartar</button><a href="#/vender/anuncio" class="wbtn !px-5 !py-3 !font-semibold">Continuar</a></div></div>` : "";
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-28 md:pt-32">${draftCard}<div class="${de ? "mt-10" : ""}"></div>
    <h1 class="text-[2.4rem] font-medium leading-none tracking-tight sm:text-[3.4rem]" data-k-in>Selecciona el evento</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-k-in>Selecciona el evento para el que quieres vender entradas</p>
    <input id="k-q" type="search" autocomplete="off" placeholder="Busca el evento" aria-label="Busca el evento" value="${esc(q)}" class="mt-8 h-16 w-full rounded-xl bg-[#f0f0f1] px-6 text-lg outline-none transition placeholder:text-ink/40 focus:bg-[#e9e9eb] focus:ring-2 focus:ring-accent/40" data-k-in />
    <ul id="k-list" class="mt-7 space-y-3">${pickRows(list)}</ul></section>`;
}
const pickRows = (l: ReturnType<typeof matchEvents>) => l.length
  ? l.map((e) => `<li><button type="button" class="krow" data-k="${e.id}"><span class="card-art h-[6.2rem] w-[6.2rem] shrink-0 !rounded-lg"><span class="art block h-full w-full" style="${artBg(e.id)}"></span></span><span class="min-w-0 flex-1 text-left"><span class="block truncate text-[1.05rem] font-semibold">${esc(nameOf(e))}</span><span class="mt-1 block truncate text-sub">${esc(e.v)}, ${esc(extra[e.id].area)}</span><span class="mt-1 block text-sub">${e.id === "duro-festival" ? "10 de octubre - 11 de octubre" : fechaLarga(e.date)}</span></span></button></li>`).join("")
  : `<li class="rounded-xl bg-soft p-8 text-center text-sub">No hay eventos con ese nombre. Prueba con otro artista, ciudad o recinto.</li>`;
export function initPick(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) {
    gsap.fromTo("[data-k-in]", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out" });
    gsap.fromTo(".krow", { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", delay: 0.25 });
  }
  const list = $("#k-list", root)!, q = $<HTMLInputElement>("#k-q", root)!;
  q.addEventListener("input", () => {
    list.innerHTML = pickRows(matchEvents(q.value));
    if (!reduced) animate(list.querySelectorAll(".krow"), { opacity: [0, 1], y: [14, 0] }, { delay: stagger(0.04), duration: 0.3 });
  }, { signal: sig });
  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-k]");
    if (!b) return;
    if (!getUser()) { toast("Inicia sesión para vender", "i"); openLogin("login", () => startSell(b.dataset.k)); return; }
    startSell(b.dataset.k);
  }, { signal: sig });
  if (fine && !reduced) hover(".krow", (el) => { animate(el, { x: 6 }, SPRING); return () => animate(el, { x: 0 }, SPRING); });
  $("#k-drop", root)?.addEventListener("click", () => { resetDraft(); gsap.to("#k-draft", { height: 0, autoAlpha: 0, marginBottom: 0, duration: 0.4, onComplete: () => $("#k-draft", root)?.remove() }); toast("Borrador descartado", "🗑"); }, { signal: sig });
  setTimeout(() => q.focus(), 400);
  void events;
}
