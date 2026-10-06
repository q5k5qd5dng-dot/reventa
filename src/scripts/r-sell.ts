import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { hover, animate } from "motion";
import { $, $$, paintQR, reduced, fine } from "./util";
import { SPRING } from "./r-core";
import { faqAnim } from "./r-views";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initSell(root: HTMLElement, sig: AbortSignal) {
  $$("[data-qr]", root).forEach((q) => paintQR(q, q.dataset.qr!));
  faqAnim(root, sig);
  if (reduced) return;

  // hero
  const h1 = $("h1", root)!;
  const split = SplitText.create(h1, { type: "lines", mask: "lines" });
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(split.lines, { yPercent: 115, duration: 1.1, stagger: 0.12 })
    .fromTo("[data-sell-in]:not(h1)", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12 }, 0.35)
    .fromTo("#sell-ticket", { y: 140, autoAlpha: 0, scale: 0.85, rotationX: 25 }, { y: 0, autoAlpha: 1, scale: 1, rotationX: 0, duration: 1.4, ease: "expo.out", transformPerspective: 900 }, 0.5)
    .fromTo("[data-face]", { scale: 0, autoAlpha: 0, y: 40 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.9, stagger: { each: 0.07, from: "center" }, ease: "back.out(2)" }, 0.9)
    .fromTo("#sell-up", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(2.5)" }, 1.5);
  tl.add(() => {
    $$("[data-face]", root).forEach((f, i) => gsap.to(f, { y: `+=${10 + (i % 4) * 5}`, x: `+=${(i % 2 ? 1 : -1) * 6}`, duration: 2.4 + (i % 5) * 0.45, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.12 }));
    gsap.to("#sell-up", { y: -7, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }, 2);
  $$("[data-blob]", root).forEach((b, i) => {
    gsap.to(b, { xPercent: i % 2 ? -14 : 14, yPercent: i % 2 ? 10 : -10, duration: 7 + i * 1.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(b, { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".sell-hero", start: "top top", end: "bottom top", scrub: true } });
  });
  // parallax con el ratón: más cerca = se mueve más
  if (fine) {
    const stage = $("#sell-stage", root)!;
    const faces = $$("[data-face]", root).map((f) => ({ q: gsap.quickTo(f, "rotation", { duration: 0.8, ease: "power3" }), k: parseFloat(f.style.width) / 60 }));
    const rx = gsap.quickTo("#sell-ticket", "rotationY", { duration: 0.7, ease: "power3" }), ry = gsap.quickTo("#sell-ticket", "rotationX", { duration: 0.7, ease: "power3" });
    $(".sell-hero", root)!.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect(), nx = ((e as PointerEvent).clientX - r.left) / r.width - 0.5, ny = ((e as PointerEvent).clientY - r.top) / r.height - 0.5;
      rx(nx * 16); ry(-ny * 12);
      faces.forEach((f) => f.q(nx * 8 * f.k));
    }, { signal: sig });
  }

  // secciones
  $$("[data-reveal]", root).forEach((el) => gsap.fromTo(el, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));
  ScrollTrigger.batch($$("[data-sw]", root), { start: "top 90%", once: true, onEnter: (els) => gsap.fromTo(els, { y: 60, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.12, ease: "power3.out", overwrite: true }) });
  $$("[data-step]", root).forEach((s, i) => {
    const imgFirst = s.firstElementChild?.hasAttribute("data-stepimg");
    const txt = [...s.children].find((c) => !c.hasAttribute("data-stepimg"))!, img = s.querySelector("[data-stepimg]")!;
    gsap.fromTo(txt, { x: (i % 2 ? 1 : -1) * 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 82%", once: true } });
    gsap.fromTo(img, { x: (imgFirst ? -1 : 1) * 60, autoAlpha: 0, scale: 0.94 }, { x: 0, autoAlpha: 1, scale: 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 82%", once: true } });
    const inner = img.firstElementChild!;
    gsap.fromTo(inner, { y: 40 }, { y: -18, ease: "none", scrollTrigger: { trigger: s, start: "top bottom", end: "bottom top", scrub: true } });
  });
  $$("[data-coin]", root).forEach((c, i) => gsap.to(c, { y: i ? -12 : 12, rotation: i ? 14 : -14, duration: 2.2 + i, ease: "sine.inOut", yoyo: true, repeat: -1 }));
  $$("[data-spin]", root).forEach((c) => gsap.to(c, { rotation: 360, duration: 6, ease: "none", repeat: -1 }));
  gsap.fromTo("#t-sfaq ~ .faq > details", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: ".faq[data-faq]", start: "top 88%", once: true } });
  if (fine) hover(".sw-card", (el) => { animate(el, { y: -6 }, SPRING); return () => animate(el, { y: 0 }, SPRING); });
}
