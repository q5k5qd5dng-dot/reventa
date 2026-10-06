import * as API from "./api";
import { gsap } from "gsap";
import { animate, hover, stagger } from "motion";
import { $, $$, toast, reduced, fine, countTo } from "./util";
import { esc, nameOf, artBg, fechaLarga, SPRING, store, getUser, err, byId, events, extra, spinner, sleep, emailOk } from "./r-core";
import { confetti } from "./confetti";

/* ═════ Borrador del anuncio ═════ */
export interface VPage { n: number; ok: boolean; label: string; reason: string; sel: boolean }
export interface VFile { id: string; name: string; size: number; kind: "pdf" | "img"; hash: string; url?: string; pages: VPage[] }
export interface Draft { ev?: string; type: number; files: VFile[]; orig?: number; price?: number; zone: string; row: string; seat: string; note: string; nominative: boolean; terms?: boolean; pay?: { holder: string; last4: string } }
const blank = (): Draft => ({ type: 0, files: [], zone: "", row: "", seat: "", note: "", nominative: false });
let draft: Draft = (() => { const d = store.get<Draft | null>("draft", null); if (d) d.files.forEach((f) => (f.url = undefined)); return d ?? blank(); })();
const save = () => store.set("draft", { ...draft, files: draft.files.map((f) => ({ ...f, url: undefined })) });
export const getDraft = () => draft;
export function startSell(evId?: string) {
  if (evId) { if (draft.ev !== evId) { draft = blank(); draft.ev = evId; } save(); location.hash = "#/vender/anuncio"; }
  else location.hash = "#/vender/evento";
}
export const resetDraft = () => { draft = blank(); save(); };

const selPages = () => draft.files.flatMap((f) => f.pages.filter((p) => p.ok && p.sel));
const validPages = () => draft.files.flatMap((f) => f.pages.filter((p) => p.ok));
const doneEv = () => !!draft.ev;
const doneTix = () => selPages().length > 0;
const donePrice = () => !!draft.price && !!draft.orig;
const donePay = () => !!draft.pay;
const money = (n: number) => `${n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

/* ═════ Plantillas comunes ═════ */
const STEPS = ["Entradas", "Precio", "Información", "Información de pago"];
const stepper = (cur: number) => `<ol class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.95rem]" aria-label="Pasos" data-w-in>${STEPS.map((s, i) => `<li class="flex items-center gap-3"><span class="flex items-center gap-2 ${i === cur ? "text-accent" : i < cur ? "text-ink" : "text-ink"}"><span class="grid h-[1.15rem] w-[1.15rem] place-items-center rounded-full border-[1.5px] ${i === cur ? "border-accent" : i < cur ? "border-accent bg-accent text-white" : "border-ink/80"}">${i < cur ? `<svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>` : ""}</span>${s}</span>${i < STEPS.length - 1 ? `<svg viewBox="0 0 24 24" class="h-4 w-4 text-ink/40" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>` : ""}</li>`).join("")}</ol>`;
const faqItem = (q: string, a: string, open = false) => `<details class="border-b border-line py-5" ${open ? "open" : ""}><summary class="flex cursor-pointer items-center justify-between gap-4 text-[1.02rem]">${q}<span class="faq-i grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span></summary><p class="mt-3 pr-10 text-[0.92rem] leading-relaxed text-ink/80">${a}</p></details>`;
const actions = (backHref: string, canNext: boolean, label = "Continuar") => `<div class="mt-10 flex items-center justify-between" data-w-in><a href="${backHref}" class="inline-flex items-center gap-2 py-3 text-base"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Atrás</a><button id="w-next" class="wbtn" ${canNext ? "" : "disabled"}>${label}</button></div>`;
const lbl = (id: string, text: string, val = "", extraAttrs = "", type = "text") => `<div><label for="${id}" class="mb-2 ml-1 block font-medium">${text}</label><div class="fld !static"><input id="${id}" type="${type}" value="${esc(String(val))}" placeholder=" " ${extraAttrs} class="!h-16 !rounded-xl !border-0 !bg-[#f6f6f7] !px-5 !py-0 !text-base" /><p class="msg"></p></div></div>`;

/* ═════ HUB · Completa tu anuncio ═════ */
export function renderHub(): string {
  const e = draft.ev ? byId(draft.ev) : undefined;
  const rows: { id: string; t: string; d: string; done: boolean; unlocked: boolean; href: string; sum?: string; optional?: boolean }[] = [
    { id: "ev", t: "Evento", d: "Selecciona el evento para el que quieres vender entradas", done: doneEv(), unlocked: true, href: "#/vender/evento", sum: e ? `${nameOf(e)} · ${fechaLarga(e.date)}` : "" },
    { id: "tix", t: "Entradas", d: "Sube las entradas que quieras vender", done: doneTix(), unlocked: doneEv(), href: "#/vender/entradas", sum: doneTix() ? `${selPages().length} entrada${selPages().length > 1 ? "s" : ""} · ${extra[draft.ev!].tickets[draft.type]?.n ?? ""}` : "" },
    { id: "orig", t: "Precio original de la entrada", d: "El importe pagado por la entrada", done: !!draft.orig, unlocked: doneTix(), href: "#/vender/precio", sum: draft.orig ? `${money(draft.orig)} por entrada` : "" },
    { id: "price", t: "Precio de venta", d: "El precio al que quieres vender tus entradas", done: !!draft.price, unlocked: doneTix(), href: "#/vender/precio", sum: draft.price ? `${money(draft.price)} por entrada` : "" },
    { id: "info", t: "Añadir detalles de las entradas", d: "Zona, fila, asiento y comentario para los compradores", done: doneTix(), unlocked: doneTix(), href: "#/vender/informacion", optional: true, sum: draft.zone || draft.note ? [draft.zone, draft.row && `Fila ${draft.row}`, draft.seat && `Asiento ${draft.seat}`].filter(Boolean).join(" · ") : "Opcional" },
    { id: "pay", t: "Información de pago", d: "Dónde ingresaremos el dinero de tus ventas", done: donePay(), unlocked: donePrice(), href: "#/vender/pago", sum: draft.pay ? `${draft.pay.holder} · •••• ${draft.pay.last4}` : "" },
  ];
  const cur = rows.find((r) => !r.done && r.unlocked && !r.optional);
  const ready = doneEv() && doneTix() && donePrice() && donePay();
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-32 md:pt-36">
    <h1 class="text-[2.4rem] font-semibold leading-none tracking-tight sm:text-[3.4rem]" data-w-in>Completa tu anuncio</h1>
    <p class="mt-4 text-lg text-ink/80" data-w-in>Revisa si la información es correcta y publica tu anuncio.</p>
    <div class="card-line mt-8 divide-y divide-line" data-w-in id="hub">${rows.map((r) => `<div class="hrow px-6 py-5" data-hrow="${r.id}"><div class="flex items-center justify-between gap-4"><p class="font-semibold">${r.t}</p>${r.done && !r.optional ? `<span class="hcheck grid h-8 w-8 place-items-center rounded-full bg-accent text-white"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span>` : r.optional && r.unlocked ? `<span class="hcheck grid h-8 w-8 place-items-center rounded-full bg-accent text-white"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span>` : r.unlocked ? `<a href="${r.href}" class="font-medium text-accent hover:underline">Editar</a>` : `<span class="text-ink/25">Editar</span>`}</div>
      <p class="mt-1.5 text-sm text-ink/70">${r.done && r.sum ? esc(r.sum) : r.d}</p>
      ${r.done || (r.optional && r.unlocked) ? (r.unlocked ? `<a href="${r.href}" class="mt-2 inline-block text-sm font-medium text-accent hover:underline">Editar</a>` : "") : ""}
      ${cur === r ? `<a href="${r.href}" class="wbtn mt-4 inline-flex !bg-ink !text-white" id="w-cur">Completar este paso</a>` : ""}</div>`).join("")}</div>
    <label class="mt-8 flex cursor-pointer items-start gap-3 text-[0.95rem] text-ink/80" data-w-in><input id="w-terms" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[#e8590c]" ${draft.terms ? "checked" : ""} /><span>He leído y acepto los <a href="#/legal/terminos" class="text-accent underline" target="_blank">Términos y condiciones</a> y la <a href="#/legal/privacidad" class="text-accent underline" target="_blank">Política de privacidad</a>. Confirmo que soy el titular legítimo de las entradas y que el precio no supera el 130 % del original.</span></label>
    <div class="mt-8 flex items-center justify-between" data-w-in><button id="w-reset" class="text-[1.02rem] text-[#d92d20] hover:underline">Volver a empezar</button><button id="w-publish" class="wbtn" ${ready && draft.terms ? "" : "disabled"}>Publicar anuncio</button></div></section>`;
}
export function initHub(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) {
    gsap.fromTo("[data-w-in]", { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out" });
    gsap.fromTo(".hrow", { x: -20, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, ease: "power3.out", delay: 0.25 });
    gsap.fromTo(".hcheck", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: "back.out(2.4)", delay: 0.5 });
    gsap.fromTo("#w-cur", { scale: 0.9 }, { scale: 1, duration: 0.8, ease: "elastic.out(1,0.5)", delay: 0.6 });
  }
  $("#w-reset", root)!.addEventListener("click", () => { resetDraft(); toast("Hemos empezado de nuevo", "↺"); location.hash = "#/vender/evento"; }, { signal: sig });
  const pub = $<HTMLButtonElement>("#w-publish", root)!;
  $<HTMLInputElement>("#w-terms", root)!.addEventListener("change", (e) => { draft.terms = (e.target as HTMLInputElement).checked; save(); pub.disabled = !(doneEv() && doneTix() && donePrice() && donePay() && draft.terms); }, { signal: sig });
  $("#w-publish", root)!.addEventListener("click", async (e) => {
    const b = e.currentTarget as HTMLButtonElement; if (b.disabled) return;
    b.disabled = true; b.innerHTML = `${spinner} Publicando…`;
    await sleep(1100);
    let newId = Math.random().toString(36).slice(2, 9).toUpperCase();
    if (API.serverMode) {
      try {
        const r = await API.post("/api/listings", { event: draft.ev, type: extra[draft.ev!].tickets[draft.type]?.n, qty: selPages().length, price: draft.price, orig: draft.orig, zone: draft.zone, row: draft.row, seat: draft.seat, note: draft.note, nominative: draft.nominative,
          pages: draft.files.flatMap((f) => f.pages.filter((p) => p.ok && p.sel).map((p, i) => ({ file: f.name, page: i + 1, hash: `${f.hash}:${i}` }))) });
        newId = r.listing.id;
      } catch (er) { b.disabled = false; b.textContent = "Publicar anuncio"; toast((er as Error).message, "!"); return; }
    }
    const list = store.get<unknown[]>("selling", []);
    list.unshift({ id: newId, ev: draft.ev, type: extra[draft.ev!].tickets[draft.type]?.n ?? "Entrada", qty: selPages().length, price: draft.price, at: Date.now() });
    store.set("selling", list);
    resetDraft();
    confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.5, 200);
    toast("¡Anuncio publicado! Te avisamos cuando se venda", "🚀");
    location.hash = "#/mis-anuncios";
  }, { signal: sig });
}

/* ═════ Paso 1 · Sube todas las entradas (con verificación) ═════ */
export function renderTickets(): string {
  const ev = byId(draft.ev!)!, x = extra[ev.id];
  const files = draft.files;
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-28 md:pt-32">${stepper(0)}
    <h1 class="mt-12 text-[2.3rem] font-medium leading-tight tracking-tight sm:text-[3.4rem]" data-w-in>Sube todas las entradas</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-w-in>Sube el archivo entero y nosotros lo dividiremos por ti para que elijas qué entradas quieres vender.</p>
    <div class="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink/80" data-w-in><span class="card-art h-9 w-9 !rounded-md"><span class="art block h-full w-full" style="${artBg(ev.id)}"></span></span><b>${esc(nameOf(ev))}</b><span class="text-sub">· ${fechaLarga(ev.date)}</span></div>
    <label class="mt-5 block text-sm" data-w-in>Tipo de entrada<select id="w-type" class="mt-1.5 w-full rounded-xl border-0 bg-[#f6f6f7] px-5 py-4 text-base outline-none focus:ring-2 focus:ring-accent/40">${x.tickets.map((k, i) => `<option value="${i}" ${i === draft.type ? "selected" : ""}>${esc(k.n)} — ${esc(k.sub)}</option>`).join("")}</select></label>
    <div id="w-files" class="mt-6 space-y-6">${files.map(fileBlock).join("")}</div>
    <label id="w-drop" class="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-accent/70 bg-accent/[0.07] px-6 py-9 text-center transition" data-w-in tabindex="0">
      <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7 9l5-5 5 5M4 20h16"/></svg>
      <span class="mt-4 text-xl">Sube los archivos PDF</span><span class="mt-2 text-sm text-ink/90">Una vez subidos los archivos, podrás quitar páginas.</span><span class="mt-3 text-accent">Arrastra los archivos o pulsa aquí</span>
      <input id="w-input" type="file" class="sr-only" accept="application/pdf,image/png,image/jpeg" multiple /></label>
    <p class="mt-3 text-xs text-sub" data-w-in>Demostración: la verificación se simula en tu navegador y los archivos no se envían a ningún servidor.</p>
    ${actions("#/vender/anuncio", doneTix())}
    <hr class="mt-12 border-line" />
    <div class="mt-12 grid gap-4 md:grid-cols-2" data-w-in>
      <article class="infocard"><div class="grid w-32 shrink-0 place-items-center"><span class="grid h-[4.4rem] w-[4.4rem] place-items-center rounded-full bg-accent text-white shadow-[0_0_40px_6px_rgba(232,89,12,0.35)]"><svg viewBox="0 0 24 24" class="h-7 w-7" fill="currentColor"><path d="M7 8V7a5 5 0 0110 0v1h2a1 1 0 011 1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a1 1 0 011-1h2zm2 0h6V7a3 3 0 00-6 0v1z"/></svg></span></div><div><p class="text-lg">No compartimos tu entrada</p><p class="mt-2 text-sm leading-relaxed text-ink/70">Tu entrada únicamente se entregará cuando un usuario haya completado el pago.</p><a href="#/ayuda/seguridad" class="mt-2 inline-block text-sm text-accent">Saber más</a></div></article>
      <article class="infocard"><div class="relative w-32 shrink-0"><span class="absolute left-3 top-1 h-[5.4rem] w-[4.2rem] rounded-lg bg-[#f1f1f3] shadow-sm"></span><span class="absolute bottom-3 left-1 rounded bg-accent px-2 py-1 text-xs font-semibold text-white">PDF</span></div><div><p class="text-lg">Sube el PDF original</p><p class="mt-2 text-sm leading-relaxed text-ink/70">Sube el archivo original y más adelante podrás elegir qué entrada poner a la venta.</p><a href="#/ayuda/vender/formatos" class="mt-2 inline-block text-sm text-accent">Saber más</a></div></article></div>
    <h2 class="mt-14 text-[1.7rem] font-semibold" data-w-in>Preguntas frecuentes</h2>
    <div class="mt-3" data-w-in>${faqItem("¿Mi entrada será visible para otros usuarios?", "No, tu entrada solo será visible para ti. Cuando un usuario la compra, se le enviará a ese usuario para que pueda utilizarla directamente en el evento. Otros usuarios no tendrán acceso a tu entrada, y esta permanecerá almacenada de forma segura.", true)}${faqItem("No tengo un QR de mi entrada digital todavía", "Necesitas el archivo con el código QR para poder venderla. Descárgalo desde la web o app donde la compraste, o pídeselo al organizador. Si aún no lo tienes, vuelve cuando esté disponible.")}${faqItem("¿Qué pasa si no quiero vender todas las entradas de un archivo?", "No pasa nada: tras subir el archivo verás una fila por página y podrás elegir cuáles pones a la venta. Las demás no se publican ni se comparten.")}</div></section>`;
}
function fileBlock(f: VFile): string {
  return `<div class="vfile" data-fid="${f.id}"><div class="mb-3 flex items-center justify-between gap-4"><p class="min-w-0 truncate" data-w-in>${esc(f.name)}</p><button class="shrink-0 text-[#d92d20] hover:underline" data-del="${f.id}">Eliminar archivo</button></div>
    <div class="space-y-3">${f.pages.map((p) => pageRow(f, p)).join("")}</div></div>`;
}
function pageRow(f: VFile, p: VPage): string {
  return `<div class="vrow" data-fid="${f.id}" data-pn="${p.n}"><div class="flex shrink-0 flex-col items-center gap-1"><div class="vthumb">${f.kind === "img" && f.url ? `<img src="${f.url}" alt="" class="h-full w-full object-cover" />` : `<i></i><i></i><i></i><i class="w-1/2"></i>`}</div>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener" class="text-xs text-accent hover:underline">Ver PDF</a>` : ""}</div>
    <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><p class="text-[1.02rem]">Página ${p.n}</p><span class="vchip ${p.ok ? "ok" : "bad"}"><i></i>${p.ok ? "Válida" : "No válida"}</span></div>
      <p class="mt-2 text-lg ${p.ok ? "text-ink" : "text-ink/70"}">${esc(p.label)}</p>
      <button type="button" class="vreason mt-2 inline-flex items-center gap-2 text-sub hover:text-ink" data-reason><span class="grid h-5 w-5 place-items-center rounded-full ${p.ok ? "bg-emerald-600" : "bg-[#d92d20]"} text-[11px] font-bold text-white">${p.ok ? "✓" : "i"}</span>Ver razón</button>
      <p class="vreasontxt mt-2 hidden rounded-lg bg-white/80 px-3 py-2 text-sm text-ink/80">${esc(p.reason)}</p></div>
    ${p.ok ? `<label class="flex shrink-0 cursor-pointer items-center gap-2 self-center text-sm"><span class="text-sub">Vender</span><button type="button" role="switch" aria-checked="${p.sel}" class="switch" data-sel><i></i></button></label>` : ""}</div>`;
}

/* ── motor de verificación ── */
async function fingerprint(buf: ArrayBuffer) {
  const u = new Uint8Array(buf.slice(0, 65536)); let h = 2166136261 ^ buf.byteLength;
  for (let i = 0; i < u.length; i += 7) h = Math.imul(h ^ u[i], 16777619);
  return (h >>> 0).toString(16);
}
const NOT_TICKET = /invoice|factura|recibo|n[oó]mina|contrato|presupuesto|receipt|tax|curriculum|cv\b|dni|pasaporte/i;
export async function verifyFile(file: File): Promise<VFile> {
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 8));
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isPng = head[0] === 0x89 && head[1] === 0x50, isJpg = head[0] === 0xff && head[1] === 0xd8;
  const hash = await fingerprint(buf);
  const f: VFile = { id: Math.random().toString(36).slice(2, 8), name: file.name, size: file.size, kind: isPdf ? "pdf" : "img", hash, url: URL.createObjectURL(file), pages: [] };
  if (!isPdf && !isPng && !isJpg) { f.pages = [{ n: 1, ok: false, sel: false, label: "Formato no admitido", reason: "Solo aceptamos PDF o imágenes PNG/JPG. Descarga la entrada en uno de esos formatos y vuelve a subirla." }]; return f; }
  let n = 1;
  if (isPdf) { const txt = new TextDecoder("latin1").decode(new Uint8Array(buf)); n = Math.max(1, Math.min(10, (txt.match(/\/Type\s*\/Page(?![s\w])/g) || []).length)); }
  const dup = draft.files.find((o) => o.hash === hash);
  const nonTicket = NOT_TICKET.test(file.name);
  for (let i = 1; i <= n; i++) {
    if (dup) f.pages.push({ n: i, ok: false, sel: false, label: "Duplicada", reason: `Este archivo ya está subido ("${dup.name}"). No puedes publicar la misma entrada dos veces.` });
    else if (nonTicket) f.pages.push({ n: i, ok: false, sel: false, label: "No reconocido", reason: "El documento no parece una entrada: no hemos detectado un código QR o de barras ni los datos de un evento. Sube el PDF original de tu entrada." });
    else if (file.size < 1200) f.pages.push({ n: i, ok: false, sel: false, label: "Archivo demasiado pequeño", reason: "El archivo está casi vacío. Comprueba que has descargado la entrada completa." });
    else f.pages.push({ n: i, ok: true, sel: true, label: "Entrada reconocida", reason: "Hemos detectado un código QR legible y datos de acceso. La entrada se publicará sin mostrar el código a otros usuarios." });
  }
  return f;
}

export function initTickets(root: HTMLElement, sig: AbortSignal, rerender: () => void) {
  if (!reduced) {
    gsap.fromTo("[data-w-in]", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" });
    gsap.fromTo(".infocard", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: "power3.out", delay: 0.4 });
  }
  const drop = $("#w-drop", root)!, input = $<HTMLInputElement>("#w-input", root)!, next = $<HTMLButtonElement>("#w-next", root)!;
  $("#w-type", root)!.addEventListener("change", (e) => { draft.type = +(e.target as HTMLSelectElement).value; save(); }, { signal: sig });
  const refresh = () => { next.disabled = !doneTix(); };
  const handle = async (list: FileList | File[]) => {
    for (const file of [...list]) {
      const ph = document.createElement("div");
      ph.className = "vscan rounded-2xl bg-[#f6f6f7] p-5";
      ph.innerHTML = `<div class="flex items-center gap-4"><span class="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-accent/30 border-t-accent"></span><div class="min-w-0"><p class="truncate font-medium">${esc(file.name)}</p><p class="text-sm text-sub" data-step>Leyendo archivo…</p></div></div><div class="mt-4 h-1.5 overflow-hidden rounded bg-black/10"><i class="block h-full w-0 rounded bg-accent" data-bar></i></div>`;
      $("#w-files", root)!.appendChild(ph);
      const steps = ["Leyendo archivo…", "Dividiendo páginas…", "Buscando códigos QR…", "Comprobando duplicados…"];
      gsap.to($("[data-bar]", ph), { width: "92%", duration: 1.4, ease: "power1.inOut" });
      steps.forEach((s, i) => setTimeout(() => { const el = $("[data-step]", ph); if (el) el.textContent = s; }, i * 330));
      const [f] = await Promise.all([verifyFile(file), sleep(1500)]);
      ph.remove();
      draft.files.push(f); save();
      const wrap = document.createElement("div"); wrap.innerHTML = fileBlock(f);
      const el = wrap.firstElementChild as HTMLElement; $("#w-files", root)!.appendChild(el);
      if (!reduced) {
        gsap.fromTo(el.querySelectorAll(".vrow"), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.12, ease: "power3.out" });
        gsap.fromTo(el.querySelectorAll(".vchip"), { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.12, delay: 0.3, ease: "back.out(3)" });
      }
      refresh();
      const ok = f.pages.filter((p) => p.ok).length;
      toast(ok ? `${ok} entrada${ok > 1 ? "s" : ""} verificada${ok > 1 ? "s" : ""}` : "Ninguna página es válida", ok ? "✓" : "!");
    }
  };
  input.addEventListener("change", () => { if (input.files?.length) handle(input.files); input.value = ""; }, { signal: sig });
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } }, { signal: sig });
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); animate(drop, { scale: 1.015 }, SPRING); }, { signal: sig }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("over"); animate(drop, { scale: 1 }, SPRING); }, { signal: sig }));
  drop.addEventListener("drop", (e) => { const fl = (e as DragEvent).dataTransfer?.files; if (fl?.length) handle(fl); }, { signal: sig });
  $("#w-files", root)!.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const del = t.closest<HTMLElement>("[data-del]");
    if (del) { const f = draft.files.find((x) => x.id === del.dataset.del); if (f?.url) URL.revokeObjectURL(f.url); draft.files = draft.files.filter((x) => x.id !== del.dataset.del); save(); gsap.to(del.closest(".vfile"), { autoAlpha: 0, y: -10, duration: 0.3, onComplete: () => { del.closest(".vfile")!.remove(); refresh(); } }); return; }
    const r = t.closest<HTMLElement>("[data-reason]");
    if (r) { const txt = r.parentElement!.querySelector<HTMLElement>(".vreasontxt")!; const show = txt.classList.contains("hidden"); txt.classList.toggle("hidden", !show); if (show && !reduced) gsap.fromTo(txt, { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }); return; }
    const sw = t.closest<HTMLElement>("[data-sel]");
    if (sw) {
      const row = sw.closest<HTMLElement>(".vrow")!, f = draft.files.find((x) => x.id === row.dataset.fid)!, p = f.pages.find((x) => x.n === +row.dataset.pn!)!;
      p.sel = !p.sel; sw.setAttribute("aria-checked", String(p.sel)); save(); refresh();
    }
  }, { signal: sig });
  next.addEventListener("click", () => { if (!next.disabled) location.hash = "#/vender/precio"; }, { signal: sig });
  $$("details", root).forEach((d) => d.addEventListener("toggle", () => { const p = d.querySelector("p"); if (d.open && p && !reduced) gsap.fromTo(p, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35 }); }, { signal: sig }));
  void rerender; void fine; void hover; void stagger;
}

/* ═════ Paso 2 · Precio ═════ */
export function renderPrice(): string {
  const ev = byId(draft.ev!)!, tp = extra[ev.id].tickets[draft.type];
  const q = selPages().length;
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-28 md:pt-32">${stepper(1)}
    <h1 class="mt-12 text-[2.3rem] font-medium leading-tight tracking-tight sm:text-[3.4rem]" data-w-in>Fija el precio</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-w-in>Indica cuánto pagaste y a cuánto quieres vender cada entrada. Tienes ${q} entrada${q > 1 ? "s" : ""} de «${esc(tp?.n ?? "")}».</p>
    <form id="w-form" class="mt-9 space-y-7" novalidate data-w-in>
      ${lbl("w-orig", "Precio original de la entrada (€)", draft.orig ?? "", 'inputmode="decimal" min="1" step="0.5"', "number")}
      ${lbl("w-price", "Precio de venta por entrada (€)", draft.price ?? (tp?.from ?? ""), 'inputmode="decimal" min="1" step="0.5"', "number")}
      <p class="text-sm text-ink/70" id="w-limit">El precio de venta no puede superar el 130 % del original, según la normativa de reventa.</p>
      <div class="rounded-2xl bg-accent/10 p-6"><p class="text-sm text-accent">Cobrarías</p><p class="text-[2.6rem] font-semibold leading-none text-accent"><span id="w-earn">0</span> €</p><p class="mt-2 text-xs text-sub" id="w-calc"></p></div></form>
    ${actions("#/vender/entradas", !!draft.price && !!draft.orig)}
    <h2 class="mt-14 text-[1.7rem] font-semibold" data-w-in>Preguntas frecuentes</h2>
    <div class="mt-3" data-w-in>${faqItem("¿Por qué hay un límite de precio?", "La normativa y las condiciones de muchos eventos limitan el precio de reventa. Fijamos el máximo en el 130 % del precio original para que la venta sea legal y justa para el comprador.", true)}${faqItem("¿Qué comisión se aplica?", "Publicar es gratis. Solo cobramos un 10 % cuando se vende la entrada; ves el cálculo exacto antes de publicar.")}${faqItem("¿Puedo cambiar el precio más tarde?", "Sí, desde «Mis anuncios» mientras la entrada no se haya vendido.")}</div></section>`;
}
export function initPrice(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) gsap.fromTo("[data-w-in]", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" });
  const o = $<HTMLInputElement>("#w-orig", root)!, p = $<HTMLInputElement>("#w-price", root)!, next = $<HTMLButtonElement>("#w-next", root)!, earn = $("#w-earn", root)!, q = selPages().length, ob = { v: 0 };
  const calc = () => {
    const price = +p.value || 0, g = q * price, e = g - g * 0.1;
    $("#w-calc", root)!.textContent = `${q} × ${money(price)} = ${money(g)} − comisión 10 % (${money(g * 0.1)})`;
    gsap.to(ob, { v: e, duration: 0.45, ease: "power2.out", onUpdate: () => (earn.textContent = ob.v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) });
    next.disabled = !(+o.value > 0 && price > 0);
  };
  o.addEventListener("input", calc, { signal: sig }); p.addEventListener("input", calc, { signal: sig }); calc();
  const go = () => {
    const ov = +o.value, pv = +p.value;
    if (!err(o, ov > 0 ? "" : "Indica el precio original") || !err(p, pv > 0 ? (pv <= ov * 1.3 + 0.001 ? "" : `Máximo ${money(Math.floor(ov * 1.3 * 100) / 100)} (130 % del original)`) : "Indica el precio de venta")) return;
    draft.orig = ov; draft.price = pv; save(); location.hash = "#/vender/informacion";
  };
  next.addEventListener("click", go, { signal: sig });
  $("#w-form", root)!.addEventListener("submit", (e) => { e.preventDefault(); go(); }, { signal: sig });
}

/* ═════ Paso 3 · Información ═════ */
export function renderInfo(): string {
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-28 md:pt-32">${stepper(2)}
    <h1 class="mt-12 text-[2.3rem] font-medium leading-tight tracking-tight sm:text-[3.4rem]" data-w-in>Añade detalles</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-w-in>Es opcional, pero ayuda a vender antes: los compradores confían más cuando ven zona, fila y un comentario.</p>
    <form id="w-form" class="mt-9 space-y-7" novalidate data-w-in>
      ${lbl("w-zone", "Zona o sector (opcional)", draft.zone, 'autocomplete="off"')}
      <div class="grid gap-7 sm:grid-cols-2">${lbl("w-row", "Fila (opcional)", draft.row)}${lbl("w-seat", "Asiento (opcional)", draft.seat)}</div>
      <div><label for="w-note" class="mb-2 ml-1 block font-medium">Comentario para los compradores (opcional)</label><textarea id="w-note" rows="4" maxlength="160" class="w-full rounded-xl bg-[#f6f6f7] px-5 py-4 text-base outline-none focus:ring-2 focus:ring-accent/40" placeholder="Por ejemplo: «No podemos ir, disfrutad por nosotros»">${esc(draft.note)}</textarea><p class="mt-1 text-right text-xs text-sub"><span id="w-cnt">${draft.note.length}</span>/160</p></div>
      <label class="flex cursor-pointer items-start gap-3 rounded-xl bg-[#f6f6f7] p-4"><input id="w-nom" type="checkbox" class="mt-1 h-5 w-5 accent-[#e8590c]" ${draft.nominative ? "checked" : ""} /><span><b class="font-medium">Mi entrada es nominativa</b><span class="mt-0.5 block text-sm text-sub">Haré el cambio de nombre al comprador cuando se venda.</span></span></label></form>
    ${actions("#/vender/precio", true)}</section>`;
}
export function initInfo(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) gsap.fromTo("[data-w-in]", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" });
  const note = $<HTMLTextAreaElement>("#w-note", root)!;
  note.addEventListener("input", () => ($("#w-cnt", root)!.textContent = String(note.value.length)), { signal: sig });
  $("#w-next", root)!.addEventListener("click", () => {
    draft.zone = $<HTMLInputElement>("#w-zone", root)!.value.trim(); draft.row = $<HTMLInputElement>("#w-row", root)!.value.trim(); draft.seat = $<HTMLInputElement>("#w-seat", root)!.value.trim();
    draft.note = note.value.trim(); draft.nominative = $<HTMLInputElement>("#w-nom", root)!.checked; save(); location.hash = "#/vender/pago";
  }, { signal: sig });
}

/* ═════ Paso 4 · Información de pago ═════ */
export function renderPay(): string {
  const pay = draft.pay ?? store.get<{ holder: string; last4: string } | null>("pay", null);
  return `<section class="mx-auto max-w-[56rem] px-6 pb-24 pt-28 md:pt-32">${stepper(3)}
    <h1 class="mt-12 text-[2.3rem] font-medium leading-tight tracking-tight sm:text-[3.4rem]" data-w-in>Información de pago</h1>
    <p class="mt-4 text-lg text-ink/80 sm:text-xl" data-w-in>Indica la cuenta donde quieres recibir el dinero. Cobrarás después del evento.</p>
    <form id="w-form" class="mt-9 space-y-7" novalidate data-w-in>
      ${lbl("w-holder", "Nombre y apellidos del titular", pay?.holder ?? "", 'autocomplete="off"')}
      ${lbl("w-iban", "IBAN", pay ? `•••• •••• •••• •••• ${pay.last4}` : "", 'autocomplete="off" placeholder="ES00 0000 0000 0000 0000 0000"')}
      <p class="-mt-3 text-ink/90">Estos datos solo serán visibles para ti, y serán encriptados de forma segura.</p>
      <p class="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Demostración: no introduzcas datos bancarios reales. Solo se guardan el titular y los 4 últimos dígitos en este navegador.</p></form>
    ${actions("#/vender/informacion", true, "Guardar y revisar")}</section>`;
}
export function initPay(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) gsap.fromTo("[data-w-in]", { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" });
  const iban = $<HTMLInputElement>("#w-iban", root)!;
  iban.addEventListener("input", () => { if (!iban.value.includes("•")) iban.value = iban.value.replace(/[^\dA-Za-z]/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim(); }, { signal: sig });
  iban.addEventListener("focus", () => { if (iban.value.includes("•")) iban.value = ""; }, { signal: sig });
  const go = async () => {
    const h = $<HTMLInputElement>("#w-holder", root)!, raw = iban.value.replace(/\s/g, "").toUpperCase(), masked = iban.value.includes("•");
    if (![err(h, h.value.trim().length >= 3 ? "" : "Nombre y apellidos del titular"), err(iban, masked || /^ES\d{22}$/.test(raw) ? "" : "IBAN no válido (ES + 22 dígitos)")].every(Boolean)) return;
    const prev = draft.pay ?? store.get<{ holder: string; last4: string } | null>("pay", null);
    if (API.serverMode && !masked) { try { await API.put("/api/me/payout", { holder: h.value.trim(), iban: raw }); } catch (er) { err(iban, (er as Error).message); return; } }
    draft.pay = { holder: h.value.trim(), last4: masked ? prev?.last4 ?? "0000" : raw.slice(-4) }; store.set("pay", draft.pay); save();
    location.hash = "#/vender/anuncio";
  };
  $("#w-next", root)!.addEventListener("click", go, { signal: sig });
  $("#w-form", root)!.addEventListener("submit", (e) => { e.preventDefault(); go(); }, { signal: sig });
}
void getUser; void events; void countTo; void emailOk;
