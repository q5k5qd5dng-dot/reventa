import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { $, $$, on, every, countTo, paintQR, scramble, fine, reduced, store } from "./util";
import { bindAll, splitReveal, footerFx, marquees } from "./global";
import { createAurora } from "./webgl";
import { events } from "../data/events";
import { setupFilters } from "./filters";

let aurora: ReturnType<typeof createAurora> = null;
let glTried = false;

export function init(sig: AbortSignal, introDelay = 0) {
  const root = $("#v-home")!;
  bindAll(root, sig);
  $$("[data-qr]", root).forEach((q) => paintQR(q, q.dataset.qr!));

  /* ── WebGL ── */
  const canvas = $<HTMLCanvasElement>("#gl")!;
  if (!glTried) { aurora = createAurora(canvas); glTried = true; }
  if (!aurora) canvas.style.background = "radial-gradient(60% 60% at 30% 30%, #5b3df0, transparent), radial-gradient(50% 50% at 75% 60%, #0891b2, transparent), #07070d";
  else if (reduced) aurora.still();
  else {
    aurora.start();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? aurora!.start() : aurora!.stop()));
    io.observe(canvas);
    sig.addEventListener("abort", () => { io.disconnect(); aurora?.stop(); });
  }

  /* ── Intro del hero ── */
  const lines = $$("#hero-title .line-mask > span", root);
  const h = $$('[data-h="in"]', root);
  const tk = $("#hero-ticket")!;
  const tl = gsap.timeline({ delay: introDelay, defaults: { ease: "power4.out" } });
  tl.fromTo(lines, { yPercent: 120, skewY: 7 }, { yPercent: 0, skewY: 0, duration: 1.3, stagger: 0.12 })
    .fromTo(h, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09 }, "-=0.9")
    .fromTo(tk, { y: 140, rotationY: -80, scale: 0.7, autoAlpha: 0 }, { y: 0, rotationY: 0, scale: 1, autoAlpha: 1, duration: 1.6, ease: "expo.out", clearProps: "transform" }, 0.2);

  /* ── Ticket 3D que sigue al ratón ── */
  const card = $("#tcard")!, hero = $("#hero")!;
  if (fine && !reduced) {
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3" }), ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3" });
    gsap.set(card, { transformPerspective: 1200 });
    on(hero, "pointermove", (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 40); rx(-ny * 30);
      card.style.setProperty("--hx", String(Math.round(nx * 360 + 180)));
    }, sig);
    on(hero, "pointerleave", () => { rx(0); ry(0); }, sig);
  } else if (!reduced) gsap.to(card, { rotationY: 12, rotationX: -6, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, transformPerspective: 1200 });
  if (!reduced) $$("[data-float]", root).forEach((el, i) => gsap.to(el, { y: i ? 14 : -14, duration: 2.6 + i, ease: "sine.inOut", yoyo: true, repeat: -1 }));
  gsap.to("#scroll-hint", { y: 40, duration: 1.2, ease: "power2.inOut", repeat: -1, yoyo: false });

  /* ── Contador en vivo ── */
  const live = $("#live-count")!;
  let n = 1284;
  every(sig, 2200, () => { n += Math.round((Math.random() - 0.42) * 14); live.textContent = n.toLocaleString("es-ES"); });

  /* ── Buscador con sugerencias ── */
  const q = $<HTMLInputElement>("#hq")!, sug = $("#hsug")!;
  const go = (term: string) => { store.set("pendingQ", term); location.hash = "#/eventos"; };
  on(q, "input", () => {
    const t = q.value.trim().toLowerCase();
    const m = t ? events.filter((e) => `${e.t} ${e.a} ${e.c} ${e.v}`.toLowerCase().includes(t)).slice(0, 4) : [];
    sug.classList.toggle("hidden", !m.length);
    sug.innerHTML = m.map((e) => `<li><a href="#/evento/${e.id}" class="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 hover:bg-white/10"><span><b>${e.t}</b><span class="block text-xs text-mute">${e.a} · ${e.c}</span></span><span class="font-bold text-lime">${e.p} €</span></a></li>`).join("");
    if (m.length) gsap.fromTo(sug.children, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.3 });
  }, sig);
  on($("#hsearch"), "submit", () => go(q.value.trim()), sig);
  on(document, "click", (e: Event) => { if (!(e.target as HTMLElement).closest("#hsearch")) sug.classList.add("hidden"); }, sig);
  $$(".quick", root).forEach((b) => on(b, "click", () => go(b.dataset.q ?? ""), sig));

  /* ── Scroll ── */
  marquees(root);
  footerFx();
  splitReveal(root);

  $$("[data-count]", root).forEach((el) => {
    const to = Number(el.dataset.count);
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => countTo(el, to, Number(el.dataset.dec ?? 0), el.dataset.pre ?? "", el.dataset.suf ?? "", 2.2) });
  });
  $$("[data-stat]", root).forEach((el, i) => gsap.fromTo(el, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, delay: i * 0.08, scrollTrigger: { trigger: "#v-home dl", start: "top 88%", once: true } }));

  // parallax de los focos del hero + ticket
  gsap.to("#hero-ticket", { yPercent: -18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to("#hero-title", { yPercent: -12, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });

  /* ── Scroll horizontal fijado ── */
  const mm = gsap.matchMedia();
  sig.addEventListener("abort", () => mm.revert());
  mm.add("(min-width: 768px)", () => {
    const track = $("#htrack")!, pin = $("#hpin")!;
    const dist = () => track.scrollWidth - innerWidth;
    const t = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: (s) => gsap.set("#hprog", { scaleX: s.progress }) } });
    $$("[data-parallax]", track).forEach((el) => gsap.fromTo(el, { xPercent: -8 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: el, containerAnimation: t, start: "left right", end: "right left", scrub: true } }));
  });
  mm.add("(max-width: 767px)", () => {
    const wrap = $("#htrack")!.parentElement!;
    wrap.style.overflowX = "auto";
    wrap.classList.add("no-scrollbar");
    return () => { wrap.style.overflowX = ""; wrap.classList.remove("no-scrollbar"); };
  });

  /* ── Explorar ── */
  setupFilters({ root: $("#explore")!, sig, itemSel: ".ev", catSel: ".cat", countEl: $("#count"), emptyEl: $("#empty") });
  ScrollTrigger.batch("#grid .ev", { start: "top 92%", once: true, onEnter: (els) => gsap.fromTo(els, { y: 70, autoAlpha: 0, scale: 0.94 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1, stagger: 0.1, ease: "power3.out", overwrite: true }) });

  /* ── Pasos pegajosos ── */
  const sn = $("#sc-n"), st = $("#sc-t"), sc = $("#steps-card");
  $$(".step", root).forEach((s, i, all) => {
    gsap.fromTo(s, { autoAlpha: 0.25, scale: 0.94 }, { autoAlpha: 1, scale: 1, ease: "none", scrollTrigger: { trigger: s, start: "top 80%", end: "top 40%", scrub: true } });
    ScrollTrigger.create({
      trigger: s, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive) return;
        if (sn) sn.textContent = `Paso ${s.dataset.n}`;
        if (st) { st.dataset.orig = s.dataset.t!; scramble(st, 0.5); }
        if (sc) gsap.to(sc, { rotationY: (i - 1.5) * 26, rotationZ: (1.5 - i) * 2, duration: 0.9, ease: "back.out(1.4)", transformPerspective: 1000 });
      },
    });
    if (i === all.length - 1) void 0;
  });

  /* ── Bento: los iconos se dibujan ── */
  $$("[data-bento]", root).forEach((b, i) => {
    gsap.fromTo(b, { y: 60, autoAlpha: 0, scale: 0.92 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1, delay: (i % 3) * 0.08, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 90%", once: true } });
    const paths = $$("[data-draw]", b);
    paths.forEach((p) => {
      const len = (p as unknown as SVGGeometryElement).getTotalLength?.() ?? 400;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(p, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: b, start: "top 85%", once: true } });
    });
  });

  /* ── Lista de sitios con vista previa que sigue al cursor ── */
  const prev = $("#place-prev")!;
  if (fine && !reduced) {
    const px = gsap.quickTo(prev, "x", { duration: 0.6, ease: "power3" }), py = gsap.quickTo(prev, "y", { duration: 0.6, ease: "power3" });
    const rot = gsap.quickTo(prev, "rotation", { duration: 0.6, ease: "power3" });
    let lastX = 0;
    on($("#places"), "pointermove", (e: PointerEvent) => { px(e.clientX + 30); py(e.clientY - 100); rot(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.5))); lastX = e.clientX; }, sig);
    $$(".place", root).forEach((p) => {
      on(p, "pointerenter", () => { $$("[data-pp]", prev).forEach((x) => x.classList.toggle("hidden", x.dataset.pp !== p.dataset.prev)); gsap.to(prev, { autoAlpha: 1, scale: 1, duration: 0.4 }); prev.classList.remove("hidden"); }, sig);
      on(p, "pointerleave", () => gsap.to(prev, { autoAlpha: 0, scale: 0.8, duration: 0.3 }), sig);
    });
  }
  $$(".place", root).forEach((p) => gsap.fromTo(p, { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 92%", once: true } }));

  /* ── Venta: focos con parallax ── */
  $$("#sellbox .aurora").forEach((a, i) => gsap.to(a, { y: i % 2 ? -60 : 60, ease: "none", scrollTrigger: { trigger: "#sellbox", start: "top bottom", end: "bottom top", scrub: true } }));
  gsap.fromTo("#sellbox", { scale: 0.9, borderRadius: "6rem" }, { scale: 1, borderRadius: "2.5rem", ease: "none", scrollTrigger: { trigger: "#sellbox", start: "top 95%", end: "top 40%", scrub: true } });
  $$("[data-par]", root).forEach((el) => gsap.to(el, { y: Number(el.dataset.par), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }));
  $$("details", root).forEach((d) => on(d, "toggle", () => { const p = d.querySelector("p"); if (d.open && p) gsap.fromTo(p, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }); }, sig));

  void SplitText;
}
