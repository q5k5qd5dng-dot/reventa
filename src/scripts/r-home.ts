import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { animate, hover, press, inView, stagger, spring } from "motion";
import { $, $$, store, toast, shake, reduced, fine } from "./util";
import { SPRING, sleep, matchEvents, nameOf, artBg, esc } from "./r-core";
import { fechaLarga } from "../data/events";
import seats from "../data/seats.json";

gsap.registerPlugin(ScrollTrigger, SplitText, InertiaPlugin);
void shake; void stagger;

/* ═══════════════ Intro del hero ═══════════════ */
export function seatPoint() {
  const box = $("#seats"), wrap = $("#seats-wrap");
  if (!box || !wrap) return null;
  const r = box.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  const tall = getComputedStyle(box).backgroundSize.includes("auto");
  const d = tall ? seats.tall : seats.wide;
  const ratio = d.w / d.h;
  let sc: number, px: number;
  if (tall) { sc = r.height / d.h; px = 0.56; } else { sc = Math.max(r.width / d.w, r.height / d.h); px = 0.5; }
  const dw = d.w * sc, dh = d.h * sc;
  const ox = (r.width - dw) * px, oy = r.height - dh;
  void ratio;
  return { x: r.left - w.left + ox + d.x * dw, y: r.top - w.top + oy + d.y * dh, top: r.top - w.top + oy + d.top * dh };
}

export function placeTooltip(animateIn = false) {
  const tip = $("#seat-tip"), p = seatPoint();
  if (!tip || !p || getComputedStyle(tip).display === "none") return;
  tip.style.left = `${p.x}px`;
  tip.style.top = `${p.top - tip.offsetHeight - 10}px`;
  tip.style.transform = "translateX(-50%)";
  if (animateIn && !reduced) animate(tip, { opacity: [0, 1], y: [14, 0], scale: [0.85, 1] }, SPRING);
}

export function intro(delay = 0) {
  const title = $("#hero-title")!;
  const glow = document.createElement("span");
  glow.id = "seat-glow";
  glow.className = "pointer-events-none absolute z-[1] h-24 w-24 rounded-full";
  glow.style.background = "radial-gradient(circle, rgba(255,140,50,.85), rgba(255,140,50,0) 65%)";
  glow.style.mixBlendMode = "screen";
  $("#seats-wrap")!.appendChild(glow);
  const placeGlow = () => { const p = seatPoint(); if (p) { glow.style.left = `${p.x - 48}px`; glow.style.top = `${p.y - 52}px`; } };
  placeGlow();
  addEventListener("resize", placeGlow);
  if (reduced) { placeTooltip(); return; }
  const split = SplitText.create(title, { type: "lines", mask: "lines" });
  const tl = gsap.timeline({ delay, defaults: { ease: "power4.out" } });
  tl.fromTo("#hdr > div", { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0)
    .from(split.lines, { yPercent: 115, duration: 1.2, stagger: 0.12 }, 0.15)
    .fromTo("#hero-sub", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, 0.55)
    .fromTo("#search", { y: 36, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1 }, 0.7)
    .fromTo("#seats", { y: 140, autoAlpha: 0, scale: 1.08 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.6, ease: "expo.out", transformOrigin: "50% 100%" }, 0.5);
  gsap.set(glow, { autoAlpha: 0 });
  tl.add(() => { placeTooltip(true); gsap.to(glow, { autoAlpha: 1, duration: 0.8 }); gsap.to(glow, { scale: 1.5, opacity: 0.35, duration: 1.3, ease: "sine.inOut", yoyo: true, repeat: -1 }); }, 2.0);
  // parallax suave
  $$("[data-blob]").forEach((b, i) => gsap.to(b, { yPercent: 50, xPercent: i ? -18 : 18, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } }));
  gsap.to("#seats", { yPercent: 9, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("#hero-title, #hero-sub", { y: -30, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: "#hero", start: "30% top", end: "bottom top", scrub: true } });
  // la imagen de las butacas sigue sutilmente al ratón
  if (fine) {
    const sx = gsap.quickTo("#seats", "x", { duration: 1.2, ease: "power3" });
    $("#hero")!.addEventListener("pointermove", (e) => sx(((e as PointerEvent).clientX / innerWidth - 0.5) * -22));
  }
  addEventListener("resize", () => placeTooltip());
}

/* ═══════════════ Buscador del hero ═══════════════ */
export function heroSearch() {
  const q = $<HTMLInputElement>("#q")!, list = $("#results")!, box = $("#search-box")!;
  const close = () => list.classList.add("hidden");
  const render = () => {
    const t = q.value.trim();
    if (!t) return close();
    const m = matchEvents(t).slice(0, 5);
    list.classList.remove("hidden");
    list.innerHTML = m.length
      ? m.map((e) => `<li><a href="#/evento/${e.id}" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-soft focus:bg-soft focus:outline-none"><span class="card-art h-12 w-12 shrink-0 !rounded-lg"><span class="art block h-full w-full" style="${artBg(e.id)}"></span></span><span class="min-w-0 flex-1"><b class="block truncate text-sm font-medium">${esc(nameOf(e))}</b><span class="block truncate text-xs text-sub">${fechaLarga(e.date)} · ${esc(e.c)}</span></span><span class="text-sm font-semibold text-accent">${e.p} €</span></a></li>`).join("") + `<li class="px-1 pt-1"><a href="#/buscar/${encodeURIComponent(t)}" class="block rounded-lg px-3 py-2.5 text-center text-sm font-medium text-accent transition hover:bg-soft">Ver todos los resultados</a></li>`
      : `<li class="px-4 py-5 text-center text-sm text-sub">No hay eventos para «${esc(t)}». Prueba con otra ciudad o artista.</li>`;
    if (!reduced) animate(list.children as unknown as Element[], { opacity: [0, 1], y: [8, 0] }, { delay: stagger(0.04), ...SPRING });
  };
  q.addEventListener("input", render);
  q.addEventListener("focus", () => { gsap.to(box, { boxShadow: "0 22px 60px -16px rgba(20,40,140,0.6)", duration: 0.35 }); if (q.value) render(); });
  q.addEventListener("blur", () => gsap.to(box, { boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.35 }));
  $("#search")!.addEventListener("submit", (e) => { e.preventDefault(); const t = q.value.trim(); close(); location.hash = `#/buscar/${encodeURIComponent(t)}`; });
  q.addEventListener("keydown", (e) => {
    const items = $$<HTMLAnchorElement>("a", list);
    if (e.key === "ArrowDown" && items[0]) { e.preventDefault(); items[0].focus(); }
    if (e.key === "Escape") close();
  });
  list.addEventListener("keydown", (e) => {
    const items = $$<HTMLAnchorElement>("a", list), i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); i <= 0 ? q.focus() : items[i - 1].focus(); }
    if (e.key === "Escape") { close(); q.focus(); }
  });
  document.addEventListener("click", (e) => { const t = e.target as HTMLElement; if (!t.closest("#search") || t.closest("#results a")) close(); });
}

/* ═══════════════ Carruseles (arrastre + inercia + flechas) ═══════════════ */
export function carousels() {
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
export function cards() {
  if (fine && !reduced) {
    hover("[data-card] > a:not([data-tiltcard])", (el) => {
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
  press("[data-card] > a", (el) => {
    animate(el, { scale: 0.975 }, { duration: 0.12 });
    return () => animate(el, { scale: 1 }, SPRING);
  });
}

/* ═══════════════ Revelados al hacer scroll ═══════════════ */
export function reveals() {
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
    dots.forEach((d, k) => { d.style.width = k === i ? "1.75rem" : "0.5rem"; d.style.background = k === i ? "#e8590c" : ""; });
  }, { passive: true });
}

/* ═══════════════ Ilustraciones de «¿Por qué?» (GSAP) ═══════════════ */
export function why() {
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
export function phone() {
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
export function cookies() {
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

