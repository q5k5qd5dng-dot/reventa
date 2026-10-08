// Pantallas y clips reales de la app: móvil del hero que va cambiando de pantalla, escaparate con
// inclinación/parallax ligado al scroll y vídeos de Experiencias (sin audio) que solo se cargan y se mueven al verse.
import { gsap, ScrollTrigger, reduceMotion } from "./core";
import { sfx } from "./sound";

// 1. Móvil del hero: las capturas se apilan y se cruzan solas (ciudad -> discotecas -> entradas).
export function initAppStacks() {
  document.querySelectorAll<HTMLElement>("[data-app-stack]").forEach((stack) => {
    const imgs = [...stack.querySelectorAll<HTMLImageElement>("img")];
    if (imgs.length < 2) return;
    imgs.forEach((i) => { i.loading = "eager"; });
    if (reduceMotion) return; // se queda la primera pantalla, estática
    const frame = stack.closest<HTMLElement>(".pf");
    gsap.set(imgs, { autoAlpha: 0 });
    gsap.set(imgs[0], { autoAlpha: 1 });
    let cur = 0, timer: gsap.core.Tween | null = null, visible = true, dwell = 3.4;

    const tone = (i: number) => {
      frame?.style.setProperty("--pf-bg", imgs[i].dataset.bg || "#0a0c10");
      frame?.style.setProperty("--pf-fg", imgs[i].dataset.fg || "#fff");
    };
    const go = (to: number) => {
      if (to === cur) return;
      const from = imgs[cur], next = imgs[to];
      cur = to;
      tone(to);
      gsap.killTweensOf([from, next]);
      gsap.fromTo(next, { autoAlpha: 0, yPercent: 3, scale: 1.02 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.9, ease: "power3.out" });
      gsap.to(from, { autoAlpha: 0, yPercent: -2, scale: 0.985, duration: 0.7, ease: "power2.inOut" });
      sfx.play("swipe");
      schedule();
    };
    const schedule = () => {
      timer?.kill();
      if (!visible || document.hidden) return;
      timer = gsap.delayedCall(dwell, () => go((cur + 1) % imgs.length));
    };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(); else timer?.kill(); }, { threshold: 0.2 }).observe(stack);
    document.addEventListener("visibilitychange", () => { if (document.hidden) timer?.kill(); else schedule(); });
    // El primer cambio llega cuando el hero ya se ha mostrado.
    dwell = 3.4;
    schedule();
  });
}

// 2. Escaparate: cada móvil entra inclinado hacia el centro y se endereza con el scroll; el interior flota con parallax.
export function initShowcase() {
  const row = document.querySelector<HTMLElement>("[data-app-row]");
  if (!row) return;
  const phones = [...row.querySelectorAll<HTMLElement>("[data-app-phone]")];
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference) and (min-width: 760px)", () => {
    const mid = (phones.length - 1) / 2;
    phones.forEach((el, i) => {
      const d = (i - mid) / mid; // -1 .. 1
      gsap.set(el, { transformPerspective: 1400, transformOrigin: "50% 60%" });
      gsap.fromTo(el, { yPercent: 14 + Math.abs(d) * 10, rotationY: d * -16, rotationZ: d * 3, autoAlpha: 0.15 },
        { yPercent: 0, rotationY: 0, rotationZ: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: row, start: "top 92%", end: "top 38%", scrub: 0.7 } });
      const inner = el.querySelector<HTMLElement>("[data-app-in]");
      if (inner) gsap.fromTo(inner, { y: (i % 2 ? 1 : -1) * 26 }, { y: (i % 2 ? -1 : 1) * 26, ease: "none",
        scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    });
    // Cuando el cursor pasa por encima, el móvil se inclina un poco hacia él.
    if (matchMedia("(pointer: fine)").matches) {
      const off: Array<() => void> = [];
      phones.forEach((el) => {
        const inner = el.querySelector<HTMLElement>("[data-app-tilt]");
        if (!inner) return;
        const rx = gsap.quickTo(inner, "rotationX", { duration: 0.7, ease: "power3" });
        const ry = gsap.quickTo(inner, "rotationY", { duration: 0.7, ease: "power3" });
        gsap.set(inner, { transformPerspective: 900 });
        const mv = (e: PointerEvent) => { const r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); };
        const lv = () => { rx(0); ry(0); };
        el.addEventListener("pointermove", mv); el.addEventListener("pointerleave", lv);
        off.push(() => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerleave", lv); });
      });
      return () => off.forEach((f) => f());
    }
  });

  mm.add("(prefers-reduced-motion: no-preference) and (max-width: 759px)", () => {
    phones.forEach((el, i) => {
      gsap.fromTo(el, { yPercent: 8, autoAlpha: 0.2 }, { yPercent: 0, autoAlpha: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 98%", end: "top 70%", scrub: 0.5 } });
      const inner = el.querySelector<HTMLElement>("[data-app-in]");
      if (inner) gsap.fromTo(inner, { y: i % 2 ? 18 : -10 }, { y: i % 2 ? -10 : 18, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
    });
  });
}

// 3. Experiencias: los clips reales se cargan al acercarse, se mueven solo cuando se ven y se pueden pausar.
export function initExperiences() {
  const cards = document.querySelectorAll<HTMLElement>(".exp-card");
  if (!cards.length) return;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  const calm = reduceMotion || !!conn?.saveData;

  cards.forEach((card) => {
    const v = card.querySelector<HTMLVideoElement>("video");
    const btn = card.querySelector<HTMLButtonElement>(".exp-ctl");
    if (!v || !btn) return;
    let paused = calm; // pausa elegida por la persona (o movimiento reducido)
    let onScreen = false;

    const label = () => {
      const playing = !v.paused && !v.ended;
      btn.setAttribute("aria-pressed", String(playing));
      btn.setAttribute("aria-label", playing ? "Pausar vídeo" : "Reproducir vídeo");
      card.classList.toggle("is-playing", playing);
    };
    const ensureSrc = () => { if (!v.getAttribute("src") && v.dataset.src) { v.poster = v.dataset.poster || ""; v.src = v.dataset.src; v.load(); } };
    v.addEventListener("loadeddata", () => card.classList.add("is-ready"), { once: true });
    const play = () => { ensureSrc(); v.play().then(label, label); };
    const sync = () => { if (onScreen && !paused) play(); else { v.pause(); label(); } };

    new IntersectionObserver(([e]) => { if (e.isIntersecting && !calm) ensureSrc(); }, { rootMargin: "400px 0px" }).observe(card);
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold: 0.45 }).observe(card);
    btn.addEventListener("click", () => {
      if (v.paused) { paused = false; play(); } else { paused = true; v.pause(); label(); }
    });
    v.addEventListener("play", label); v.addEventListener("pause", label);
    document.addEventListener("visibilitychange", () => { if (document.hidden) v.pause(); else sync(); });
    label();
  });
}

export function refreshApp() { ScrollTrigger.refresh(); }
