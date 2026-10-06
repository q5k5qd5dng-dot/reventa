import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { animate, spring } from "motion";
import { $, $$, fine, reduced, scramble, toast, getUser } from "./util";

gsap.registerPlugin(ScrollTrigger, SplitText);

export let lenis: Lenis | null = null;

/* ───────── Scroll suave (Lenis) acoplado a GSAP ───────── */
export function initScroll() {
  if (reduced) return;
  lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0));
export const scrollToEl = (el: Element | string) => (lenis ? lenis.scrollTo(el as any, { offset: -90 }) : (typeof el === "string" ? $(el) : el)?.scrollIntoView({ behavior: "smooth" }));

/* ───────── Nav: ocultar al bajar, barra de progreso, sesión ───────── */
export function initNav() {
  const nav = $("#nav")!, bar = $("#navbar")!, prog = $("#progress")!;
  let last = 0;
  const upd = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle("sticky-nav-hide", y - last > 3 && y > 160 && !!$("#mmenu")?.classList.contains("hidden") || (y - last >= -3 && nav.classList.contains("sticky-nav-hide")));
    bar.classList.toggle("bg-black/60", y > 40);
    last = y;
  };
  addEventListener("scroll", upd, { passive: true });
  upd();
  refreshNavUser();

  const burger = $("#burger")!, menu = $("#mmenu")!;
  const close = () => {
    menu.classList.add("hidden");
    burger.setAttribute("aria-expanded", "false");
    lenis?.start();
    document.body.style.overflow = "";
    burger.querySelectorAll("i").forEach((i) => ((i as HTMLElement).style.transform = ""));
  };
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("hidden") === false;
    burger.setAttribute("aria-expanded", String(open));
    const [a, b] = burger.querySelectorAll("i") as unknown as HTMLElement[];
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
      a.style.transform = "translateY(5px) rotate(45deg)";
      b.style.transform = "translateY(-5px) rotate(-45deg)";
      gsap.fromTo(".mlink > span", { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.07, ease: "power4.out" });
    } else close();
  });
  addEventListener("hashchange", close);
  addEventListener("ht:user", refreshNavUser);
}
export function refreshNavUser() {
  const u = getUser();
  const login = $("#nav-login")!, label = $("#nav-account-label")!;
  label.textContent = u ? u.name.split(" ")[0] : "Mi cuenta";
  login.textContent = u ? "Vender" : "Entrar";
  login.setAttribute("href", u ? "#/vender" : "#/login");
}

/* ───────── Cursor propio ───────── */
export function initCursor() {
  if (!fine || reduced) return;
  document.body.classList.add("has-cursor");
  const dot = $("#cd")!, ring = $("#cr")!, label = ring.querySelector("span")!;
  const dx = gsap.quickTo(dot, "x", { duration: 0.05 }), dy = gsap.quickTo(dot, "y", { duration: 0.05 });
  const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  addEventListener("pointermove", (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });
  document.addEventListener("pointerover", (e) => {
    const t = e.target as HTMLElement;
    const view = t.closest?.("[data-view-cursor]");
    const link = t.closest?.("a,button,summary,label,[role=tab],select,[data-hover]");
    ring.classList.toggle("is-view", !!view);
    ring.classList.toggle("is-link", !!link && !view);
    label.textContent = view ? "Ver" : "";
    gsap.to(ring, { scale: view ? 2.1 : link ? 1.5 : 1, duration: 0.35, ease: "power3.out", overwrite: "auto" });
  });
  addEventListener("pointerdown", () => ring.classList.add("is-down"));
  addEventListener("pointerup", () => ring.classList.remove("is-down"));
  document.addEventListener("mouseleave", () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 }));
  document.addEventListener("mouseenter", () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 }));
}

/* ───────── Interacciones por delegación ───────── */
export function initDelegated() {
  // foco que sigue al ratón
  document.addEventListener("pointermove", (e) => {
    const s = (e.target as HTMLElement).closest?.(".spot") as HTMLElement | null;
    if (!s) return;
    const r = s.getBoundingClientRect();
    s.style.setProperty("--mx", `${e.clientX - r.left}px`);
    s.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  // ripple en botones
  document.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest?.(".btn") as HTMLElement | null;
    if (!b || reduced) return;
    const r = b.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // scramble en enlaces del nav
  document.addEventListener("pointerover", (e) => {
    const el = (e.target as HTMLElement).closest?.("[data-scramble]") as HTMLElement | null;
    if (el && !reduced) scramble(el, 0.45);
  });

  // favoritos (corazón con estallido)
  document.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest?.("[data-like]") as HTMLElement | null;
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const id = b.dataset.like!;
    const favs = new Set<string>(JSON.parse(localStorage.getItem("ht:favs") || "[]"));
    const on = !favs.has(id);
    on ? favs.add(id) : favs.delete(id);
    try { localStorage.setItem("ht:favs", JSON.stringify([...favs])); } catch { /* */ }
    $$(`[data-like="${id}"]`).forEach((x) => x.classList.toggle("!bg-pink", on));
    if (on) burst(b);
    toast(on ? "Guardado en favoritos" : "Quitado de favoritos", on ? "♥" : "–");
  }, true);
}
export function isFav(id: string) {
  try { return (JSON.parse(localStorage.getItem("ht:favs") || "[]") as string[]).includes(id); } catch { return false; }
}
function burst(el: HTMLElement) {
  if (reduced) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("i");
    p.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:6px;height:6px;border-radius:50%;background:${["#ff3d9a", "#c6ff3d", "#fff"][i % 3]};z-index:200;pointer-events:none`;
    document.body.appendChild(p);
    const a = (i / 12) * Math.PI * 2;
    gsap.to(p, { x: Math.cos(a) * 46, y: Math.sin(a) * 46, opacity: 0, scale: 0.2, duration: 0.7, ease: "power3.out", onComplete: () => p.remove() });
  }
}

/* ───────── Tilt 3D + brillo ───────── */
export function bindTilt(root: ParentNode = document, sig?: AbortSignal) {
  if (!fine || reduced) return;
  $$("[data-tilt]", root).forEach((el) => {
    if ((el as any)._tilt) return;
    (el as any)._tilt = true;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 16);
      rx((0.5 - py) * 16);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
    }, { signal: sig });
    el.addEventListener("pointerleave", () => { rx(0); ry(0); }, { signal: sig });
  });
}

/* ───────── Botones magnéticos ───────── */
export function bindMagnetic(root: ParentNode = document, sig?: AbortSignal) {
  if (!fine || reduced) return;
  $$("[data-magnetic]", root).forEach((el) => {
    if ((el as any)._mag) return;
    (el as any)._mag = true;
    const qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }), qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.28);
      qy((e.clientY - (r.top + r.height / 2)) * 0.4);
    }, { signal: sig });
    el.addEventListener("pointerleave", () => { qx(0); qy(0); }, { signal: sig });
  });
}

/* ───────── Titulares: máscara de líneas al hacer scroll ───────── */
export function splitReveal(root: ParentNode = document) {
  $$("[data-split]", root).forEach((el) => {
    if (el.offsetParent === null) return;
    const s = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "ht-line" });
    gsap.set(s.lines, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(s.lines, { yPercent: 0, duration: 1.1, stagger: 0.1, ease: "power4.out" }),
    });
  });
}

/* ───────── Footer: wordmark gigante ───────── */
export function footerFx() {
  const g = $("#giant");
  if (!g) return;
  gsap.fromTo(g, { yPercent: 40, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: "#footer", start: "top bottom", end: "bottom bottom", scrub: true } });
}

/* ───────── Marquees reactivos al scroll ───────── */
export function marquees(root: ParentNode = document) {
  const rows = $$("[data-mq]", root);
  const tweens = rows.map((row) => {
    const dir = Number(row.dataset.mq) || -1;
    const dur = row.hasAttribute("data-slow") ? 70 : 34;
    return gsap.fromTo(row, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: dur, ease: "none", repeat: -1 });
  });
  if (!tweens.length) return;
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = Math.min(5, Math.abs(self.getVelocity()) / 350);
      tweens.forEach((t) => gsap.to(t, { timeScale: 1 + v, duration: 0.25, overwrite: true }));
      tweens.forEach((t) => gsap.to(t, { timeScale: 1, duration: 1.2, delay: 0.25, overwrite: "auto" }));
    },
  });
}

/* ───────── Scroll reveal genérico ───────── */
export function reveal(sel: string, root: ParentNode = document, vars: gsap.TweenVars = {}) {
  $$(sel, root).forEach((el) => {
    gsap.fromTo(el, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, ...vars });
  });
}

export function bindAll(root: ParentNode = document, sig?: AbortSignal) {
  bindTilt(root, sig);
  bindMagnetic(root, sig);
}

export { animate, spring };
