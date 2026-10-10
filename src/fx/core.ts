// Scroll suave (Lenis) + GSAP, cursor propio y utilidades compartidas.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("hop", ".8, 0, .3, 1");

export { gsap, ScrollTrigger, SplitText };
export const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export let lenis: Lenis | null = null;

export function initScroll() {
  if (lenis || reduceMotion) return;
  const mobile = innerWidth <= 1000;
  lenis = new Lenis({
    anchors: { offset: -72 },
    duration: mobile ? 0.8 : 1.2,
    lerp: mobile ? 0.075 : 0.1,
    smoothWheel: true,
    syncTouch: true,
    touchMultiplier: mobile ? 1.5 : 2,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  requestAnimationFrame(() => ScrollTrigger.refresh());
  addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches || reduceMotion) return;
  const el = document.createElement("div");
  el.id = "fx-cursor";
  document.body.appendChild(el);
  const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
  const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
  addEventListener("pointermove", (e) => {
    x(e.clientX);
    y(e.clientY);
    el.classList.add("is-on");
    el.classList.toggle("is-big", !!(e.target as HTMLElement)?.closest?.("a, button, [data-cursor]"));
  }, { passive: true });
  document.addEventListener("mouseleave", () => el.classList.remove("is-on"));
}

// Texto que sube enmascarado (palabras o líneas). data-split="words|lines", data-delay, data-scroll.
export function initSplitCopy(heroDelay: number) {
  const run = () => {
    document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
      const type = el.dataset.split === "words" ? "words" : "lines";
      const onScroll = el.dataset.scroll === "true";
      let delay = parseFloat(el.dataset.delay || "0");
      if (!onScroll && el.closest(".fx-hero, .hx")) delay += heroDelay;
      SplitText.create(el, {
        type,
        mask: type,
        autoSplit: true,
        linesClass: "fx-line",
        wordsClass: "fx-word",
        onSplit(self) {
          const targets = type === "words" ? self.words : self.lines;
          if (reduceMotion) { el.style.visibility = "visible"; return; }
          gsap.set(targets, { yPercent: 105 });
          el.style.visibility = "visible";
          const tween = gsap.to(targets, { yPercent: 0, duration: 0.8, ease: "power3.out", delay, stagger: 0.09, paused: onScroll });
          if (onScroll) ScrollTrigger.create({ trigger: el, start: "top 80%", animation: tween, toggleActions: "play none none none" });
        },
      });
    });
  };
  const settle = () => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 1200);
  };
  if (document.fonts?.ready) document.fonts.ready.then(() => { run(); settle(); });
  else { run(); settle(); }
}

// Inclina un elemento siguiendo el cursor dentro de un contenedor.
export function tilt(container: Element | null, target: Element | null, max = 18) {
  if (!container || !target || reduceMotion) return;
  const rx = gsap.quickTo(target, "rotationX", { duration: 0.9, ease: "power3" });
  const ry = gsap.quickTo(target, "rotationY", { duration: 0.9, ease: "power3" });
  gsap.set(target, { transformPerspective: 1000 });
  container.addEventListener("mousemove", (e) => {
    const r = (container as HTMLElement).getBoundingClientRect();
    const nx = ((e as MouseEvent).clientX - r.left) / r.width - 0.5;
    const ny = ((e as MouseEvent).clientY - r.top) / r.height - 0.5;
    ry(nx * max);
    rx(-ny * max);
  });
  container.addEventListener("mouseleave", () => { rx(0); ry(0); });
}

// Barra fija: toma el color de la sección que tiene debajo, marca la sección activa, muestra el progreso
// y convierte "Solicita una demo" en el botón principal cuando el del hero ya no se ve.
export function initNavTheme() {
  const nav = document.querySelector<HTMLElement>(".fx-nav");
  const sections = [...document.querySelectorAll<HTMLElement>("[data-nav]")];
  if (!nav || !sections.length) return;
  const spy = [...nav.querySelectorAll<HTMLAnchorElement>("[data-spy]")];
  let lastBg = "";
  const parse = (css: string) => {
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = "1"] = m[1].split(/[ ,\/]+/).filter(Boolean);
    return Number(a) === 0 ? null : `${r}, ${g}, ${b}`;
  };
  const update = () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.style.setProperty("--p", String(max > 0 ? Math.min(1, y / max) : 0));
    const hit = sections.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= 50 && r.bottom > 50;
    });
    if (!hit) return;
    const light = hit.dataset.nav === "dark";
    nav.classList.toggle("on-light", light);
    document.body.classList.toggle("on-light", light);
    const rgb = parse(getComputedStyle(hit).backgroundColor) ?? "10, 10, 10";
    if (rgb !== lastBg) { lastBg = rgb; nav.style.setProperty("--nav-bg", `rgba(${rgb}, .95)`); }
    spy.forEach((a) => a.classList.toggle("is-active", !!hit.id && a.dataset.spy === hit.id));
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();

  // El botón principal del hero deja de verse -> el de la barra pasa a ser el protagonista.
  const heroCta = document.querySelector("[data-hero-cta]");
  if (heroCta) {
    new IntersectionObserver(([e]) => nav.classList.toggle("cta-on", !e.isIntersecting), { rootMargin: "-70px 0px 0px 0px" }).observe(heroCta);
  } else nav.classList.add("cta-on");

  // En móvil la barra flotante se esconde cuando ya estás viendo el formulario de demo.
  const dock = document.querySelector<HTMLElement>(".fx-dock");
  const demo = document.querySelector("#demo");
  if (dock && demo) new IntersectionObserver(([e]) => dock.classList.toggle("is-hidden", e.isIntersecting)).observe(demo);
}
