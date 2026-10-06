// Sistema de movimiento: todo vive dentro de gsap.matchMedia para respetar "reducir movimiento"
// y limpiarse solo. Estados iniciales ocultos solo con JS (html.js:not(.rm)) para no parpadear.
import { gsap, ScrollTrigger, SplitText } from "./core";

const NO_RM = "(prefers-reduced-motion: no-preference)";
const FINE = "(pointer: fine) and (min-width: 1001px)";

export function initMotion() {
  const mm = gsap.matchMedia();

  mm.add(NO_RM, () => {
    // 1. Aparición escalonada por lotes (tarjetas, filas, bloques).
    gsap.set("[data-reveal]", { y: 28 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, overwrite: true }),
    });

    // 2. Parallax suave por scroll: data-parallax="0.15" (fracción del alto del elemento).
    gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax || "0.12");
      gsap.fromTo(el, { yPercent: -amt * 100 }, {
        yPercent: amt * 100, ease: "none",
        scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });

    // 3. Texto que se "lee": cada palabra pasa de apagada a encendida con el scroll.
    document.querySelectorAll<HTMLElement>("[data-reading]").forEach((el) => {
      const split = SplitText.create(el, { type: "words", wordsClass: "rd-word", autoSplit: true });
      gsap.fromTo(split.words, { opacity: 0.16 }, {
        opacity: 1, ease: "none", stagger: 0.12,
        scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: 0.4 },
      });
      el.style.visibility = "visible";
    });

    // 4. Líneas SVG que se dibujan al entrar (data-draw en el <svg>).
    document.querySelectorAll<SVGElement>("[data-draw]").forEach((svg) => {
      const paths = svg.querySelectorAll<SVGGeometryElement>("path, line");
      paths.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = String(l); p.style.strokeDashoffset = String(l); });
      gsap.to(paths, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.12,
        scrollTrigger: { trigger: svg, start: "top 80%", once: true } });
    });

    // 5. Entrada del hero: composición de producto en capas.
    const heroUI = document.querySelectorAll<HTMLElement>("[data-hero-in]");
    if (heroUI.length) {
      const delay = document.documentElement.dataset.heroDelay ? parseFloat(document.documentElement.dataset.heroDelay!) : 0.2;
      gsap.set(heroUI, { yPercent: 10, scale: 0.97 });
      gsap.to(heroUI, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.1, ease: "power3.out", stagger: 0.12, delay });
    }
  });

  // Botones magnéticos y composición del hero que sigue al cursor (solo con ratón).
  mm.add(`${NO_RM} and ${FINE}`, () => {
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.5)" });
      const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.5)" });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.28);
        y((e.clientY - (r.top + r.height / 2)) * 0.34);
      };
      const leave = () => { x(0); y(0); };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
    });

    const hero = document.querySelector<HTMLElement>(".hx");
    if (hero) {
      const layers = hero.querySelectorAll<HTMLElement>("[data-depth]");
      const setters = [...layers].map((l) => ({ x: gsap.quickTo(l, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(l, "y", { duration: 0.9, ease: "power3" }), d: parseFloat(l.dataset.depth || "10") }));
      const move = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        setters.forEach((s) => { s.x(-nx * s.d * 2); s.y(-ny * s.d * 2); });
      };
      hero.addEventListener("pointermove", move);
      return () => hero.removeEventListener("pointermove", move);
    }
  });

  return mm;
}

// Confeti propio, ligero (canvas), para celebrar la compra de la demo.
export function confetti(origin: { x: number; y: number }, colors: string[]) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:20000";
  const dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const N = 70;
  const ps = Array.from({ length: N }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const v = 7 + Math.random() * 9;
    return { x: origin.x, y: origin.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0], life: 1 };
  });
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 16.7, 2); last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of ps) {
      p.vy += 0.34 * dt; p.vx *= 0.992; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= 0.0105 * dt;
      if (p.life <= 0) continue;
      alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (alive) requestAnimationFrame(tick); else cv.remove();
  };
  requestAnimationFrame(tick);
}
