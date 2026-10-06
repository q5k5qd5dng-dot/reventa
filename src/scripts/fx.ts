import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { animate, hover, press, scroll, stagger, spring } from "motion";

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(sel)];
const one = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ───────── Motion: barra de progreso de lectura ───────── */
function progressBar() {
  const bar = document.createElement("div");
  bar.setAttribute("aria-hidden", "true");
  bar.className = "fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-violet-500 via-blue-400 to-cyan-300";
  bar.style.transform = "scaleX(0)";
  document.body.appendChild(bar);
  scroll(animate(bar, { scaleX: [0, 1] }, { ease: "linear" }));
}

/* ───────── GSAP: intro del hero ───────── */
function heroIntro() {
  const title = one('[data-hero="title"]');
  if (!title) return;
  const split = SplitText.create(title, { type: "words", mask: "words", wordsClass: "ht-word" });
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from('[data-hero="badge"]', { y: 18, autoAlpha: 0, duration: 0.7 })
    .from(split.words, { yPercent: 115, duration: 1, stagger: 0.07 }, "-=0.4")
    .from('[data-hero="sub"]', { y: 18, autoAlpha: 0, duration: 0.8 }, "-=0.6")
    .from('[data-hero="search"]', { y: 28, autoAlpha: 0, scale: 0.97, duration: 0.9 }, "-=0.6")
    .fromTo('[data-hero="chips"] > *', { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06 }, "-=0.5")
    .from("#floaters > *", { y: 90, autoAlpha: 0, rotate: (i) => [-14, 0, 12][i] ?? 0, duration: 1.2, stagger: 0.12, ease: "back.out(1.3)" }, "-=0.6")
    .from("#nav > div", { y: -24, autoAlpha: 0, duration: 0.8 }, 0);
}

/* ───────── GSAP: tarjetas flotantes + parallax con el ratón ───────── */
function floaters() {
  const items = $("[data-float]");
  items.forEach((el, i) => {
    gsap.to(el, { y: i === 1 ? -16 : 14, duration: 3 + i * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.4 });
  });
  const hero = one("section");
  if (!hero || !fine) return;
  const move = items.map((el, i) => ({
    x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3" }),
    r: gsap.quickTo(el, "rotation", { duration: 0.8, ease: "power3" }),
    k: [-1, 0.6, 1][i] ?? 1,
    base: [-6, 0, 5][i] ?? 0,
  }));
  hero.addEventListener("pointermove", (e) => {
    const nx = e.clientX / innerWidth - 0.5;
    move.forEach((m) => {
      m.x(nx * 36 * m.k);
      m.r(m.base + nx * 4 * m.k);
    });
  });
}

/* ───────── GSAP + ScrollTrigger ───────── */
function scrollFx() {
  // parallax de los focos de luz del hero
  $("[data-blob]").forEach((el) => {
    const d = Number(el.dataset.blob);
    gsap.to(el, { yPercent: 40, xPercent: 12 * d, ease: "none", scrollTrigger: { trigger: "section", start: "top top", end: "bottom top", scrub: true } });
  });

  // títulos
  $("[data-reveal]").forEach((el) => {
    gsap.fromTo(el, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // grupos con stagger
  $("[data-reveal-group]").forEach((g) => {
    gsap.fromTo(g.children, { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: g, start: "top 85%", once: true } });
  });

  // tarjetas de eventos y carruseles
  ScrollTrigger.batch(".ev, [data-card]", {
    start: "top 92%",
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 56, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.09, ease: "power3.out", overwrite: true }),
  });

  // contadores
  $("[data-count]").forEach((el) => {
    const to = Number(el.dataset.count);
    if (!to) return;
    const dec = Number(el.dataset.dec ?? 0);
    const pre = el.dataset.pre ?? "";
    const suf = el.dataset.suf ?? "";
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(o, {
          v: to,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => (el.textContent = pre + o.v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf),
        }),
    });
  });

  // móvil con la entrada: se endereza al hacer scroll
  const phone = one("#phone");
  if (phone) {
    gsap.fromTo(phone, { rotate: 8, y: 60, scale: 0.92 }, { rotate: 0, y: 0, scale: 1, ease: "none", scrollTrigger: { trigger: phone, start: "top 95%", end: "center 55%", scrub: 0.6 } });
    gsap.fromTo("#phone .ticket-notch", { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: phone, start: "top 70%", once: true } });
  }

  // banda de venta: aparece con zoom
  const sell = one("#sellcard");
  if (sell) gsap.from(sell, { scale: 0.92, borderRadius: "5rem", ease: "none", scrollTrigger: { trigger: sell, start: "top 95%", end: "top 40%", scrub: true } });

  // marquee reactivo a la velocidad del scroll
  const mq = one("#marquee");
  if (mq) {
    const loop = gsap.to(mq, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
        gsap.to(loop, { timeScale: 1 + Math.abs(v), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.2, overwrite: "auto" });
      },
    });
  }
}

/* ───────── Motion: interacciones ───────── */
function interactions() {
  const snap = { type: spring, stiffness: 300, damping: 22 } as const;

  // hover en tarjetas de evento: la ilustración crece y el precio se mueve
  if (fine) {
    hover(".ev", (el) => {
      const art = el.querySelector<HTMLElement>("div");
      if (art) animate(art, { scale: 1.035 }, snap);
      return () => art && animate(art, { scale: 1 }, snap);
    });
    $("[data-card]").forEach((el) => {
      el.addEventListener("pointerenter", () => gsap.to(el, { y: -8, duration: 0.5, ease: "elastic.out(1,0.6)", overwrite: "auto" }));
      el.addEventListener("pointerleave", () => gsap.to(el, { y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" }));
    });

    // botones magnéticos
    $("[data-magnetic]").forEach((el) => {
      const qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.25);
        qy((e.clientY - (r.top + r.height / 2)) * 0.25);
      });
      el.addEventListener("pointerleave", () => {
        qx(0);
        qy(0);
      });
    });
  }

  // efecto de pulsación en botones y tarjetas
  press("a:not([data-magnetic]):not([data-card]):not(.ev), button:not([data-magnetic]), summary", (el) => {
    animate(el, { scale: 0.96 }, { duration: 0.12 });
    return () => animate(el, { scale: 1 }, snap);
  });

  // filtros: las tarjetas visibles entran con stagger
  addEventListener("ht:filtered", () => {
    const vis = $(".ev").filter((c) => !c.classList.contains("hidden"));
    gsap.killTweensOf(vis);
    animate(vis, { opacity: [0, 1], y: [28, 0], scale: [0.96, 1] }, { delay: stagger(0.05), type: spring, stiffness: 260, damping: 24 });
  });

  // FAQ: el contenido se despliega con spring
  $("details").forEach((d) => {
    d.addEventListener("toggle", () => {
      const p = d.querySelector("p");
      if (d.open && p) animate(p, { opacity: [0, 1], y: [-10, 0] }, { type: spring, stiffness: 260, damping: 24 });
    });
  });
}

/* ───────── arranque ───────── */
function init() {
  if (reduced) {
    // sin movimiento: contenido visible y contadores en su valor final
    return;
  }
  progressBar();
  heroIntro();
  floaters();
  scrollFx();
  interactions();
  // recalcular tras cargar fuentes/imágenes
  addEventListener("load", () => ScrollTrigger.refresh());
}

init();
