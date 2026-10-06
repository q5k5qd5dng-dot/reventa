// Menú a pantalla completa con enlaces que se deslizan y resaltador.
import { gsap, lenis, reduceMotion } from "./core";

export function initMenu() {
  const togglers = [...document.querySelectorAll<HTMLElement>("[data-menu-toggle]")];
  const toggler = togglers[0];
  const overlay = document.querySelector<HTMLElement>(".fx-menu");
  if (!toggler || !overlay) return;
  const links = overlay.querySelectorAll<HTMLElement>(".fx-menu-link");
  const hi = overlay.querySelector<HTMLElement>(".fx-hi");
  let open = false;
  let busy = false;

  const place = (el: HTMLElement | null) => {
    if (!hi) return;
    if (!el) { gsap.to(hi, { opacity: 0, duration: 0.2 }); return; }
    gsap.to(hi, { opacity: 1, y: el.offsetTop, height: el.offsetHeight, duration: reduceMotion ? 0 : 0.35, ease: "power3.out" });
  };
  links.forEach((l) => {
    l.addEventListener("mouseenter", () => place(l));
    l.addEventListener("focus", () => place(l));
  });
  overlay.querySelector(".fx-links")?.addEventListener("mouseleave", () => place(null));

  const set = (next: boolean) => {
    if (busy || next === open) return;
    busy = true;
    open = next;
    togglers.forEach((t) => { t.setAttribute("aria-expanded", String(open)); t.classList.toggle("is-open", open); });
    document.querySelector(".fx-nav")?.classList.toggle("menu-open", open);
    if (open) { lenis?.stop(); overlay.style.visibility = "visible"; }
    const done = () => { busy = false; if (!open) { overlay.style.visibility = "hidden"; lenis?.start(); } };
    if (reduceMotion) { gsap.set(overlay, { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }); done(); return; }
    gsap.to(overlay, { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)", duration: 0.9, ease: "hop", onComplete: done });
    if (open) gsap.fromTo(".fx-menu-link span", { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.05, delay: 0.25, ease: "power3.out" });
  };
  togglers.forEach((t) => t.addEventListener("click", () => set(!open)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  links.forEach((l) => l.addEventListener("click", () => { if (l.getAttribute("href")?.startsWith("#")) set(false); }));
}
