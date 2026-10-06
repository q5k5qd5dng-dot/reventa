import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { animate, hover, press, inView, stagger, spring } from "motion";
import { $, $$, store, getUser, toast, paintQR, shake, eur, reduced, fine, type User } from "./util";
import { confetti } from "./confetti";
import { events, byId, poster, fechaLarga, type Ev } from "../data/events";

gsap.registerPlugin(ScrollTrigger, SplitText, InertiaPlugin);

const SPRING = { type: spring, stiffness: 320, damping: 28 } as const;
const FEE = 0.08;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ═══════════════ Cabecera ═══════════════ */
function header() {
  const h = $("#hdr")!;
  let last = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    h.classList.toggle("solid", y > 60);
    h.classList.toggle("hide", y > last + 4 && y > 500);
    if (y < last - 4) h.classList.remove("hide");
    last = y;
  }, { passive: true });
  h.classList.toggle("solid", scrollY > 60);
}

/* ═══════════════ Intro del hero ═══════════════ */
function intro() {
  const title = $("#hero-title")!;
  if (reduced) return;
  const split = SplitText.create(title, { type: "lines", mask: "lines" });
  const seats = $$(".seat-g");
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.fromTo("#hdr > div", { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0)
    .from(split.lines, { yPercent: 115, duration: 1.2, stagger: 0.12 }, 0.15)
    .fromTo("#hero-sub", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0.55)
    .fromTo("#search", { y: 36, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1 }, 0.7)
    .fromTo(seats, { y: 110, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out",
      delay: (_, el: Element) => 0.85 + Number((el as HTMLElement).dataset.row) * 0.13 + Math.random() * 0.12,
    }, 0);
  tl.add(() => tooltip(true), 2.3);

  // luz de la butaca morada
  const purple = $(".seat-purple");
  if (purple) gsap.to(purple, { filter: "drop-shadow(0 0 16px rgba(124,92,255,0.95))", duration: 1.3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 2 });

  // parallax suave
  $$("[data-blob]").forEach((b, i) => gsap.to(b, { yPercent: 50, xPercent: i ? -18 : 18, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } }));
  gsap.to("#seats-wrap svg", { yPercent: 7, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("#hero-title, #hero-sub", { y: -30, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: "#hero", start: "30% top", end: "bottom top", scrub: true } });
}

function tooltip(animateIn = false) {
  const tip = $("#seat-tip"), seat = $(".seat-purple"), wrap = $("#seats-wrap");
  if (!tip || !seat || !wrap || getComputedStyle(tip).display === "none") return;
  const r = seat.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  tip.style.left = `${r.left - w.left + r.width / 2}px`;
  tip.style.top = `${r.top - w.top - tip.offsetHeight - 12}px`;
  tip.style.transform = "translateX(-50%)";
  if (animateIn && !reduced) animate(tip, { opacity: [0, 1], y: [14, 0], scale: [0.85, 1] }, SPRING);
}

/* ═══════════════ Buscador ═══════════════ */
function search() {
  const q = $<HTMLInputElement>("#q")!, list = $("#results")!, box = $("#search-box")!;
  const close = () => list.classList.add("hidden");
  const render = () => {
    const t = q.value.trim().toLowerCase();
    if (t.length < 1) return close();
    const m = events.filter((e) => `${e.t} ${e.a} ${e.v} ${e.c} ${e.cat}`.toLowerCase().includes(t)).slice(0, 5);
    list.classList.remove("hidden");
    list.innerHTML = m.length
      ? m.map((e) => `<li><button type="button" data-open="${e.id}" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-soft focus:bg-soft focus:outline-none"><span class="card-art h-12 w-12 shrink-0 !rounded-lg">${poster(e, 500)}</span><span class="min-w-0 flex-1"><b class="block truncate text-sm font-medium">${e.a} - ${e.t}</b><span class="block truncate text-xs text-sub">${fechaLarga(e.date)} · ${e.c}</span></span><span class="text-sm font-semibold text-violet">${e.p} €</span></button></li>`).join("")
      : `<li class="px-4 py-5 text-center text-sm text-sub">No hay eventos para «${q.value.replace(/[<>&]/g, "")}». Prueba con otra ciudad o artista.</li>`;
    if (!reduced) animate(list.children as unknown as Element[], { opacity: [0, 1], y: [8, 0] }, { delay: stagger(0.04), ...SPRING });
  };
  q.addEventListener("input", render);
  q.addEventListener("focus", () => { gsap.to(box, { boxShadow: "0 22px 60px -16px rgba(20,40,140,0.6)", duration: 0.35 }); if (q.value) render(); });
  q.addEventListener("blur", () => gsap.to(box, { boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.35 }));
  q.addEventListener("keydown", (e) => {
    const items = $$<HTMLButtonElement>("button", list);
    if (e.key === "ArrowDown" && items[0]) { e.preventDefault(); items[0].focus(); }
    if (e.key === "Enter") { e.preventDefault(); items[0] ? items[0].click() : q.value && toast("Prueba con otra búsqueda", "?"); }
    if (e.key === "Escape") close();
  });
  list.addEventListener("keydown", (e) => {
    const items = $$<HTMLButtonElement>("button", list), i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(i <= 0 ? q.focus() : items[i - 1].focus()); }
    if (e.key === "Escape") { close(); q.focus(); }
  });
  document.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest("#search")) close(); else if ((e.target as HTMLElement).closest("[data-open]")) close(); });
}

/* ═══════════════ Carruseles (arrastre + inercia + flechas) ═══════════════ */
function carousels() {
  const skews: { el: HTMLElement; last: number; v: number }[] = [];
  $$(".car").forEach((el) => {
    const btns = $$<HTMLButtonElement>(`[data-car="${el.id}"]`);
    const prev = btns.find((b) => b.dataset.dir === "-1")!, next = btns.find((b) => b.dataset.dir === "1")!;
    const upd = () => {
      const max = el.scrollWidth - el.clientWidth - 2;
      if (prev) prev.disabled = el.scrollLeft <= 2;
      if (next) next.disabled = el.scrollLeft >= max;
    };
    el.addEventListener("scroll", upd, { passive: true });
    new ResizeObserver(upd).observe(el);
    upd();
    btns.forEach((b) => b.addEventListener("click", () => {
      const card = el.firstElementChild as HTMLElement;
      const step = (card.offsetWidth + 24) * Math.max(1, Math.floor(el.clientWidth / (card.offsetWidth + 24)) - 1 || 1);
      gsap.to(el, { scrollLeft: el.scrollLeft + Number(b.dataset.dir) * step, duration: 0.9, ease: "power3.out", overwrite: true });
    }));

    if (fine) {
      // arrastre con el ratón + inercia (GSAP InertiaPlugin)
      let dragged = false, down = false, sx = 0, sl = 0;
      el.classList.add("grab");
      el.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; dragged = false; sx = e.clientX; sl = el.scrollLeft;
        gsap.killTweensOf(el);
        InertiaPlugin.track(el, "scrollLeft");
      });
      addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 5) { dragged = true; el.style.userSelect = "none"; }
        if (dragged) el.scrollLeft = sl - dx;
      });
      addEventListener("pointerup", () => {
        if (!down) return;
        down = false;
        el.style.userSelect = "";
        if (dragged) gsap.to(el, { inertia: { scrollLeft: { velocity: "auto", min: 0, max: el.scrollWidth - el.clientWidth, resistance: 350 } }, ease: "power3.out" });
        setTimeout(() => (dragged = false), 40);
      });
      el.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } }, true);
      el.addEventListener("dragstart", (e) => e.preventDefault());
    }
    skews.push({ el, last: el.scrollLeft, v: 0 });
  });

  // las tarjetas se inclinan con la velocidad del scroll
  if (!reduced) {
    const set = skews.map((s) => ({ s, q: $$("[data-card]", s.el).map((c) => gsap.quickTo(c, "skewX", { duration: 0.4, ease: "power3" })) }));
    gsap.ticker.add(() => {
      for (const { s, q } of set) {
        const d = s.el.scrollLeft - s.last;
        s.last = s.el.scrollLeft;
        s.v += (gsap.utils.clamp(-5, 5, -d * 0.12) - s.v) * 0.25;
        q.forEach((fn) => fn(s.v));
      }
    });
  }
}

/* ═══════════════ Tarjetas: hover/press (Motion) y parallax ═══════════════ */
function cards() {
  if (fine && !reduced) {
    hover("[data-card] button:not([data-tiltcard])", (el) => {
      const art = el.querySelector<HTMLElement>(".art");
      if (art) animate(art, { scale: 1.07 }, { type: spring, stiffness: 180, damping: 18 });
      return () => art && animate(art, { scale: 1 }, { type: spring, stiffness: 180, damping: 22 });
    });
    $$<HTMLElement>("[data-tiltcard]").forEach((b) => {
      const art = b.querySelector<HTMLElement>(".art")!;
      const x = gsap.quickTo(art, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(art, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x(((e.clientX - r.left) / r.width - 0.5) * -26); y(((e.clientY - r.top) / r.height - 0.5) * -26); });
      b.addEventListener("pointerenter", () => gsap.to(art, { scale: 1.06, duration: 0.7, ease: "power3.out" }));
      b.addEventListener("pointerleave", () => { x(0); y(0); gsap.to(art, { scale: 1, duration: 0.7, ease: "power3.out" }); });
    });
  }
  press("[data-card] button", (el) => {
    animate(el, { scale: 0.975 }, { duration: 0.12 });
    return () => animate(el, { scale: 1 }, SPRING);
  });
}

/* ═══════════════ Revelados al hacer scroll ═══════════════ */
function reveals() {
  if (reduced) return;
  $$("[data-reveal]").forEach((el) => gsap.fromTo(el, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));
  $$(".car").forEach((c) => {
    ScrollTrigger.batch($$("[data-card]", c), { start: "top 94%", once: true, onEnter: (els) => gsap.fromTo(els, { y: 60, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", overwrite: true }) });
  });
  gsap.fromTo("#cta", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: "#cta", start: "top 88%", once: true } });
  gsap.fromTo("#cta .phone", { y: 120 }, { y: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: "#cta", start: "top 80%", once: true } });
  ScrollTrigger.batch(".rev", { start: "top 90%", once: true, onEnter: (els) => gsap.fromTo(els, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", overwrite: true }) });
  // cabecera de las opiniones: dots en móvil
  const rev = $("#rev")!, dots = $$("#dots i");
  rev.addEventListener("scroll", () => {
    const i = Math.round(rev.scrollLeft / ((rev.firstElementChild as HTMLElement).offsetWidth + 20));
    dots.forEach((d, k) => { d.style.width = k === i ? "1.75rem" : "0.5rem"; d.style.background = k === i ? "#6d4af5" : ""; });
  }, { passive: true });
}

/* ═══════════════ Ilustraciones de «¿Por qué?» (GSAP) ═══════════════ */
function why() {
  const cards = $$(".why");
  if (!reduced) {
    cards.forEach((c, i) => {
      inView(c, () => { animate(c, { opacity: [0, 1], y: [50, 0] }, { delay: i * 0.1, ...SPRING }); }, { amount: 0.25 });
    });
  }
  if (fine && !reduced) hover(".why", (el) => { animate(el, { y: -8 }, SPRING); return () => animate(el, { y: 0 }, SPRING); });

  // 1 · candado
  const lock = $('[data-why="lock"]')!;
  const rings = $$(".ring-c", lock), sheets = $$(".sheet-g", lock), shackle = $("#shackle")!;
  const lockTl = () => {
    gsap.set([rings, "#lock-orb"], { svgOrigin: "160 120" });
    gsap.set("#lock-g", { svgOrigin: "160 122" });
    const tl = gsap.timeline();
    tl.from(rings, { scale: 0.5, autoAlpha: 0, duration: 1.1, stagger: 0.14, ease: "power3.out" }, 0)
      .from("#lock-orb", { scale: 0, duration: 0.8, ease: "back.out(1.8)" }, 0.25)
      .from("#lock-g", { scale: 0, duration: 0.8, ease: "back.out(2.2)" }, 0.4)
      .from(sheets[0], { x: "-=70", y: "+=30", rotation: "-=25", autoAlpha: 0, duration: 1, ease: "back.out(1.4)" }, 0.5)
      .from(sheets[1], { x: "+=70", y: "-=30", rotation: "+=25", autoAlpha: 0, duration: 1, ease: "back.out(1.4)" }, 0.6);
    tl.add(() => {
      rings.forEach((r, i) => gsap.to(r, { scale: 1.045, duration: 2.2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 }));
      sheets.forEach((s, i) => gsap.to(s, { y: i ? "-=9" : "+=9", duration: 2.6 + i * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 }));
      const k = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
      k.to(shackle, { y: -7, duration: 0.3, ease: "power2.out" }).to(shackle, { y: 0, duration: 0.55, ease: "bounce.out" }, "+=0.6");
    });
  };
  // 2 · PDF cae en la bandeja
  const pdfTl = () => {
    const file = "#pdf-file";
    gsap.timeline()
      .fromTo(file, { y: -190, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.3, ease: "bounce.out" })
      .add(() => {
        gsap.timeline({ repeat: -1, repeatDelay: 1.6 }).to(file, { y: -28, duration: 0.55, ease: "power2.out", delay: 1.2 }).to(file, { y: 0, duration: 1, ease: "bounce.out" });
      });
  };
  // 3 · recibo impreso + importe
  const payTl = () => {
    const amt = $("#amt")!, o = { v: 0 };
    const play = () => {
      amt.textContent = "+ 0,00 €";
      gsap.timeline()
        .fromTo("#receipt", { y: 190 }, { y: 0, duration: 1.2, ease: "power3.out" })
        .to(o, { v: 120, duration: 1.2, ease: "power2.out", onUpdate: () => (amt.textContent = `+ ${o.v.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`) }, 0.5)
        .fromTo("#paid", { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.4)" }, 1.4);
    };
    play();
    gsap.timeline({ repeat: -1, repeatDelay: 4.8, delay: 6 }).add(() => { o.v = 0; gsap.set("#paid", { scale: 0 }); play(); });
  };
  if (reduced) return;
  const trig = (sel: string, fn: () => void) => ScrollTrigger.create({ trigger: sel, start: "top 78%", once: true, onEnter: fn });
  // estado inicial oculto para evitar parpadeo
  gsap.set("#receipt", { y: 190 }); gsap.set("#paid", { scale: 0 }); gsap.set("#pdf-file", { autoAlpha: 0 });
  trig('[data-why="lock"]', lockTl); trig('[data-why="pdf"]', pdfTl); trig('[data-why="pay"]', payTl);
  // guiño al pasar el ratón por el candado
  if (fine) $('[data-why="lock"]')!.addEventListener("pointerenter", () => gsap.fromTo("#lock-g", { rotation: -8 }, { rotation: 0, duration: 0.9, ease: "elastic.out(1,0.35)" }));
}

/* ═══════════════ Móvil: reloj y notificaciones (Motion) ═══════════════ */
function phone() {
  const time = $("#lock-time")!, date = $("#lock-date")!, n = $("#notif")!, nt = $("#n-t")!, nb = $("#n-b")!;
  const tick = () => {
    const d = new Date();
    time.textContent = d.toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit" });
    date.textContent = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };
  tick();
  setInterval(tick, 20000);
  const msgs = [
    ["¡Una nueva entrada para Karol Vega! 🎟️", "Alguien está vendiendo su entrada por 120€, consíguela antes de que se agote."],
    ["¡Quedan 6 entradas para Copa de Europa!", "Un vendedor acaba de bajar el precio a 98€. No la dejes escapar."],
    ["Tu entrada está lista ✅", "Ya puedes ver tu QR para Noche Techno en la app."],
    ["Has vendido tus entradas 💸", "Recibirás 108€ automáticamente tras el evento."],
  ];
  if (reduced) return;
  let on = false, i = 0;
  const loop = async () => {
    while (on) {
      [nt.textContent, nb.textContent] = msgs[i++ % msgs.length];
      await animate(n, { opacity: [0, 1], y: [-34, 0], scale: [0.92, 1] }, { type: spring, stiffness: 280, damping: 20 }).finished;
      await sleep(4300);
      if (!on) break;
      await animate(n, { opacity: 0, y: -22, scale: 0.97 }, { duration: 0.4 }).finished;
      await sleep(500);
    }
  };
  n.style.opacity = "0";
  inView("#cta", () => { on = true; loop(); return () => { on = false; }; }, { amount: 0.4 });
}

/* ═══════════════ Cookies ═══════════════ */
function cookies() {
  const box = $("#cookies")!;
  if (store.get<string | null>("consent", null)) return;
  const done = async (v: string) => {
    store.set("consent", v);
    await animate(box, { opacity: 0, y: 30, scale: 0.97 }, { duration: 0.35 }).finished;
    box.style.display = "none";
    toast(v === "all" ? "Cookies aceptadas" : "Solo cookies necesarias", "🍪");
  };
  $("#ck-all")!.addEventListener("click", () => done("all"));
  $("#ck-min")!.addEventListener("click", () => done("min"));
  setTimeout(() => {
    box.style.display = "block";
    box.classList.remove("hidden");
    animate(box, { opacity: [0, 1], y: [60, 0], scale: [0.96, 1] }, SPRING);
  }, reduced ? 100 : 1400);
}

/* ═══════════════ Hojas modales ═══════════════ */
const ov = () => $("#ov")!, sheet = () => $("#sheet")!;
let lastFocus: HTMLElement | null = null;
let onClose: (() => void) | null = null;

function openSheet(html: string, mount?: (s: HTMLElement) => void) {
  const o = ov(), s = sheet();
  const wasOpen = o.classList.contains("open");
  lastFocus = wasOpen ? lastFocus : (document.activeElement as HTMLElement);
  s.innerHTML = html;
  o.classList.add("open");
  o.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (!wasOpen) {
    gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    animate(s, innerWidth < 640 ? { y: ["100%", "0%"] } : { opacity: [0, 1], y: [50, 0], scale: [0.95, 1] }, { type: spring, stiffness: 300, damping: 32 });
  } else if (!reduced) animate(s, { opacity: [0.4, 1], y: [14, 0] }, SPRING);
  s.scrollTop = 0;
  mount?.(s);
  s.focus({ preventScroll: true });
}
async function closeSheet() {
  const o = ov(), s = sheet();
  if (!o.classList.contains("open")) return;
  gsap.to(o, { opacity: 0, duration: 0.25 });
  await animate(s, innerWidth < 640 ? { y: "100%" } : { opacity: 0, y: 30, scale: 0.97 }, { duration: 0.28 }).finished;
  o.classList.remove("open");
  o.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  s.innerHTML = "";
  s.style.cssText = "";
  gsap.set(o, { clearProps: "opacity" });
  onClose?.(); onClose = null;
  lastFocus?.focus?.({ preventScroll: true });
}
const closeBtn = `<button type="button" data-close class="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition hover:bg-white" aria-label="Cerrar"><svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
const spinner = `<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>`;

function modalEvents() {
  const o = ov();
  o.addEventListener("click", (e) => { if (e.target === o || (e.target as HTMLElement).closest("[data-close]")) closeSheet(); });
  addEventListener("keydown", (e) => {
    if (!o.classList.contains("open")) return;
    if (e.key === "Escape") closeSheet();
    if (e.key === "Tab") {
      const f = $$<HTMLElement>("button, input, select, a[href], [tabindex]:not([tabindex='-1'])", sheet()).filter((x) => !x.hasAttribute("disabled") && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ── helpers de formulario ── */
function field(id: string, label: string, type = "text", extra = "") {
  return `<div class="fld"><input id="${id}" type="${type}" placeholder=" " ${extra} /><label for="${id}">${label}</label><p class="msg" aria-live="polite"></p></div>`;
}
function err(input: HTMLInputElement, msg: string) {
  const f = input.closest(".fld") as HTMLElement;
  f.classList.toggle("err", !!msg);
  (f.querySelector(".msg") as HTMLElement).textContent = msg;
  if (msg) shake(f);
  return !msg;
}

/* ── Evento ── */
function openEvent(id: string, qty = 2) {
  const ev = byId(id);
  if (!ev) return;
  let q = Math.min(6, Math.max(1, qty));
  const html = `<div class="relative">${closeBtn}
    <div class="card-art h-52 !rounded-none sm:!rounded-t-[1.75rem]">${poster(ev, 300)}</div>
    <div class="p-6 sm:p-8">
      <p class="text-sm text-violet">${fechaLarga(ev.date)}</p>
      <h3 class="mt-1 text-2xl font-semibold leading-tight">${ev.a} - ${ev.t}</h3>
      <p class="mt-1 text-sub">${ev.v}, ${ev.c}</p>
      <p class="mt-4 text-[0.95rem] font-light leading-relaxed text-ink/75">${ev.desc}</p>
      <p class="mt-4 inline-flex items-center gap-2 rounded-full bg-violet/10 px-3.5 py-1.5 text-sm font-medium text-violet">${ev.left < 30 ? `🔥 Quedan ${ev.left} entradas` : `✓ ${ev.left} entradas disponibles`}</p>
      <div class="mt-6 flex items-center justify-between rounded-2xl bg-soft p-3">
        <div><p class="text-sm text-sub">Entradas</p><p class="font-semibold">${eur(ev.p)} <span class="text-sm font-normal text-sub">c/u</span></p></div>
        <div class="flex items-center gap-3"><button type="button" data-q="-1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-violet hover:text-white" aria-label="Menos">−</button><span id="e-q" class="w-6 text-center text-xl font-semibold tabular-nums">${q}</span><button type="button" data-q="1" class="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm transition hover:bg-violet hover:text-white" aria-label="Más">+</button></div>
      </div>
      <div class="mt-5 space-y-1.5 text-sm text-sub"><div class="flex justify-between"><span>Entradas</span><span id="e-base"></span></div><div class="flex justify-between"><span>Gastos de gestión</span><span id="e-fee"></span></div></div>
      <div class="mt-3 flex items-end justify-between border-t border-line pt-4"><span class="font-medium">Total</span><span class="text-3xl font-semibold"><span id="e-total">0</span> €</span></div>
      <button id="e-buy" class="btn btn-violet mt-5 w-full !py-4">Comprar entradas</button>
      <p class="mt-3 text-center text-xs text-sub">🔒 Pago protegido hasta que entras · Demostración, no se realiza ningún cobro</p>
    </div></div>`;
  openSheet(html, (s) => {
    const total = $("#e-total", s)!, shown = { v: 0 };
    const calc = () => {
      const b = q * ev.p, f = Math.round(b * FEE), t = b + f;
      $("#e-q", s)!.textContent = String(q); $("#e-base", s)!.textContent = eur(b); $("#e-fee", s)!.textContent = eur(f);
      gsap.to(shown, { v: t, duration: 0.5, ease: "power2.out", onUpdate: () => (total.textContent = Math.round(shown.v).toString()) });
    };
    calc();
    $$("[data-q]", s).forEach((b) => b.addEventListener("click", () => {
      const n = q + Number(b.dataset.q);
      if (n < 1 || n > 6) { toast(n < 1 ? "Mínimo 1 entrada" : "Máximo 6 entradas por compra", "!"); return; }
      q = n; calc();
      gsap.fromTo($("#e-q", s)!, { y: b.dataset.q === "1" ? 10 : -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25 });
    }));
    $("#e-buy", s)!.addEventListener("click", async (e) => {
      if (!getUser()) { toast("Inicia sesión para comprar", "i"); openLogin("login", () => openEvent(id, q)); return; }
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true; btn.innerHTML = `${spinner} Procesando…`;
      await sleep(1300);
      const base = q * ev.p, tickets = store.get<unknown[]>("tickets", []);
      const code = `HT-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      tickets.unshift({ ev: ev.id, qty: q, total: base + Math.round(base * FEE), code, at: Date.now() });
      store.set("tickets", tickets);
      success(ev, q, code);
    });
  });
}
function success(ev: Ev, q: number, code: string) {
  openSheet(`<div class="relative px-6 pb-8 pt-12 text-center sm:px-8">${closeBtn}
    <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white"><svg viewBox="0 0 24 24" class="h-10 w-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path id="ok" d="M5 12l5 5 9-10"/></svg></div>
    <h3 class="mt-5 text-3xl font-semibold">¡Listo!</h3><p class="mt-2 text-sub">Tus ${q} entrada${q > 1 ? "s" : ""} para <b class="text-ink">${ev.t}</b> ya están en tu cuenta.</p>
    <div id="tk" class="mx-auto mt-6 flex max-w-xs items-center gap-4 rounded-2xl bg-soft p-4 text-left"><div class="qr w-20 shrink-0 rounded-lg bg-white p-1.5 shadow-sm" data-code></div><div class="min-w-0"><p class="text-xs text-violet">${fechaLarga(ev.date)}</p><p class="truncate font-medium">${ev.t}</p><p class="text-sm text-sub">${code} · ${q}×</p></div></div>
    <div class="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" id="s-mine" class="btn btn-violet flex-1">Ver mis entradas</button><button type="button" data-close class="btn flex-1 border border-line">Seguir explorando</button></div></div>`, (s) => {
    paintQR($("[data-code]", s)!, code);
    const p = $<SVGPathElement>("#ok", s)!, l = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", delay: 0.25 });
    gsap.fromTo("#tk", { y: 30, autoAlpha: 0, rotationX: -40 }, { y: 0, autoAlpha: 1, rotationX: 0, duration: 0.9, ease: "back.out(1.4)", delay: 0.5, transformPerspective: 600 });
    $("#s-mine", s)!.addEventListener("click", openTickets);
    confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.4);
  });
}

/* ── Acceso ── */
function openLogin(mode: "login" | "register" = "login", after?: () => void) {
  const html = `<div class="relative p-6 pt-8 sm:p-8">${closeBtn}
    <p class="logo-word text-4xl text-violet">handticket</p>
    <div class="relative mt-6 grid grid-cols-2 rounded-xl bg-soft p-1 text-sm font-medium" role="tablist"><i id="pill" class="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm"></i>
      <button type="button" role="tab" data-m="login" class="relative z-10 rounded-lg py-2.5">Iniciar sesión</button><button type="button" role="tab" data-m="register" class="relative z-10 rounded-lg py-2.5">Crear cuenta</button></div>
    <form id="lf" class="mt-6 space-y-3" novalidate>
      <h3 id="l-title" class="text-2xl font-semibold"></h3>
      <div id="l-name" class="hidden">${field("l-n", "Nombre", "text", 'autocomplete="name"')}</div>
      ${field("l-e", "Email", "email", 'autocomplete="email"')}
      ${field("l-p", "Contraseña", "password", 'autocomplete="current-password"')}
      <button class="btn btn-violet w-full !py-4" id="l-go"></button>
      <div class="flex items-center gap-3 py-1 text-xs text-sub"><i class="h-px flex-1 bg-line"></i>o<i class="h-px flex-1 bg-line"></i></div>
      <button type="button" data-social class="btn w-full border border-line">Continuar con Google</button>
      <p class="pt-1 text-center text-xs text-sub">Demostración: tus datos se guardan solo en este navegador.</p>
    </form></div>`;
  openSheet(html, (s) => {
    let m = mode;
    const title = $("#l-title", s)!, go = $("#l-go", s)!, nameBox = $("#l-name", s)!, pill = $("#pill", s)!;
    const set = (next: "login" | "register", first = false) => {
      m = next;
      $$("[data-m]", s).forEach((b) => b.classList.toggle("text-violet", b.dataset.m === m));
      animate(pill, { x: m === "register" ? "100%" : "0%" }, first ? { duration: 0 } : { type: spring, stiffness: 320, damping: 28 });
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
      store.set("user", { name, email: em.value } satisfies User);
      renderUser();
      toast(`¡Hola, ${name.split(" ")[0]}!`, "👋");
      await closeSheet();
      after?.();
    });
    setTimeout(() => $<HTMLInputElement>(m === "register" ? "#l-n" : "#l-e", s)?.focus(), 350);
  });
}

/* ── Vender ── */
function openSell() {
  const html = `<div class="relative p-6 pt-8 sm:p-8">${closeBtn}
    <h3 class="text-2xl font-semibold">Vender entrada</h3><p class="mt-1 text-sub">Publica gratis. Cobras automáticamente tras el evento.</p>
    <form id="sf" class="mt-6 space-y-4" novalidate>
      <label class="block text-sm text-sub">Evento<select id="s-ev" class="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3.5 text-ink outline-none focus:border-violet">${events.map((e) => `<option value="${e.id}">${e.a} - ${e.t} · ${e.c}</option>`).join("")}</select></label>
      <div class="grid grid-cols-2 gap-3"><div class="flex items-center justify-between rounded-xl bg-soft p-2"><button type="button" data-q="-1" class="grid h-10 w-10 place-items-center rounded-lg bg-white text-xl shadow-sm" aria-label="Menos">−</button><span id="s-q" class="text-xl font-semibold tabular-nums">2</span><button type="button" data-q="1" class="grid h-10 w-10 place-items-center rounded-lg bg-white text-xl shadow-sm" aria-label="Más">+</button></div>
        ${field("s-p", "€ por entrada", "number", 'min="1" max="999" value="60"')}</div>
      <div class="rounded-2xl bg-violet/10 p-5"><p class="text-sm text-violet">Cobrarías</p><p class="text-4xl font-semibold text-violet"><span id="s-earn">0</span> €</p><p class="mt-1 text-xs text-sub">Venta bruta <span id="s-gross"></span> · comisión 10 %</p></div>
      <button class="btn btn-violet w-full !py-4" id="s-go">Publicar entradas</button></form></div>`;
  openSheet(html, (s) => {
    let q = 2;
    const sel = $<HTMLSelectElement>("#s-ev", s)!, price = $<HTMLInputElement>("#s-p", s)!, earn = $("#s-earn", s)!, o = { v: 0 };
    const calc = () => {
      const g = q * (+price.value || 0), e = g - Math.round(g * 0.1);
      $("#s-q", s)!.textContent = String(q); $("#s-gross", s)!.textContent = eur(g);
      gsap.to(o, { v: e, duration: 0.45, ease: "power2.out", onUpdate: () => (earn.textContent = Math.round(o.v).toString()) });
    };
    price.value = String(byId(sel.value)!.p);
    sel.addEventListener("change", () => { price.value = String(byId(sel.value)!.p); calc(); });
    price.addEventListener("input", calc);
    $$("[data-q]", s).forEach((b) => b.addEventListener("click", () => { q = Math.max(1, Math.min(10, q + Number(b.dataset.q))); calc(); }));
    calc();
    $("#sf", s)!.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!(+price.value > 0)) { err(price, "Indica un precio"); return; }
      if (!getUser()) { toast("Inicia sesión para publicar", "i"); openLogin("login", openSell); return; }
      const b = $("#s-go", s) as HTMLButtonElement; b.disabled = true; b.innerHTML = `${spinner} Publicando…`;
      await sleep(1000);
      const list = store.get<unknown[]>("selling", []); list.unshift({ ev: sel.value, qty: q, price: +price.value }); store.set("selling", list);
      await closeSheet();
      confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.5, 180);
      toast("¡Entradas publicadas! Te avisamos cuando se vendan", "🚀");
    });
  });
}

/* ── Mis entradas / cuenta ── */
function openTickets() {
  const list = store.get<{ ev: string; qty: number; total: number; code: string }[]>("tickets", []);
  openSheet(`<div class="relative p-6 pt-8 sm:p-8">${closeBtn}<h3 class="text-2xl font-semibold">Mis entradas</h3>
    ${list.length ? `<ul class="mt-5 space-y-3">${list.map((t, i) => { const e = byId(t.ev)!; return `<li class="flex items-center gap-4 rounded-2xl bg-soft p-4"><div class="qr w-20 shrink-0 rounded-lg bg-white p-1.5 shadow-sm" data-c="${i}"></div><div class="min-w-0"><p class="text-xs text-violet">${fechaLarga(e.date)}</p><p class="truncate font-medium">${e.t}</p><p class="text-sm text-sub">${t.code} · ${t.qty}× · ${eur(t.total)}</p></div></li>`; }).join("")}</ul>`
      : `<div class="mt-8 rounded-2xl bg-soft p-8 text-center"><p class="text-4xl">🎟️</p><p class="mt-3 font-medium">Aún no tienes entradas</p><p class="mt-1 text-sm text-sub">Cuando compres una, aparecerá aquí con su QR.</p></div>`}
    <button type="button" data-close class="btn btn-dark mt-6 w-full">Cerrar</button></div>`, (s) => {
    $$("[data-c]", s).forEach((q) => paintQR(q, list[Number(q.dataset.c)].code));
    if (!reduced) animate($$("li", s), { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.08), ...SPRING });
  });
}
function openAccount() {
  const u = getUser();
  if (!u) return openLogin();
  openSheet(`<div class="relative p-6 pt-8 text-center sm:p-8">${closeBtn}
    <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet text-2xl font-semibold text-white">${u.name[0].toUpperCase()}</span>
    <h3 class="mt-4 text-2xl font-semibold">Hola, ${u.name.split(" ")[0]}</h3><p class="text-sub">${u.email}</p>
    <div class="mt-6 flex flex-col gap-3"><button type="button" id="a-t" class="btn btn-violet">Mis entradas</button><button type="button" id="a-s" class="btn border border-line">Vender entrada</button><button type="button" id="a-o" class="btn text-[#e5484d]">Cerrar sesión</button></div></div>`, (s) => {
    $("#a-t", s)!.addEventListener("click", openTickets);
    $("#a-s", s)!.addEventListener("click", openSell);
    $("#a-o", s)!.addEventListener("click", async () => { store.set("user", null); renderUser(); await closeSheet(); toast("Sesión cerrada", "👋"); });
  });
}
function renderUser() {
  const u = getUser();
  $("#login-btn")!.classList.toggle("hidden", !!u);
  const chip = $("#user-chip")!;
  chip.classList.toggle("hidden", !u);
  chip.classList.toggle("inline-flex", !!u);
  if (u) { $("#user-ini")!.textContent = u.name[0].toUpperCase(); $("#user-name")!.textContent = u.name.split(" ")[0]; }
}

/* ═══════════════ Interacciones globales ═══════════════ */
function globals() {
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const open = t.closest<HTMLElement>("[data-open]");
    if (open) { e.preventDefault(); openEvent(open.dataset.open!); return; }
    if (t.closest("[data-store]")) { e.preventDefault(); toast("Próximamente en las tiendas de apps", "📱"); return; }
    if (t.closest("[data-soon]")) { e.preventDefault(); toast("Próximamente", "⏳"); return; }
    if (t.closest("[data-sell]") || t.closest("#sell-btn")) { e.preventDefault(); openSell(); return; }
    if (t.closest("#login-btn")) { openLogin(); return; }
    if (t.closest("#user-chip")) { openAccount(); return; }
    const a = t.closest<HTMLAnchorElement>("a[href^='#']");
    if (a) {
      const h = a.getAttribute("href")!;
      e.preventDefault();
      if (h === "#" || h === "#top-page") scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      else document.querySelector(h)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
    // ondas en botones
    const b = t.closest<HTMLElement>(".btn");
    if (b && !reduced) {
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  });
  // logo y botones del header: efecto de pulsación
  press("#hdr button, #hdr a", (el) => { animate(el, { scale: 0.95 }, { duration: 0.1 }); return () => animate(el, { scale: 1 }, SPRING); });
  if (fine && !reduced) hover("#hdr button, #hdr nav a", (el) => { animate(el, { y: -2 }, SPRING); return () => animate(el, { y: 0 }, SPRING); });
  // logo: letras que saltan
  if (fine && !reduced) $("#logo")!.addEventListener("pointerenter", () => gsap.fromTo("#logo", { scale: 1 }, { scale: 1.06, duration: 0.5, ease: "elastic.out(1,0.4)", yoyo: true, repeat: 1 }));
  addEventListener("resize", () => tooltip());
}

/* ═══════════════ Arranque ═══════════════ */
function boot() {
  renderUser();
  header();
  modalEvents();
  globals();
  search();
  carousels();
  cards();
  intro();
  reveals();
  why();
  phone();
  cookies();
  setTimeout(() => tooltip(), 50);
  document.fonts?.ready.then(() => { ScrollTrigger.refresh(); tooltip(); });
  addEventListener("load", () => ScrollTrigger.refresh());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
