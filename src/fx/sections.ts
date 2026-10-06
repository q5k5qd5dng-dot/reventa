// Servicios con vista previa que sigue al cursor, marca blanca interactiva,
// fases fijadas al scroll y marquesinas.
import { gsap, ScrollTrigger, reduceMotion } from "./core";

export function initServices() {
  const rows = document.querySelectorAll<HTMLElement>(".svc-row");
  const prev = document.querySelector<HTMLElement>(".svc-preview");
  if (!rows.length || !prev) return;
  const t = prev.querySelector<HTMLElement>("[data-pv-title]")!;
  const d = prev.querySelector<HTMLElement>("[data-pv-desc]")!;
  const k = prev.querySelector<HTMLElement>("[data-pv-kicker]")!;
  const bars = prev.querySelectorAll<HTMLElement>("[data-pv-bar]");
  if (!matchMedia("(hover: hover) and (min-width: 1001px)").matches || reduceMotion) return;

  const x = gsap.quickTo(prev, "x", { duration: 0.5, ease: "power3" });
  const y = gsap.quickTo(prev, "y", { duration: 0.5, ease: "power3" });
  rows.forEach((row, i) => {
    row.addEventListener("mouseenter", () => {
      t.textContent = row.dataset.title || "";
      d.textContent = row.dataset.desc || "";
      k.textContent = String(i + 1).padStart(2, "0") + " / " + String(rows.length).padStart(2, "0");
      bars.forEach((b, j) => gsap.to(b, { scaleX: 0.25 + ((i * 37 + j * 23) % 70) / 100, duration: 0.5, ease: "power3.out" }));
      gsap.to(prev, { opacity: 1, scale: 1, rotation: 0, duration: 0.45, ease: "expo.out" });
    });
    row.addEventListener("mouseleave", () => gsap.to(prev, { opacity: 0, scale: 0.85, rotation: -6, duration: 0.3 }));
    row.addEventListener("mousemove", (e) => { x(e.clientX + 28); y(e.clientY - 70); });
  });
  gsap.set(prev, { opacity: 0, scale: 0.85, rotation: -6 });
}

export function initWhiteLabel() {
  const root = document.querySelector<HTMLElement>(".wl");
  if (!root) return;
  const prev = root.querySelector<HTMLElement>(".wl-widget")!;
  root.querySelectorAll<HTMLButtonElement>("[data-wl-color]").forEach((b) =>
    b.addEventListener("click", () => {
      prev.style.setProperty("--wl-accent", b.dataset.wlColor!);
      root.querySelectorAll("[data-wl-color]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
  root.querySelector<HTMLInputElement>("#wl-radius")?.addEventListener("input", (e) => {
    const v = (e.target as HTMLInputElement).value;
    prev.style.setProperty("--wl-radius", v + "px");
    root.querySelector("[data-wl-radius-out]")!.textContent = v + " px";
  });
  root.querySelectorAll<HTMLButtonElement>("[data-wl-theme]").forEach((b) =>
    b.addEventListener("click", () => {
      prev.dataset.theme = b.dataset.wlTheme;
      root.querySelectorAll("[data-wl-theme]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
  root.querySelector<HTMLInputElement>("#wl-map")?.addEventListener("change", (e) => {
    prev.classList.toggle("has-map", (e.target as HTMLInputElement).checked);
  });
  // cantidades y total
  const total = root.querySelector<HTMLElement>("[data-wl-total]")!;
  const rows = root.querySelectorAll<HTMLElement>(".wl-ticket");
  const calc = () => {
    let sum = 0;
    rows.forEach((r) => (sum += Number(r.dataset.price) * Number(r.querySelector("[data-qty]")!.textContent)));
    total.textContent = sum + " €";
  };
  rows.forEach((r) => {
    const q = r.querySelector<HTMLElement>("[data-qty]")!;
    r.querySelector("[data-plus]")?.addEventListener("click", () => { q.textContent = String(Math.min(8, Number(q.textContent) + 1)); calc(); });
    r.querySelector("[data-minus]")?.addEventListener("click", () => { q.textContent = String(Math.max(0, Number(q.textContent) - 1)); calc(); });
  });
  calc();
}

export function initPhases() {
  const sec = document.querySelector<HTMLElement>(".phases");
  if (!sec) return;
  const words = sec.querySelectorAll<HTMLElement>(".phase-word");
  const cards = sec.querySelectorAll<HTMLElement>(".phase-card");
  const bar = sec.querySelector<HTMLElement>(".phase-progress i");
  const N = words.length;
  let cur = -1;
  const show = (i: number) => {
    if (i === cur) return;
    cur = i;
    words.forEach((w, j) => gsap.to(w, { opacity: j === i ? 1 : 0.18, x: j === i && innerWidth > 1000 ? 24 : 0, duration: 0.5, ease: "power3.out" }));
    cards.forEach((c, j) => {
      gsap.to(c, { autoAlpha: j === i ? 1 : 0, yPercent: j === i ? 0 : j < i ? -12 : 12, duration: 0.6, ease: "power3.out" });
    });
  };
  show(0);
  if (reduceMotion) return;
  const mobile = innerWidth <= 1000;
  ScrollTrigger.create({
    trigger: sec,
    start: "top top",
    end: () => "+=" + innerHeight * (mobile ? 2.2 : 3),
    pin: true,
    scrub: true,
    onUpdate: (self) => {
      show(Math.min(N - 1, Math.floor(self.progress * N)));
      if (bar) gsap.set(bar, { scaleX: self.progress });
    },
  });
}

export function initMarquees() {
  const rows = document.querySelectorAll<HTMLElement>(".mq-track");
  if (!rows.length || reduceMotion) return;
  const tweens = [...rows].map((row, i) =>
    gsap.fromTo(row, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 38, ease: "none", repeat: -1 }));
  ScrollTrigger.create({
    onUpdate(self) {
      const dir = self.direction || 1;
      const v = 1 + Math.min(5, Math.abs(self.getVelocity()) / 400);
      tweens.forEach((t) => {
        gsap.killTweensOf(t, "timeScale");
        gsap.to(t, { timeScale: dir * v, duration: 0.25 });
        gsap.to(t, { timeScale: dir, duration: 1.2, delay: 0.25 });
      });
    },
  });
}
