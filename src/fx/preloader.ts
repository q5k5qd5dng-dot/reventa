// Preloader con pantalla partida y etiquetas. Se muestra una vez por sesión.
import { gsap, SplitText, lenis, reduceMotion } from "./core";

const KEY = "wavePreloaderSeen";

function hide() {
  [".fx-preloader", ".fx-split", ".fx-tags"].forEach((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (el) el.style.display = "none";
  });
}

export function initPreloader(): boolean {
  const pre = document.querySelector(".fx-preloader");
  if (!pre) return false;
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "true"; } catch { /* sin storage */ }
  if (seen || reduceMotion) { hide(); return false; }

  document.documentElement.style.overflow = "hidden";
  lenis?.stop();

  const titles = document.querySelectorAll(".fx-preloader h1, .fx-split h1, .fx-tags p");
  gsap.set(titles, { opacity: 0 });
  document.querySelectorAll(".fx-pre-title h1").forEach((h) => {
    const s = new SplitText(h, { type: "words,chars", charsClass: "fx-char" });
    s.chars.forEach((c) => (c.innerHTML = `<span>${c.textContent}</span>`));
  });
  document.querySelectorAll(".fx-tag p").forEach((p) => new SplitText(p, { type: "words", wordsClass: "fx-tword" }));
  gsap.set(".fx-split .fx-pre-title .fx-char span", { y: "0%" });

  const tl = gsap.timeline({
    defaults: { ease: "hop" },
    delay: 1,
    onComplete: () => {
      try { sessionStorage.setItem(KEY, "true"); } catch { /* sin storage */ }
      document.documentElement.style.overflow = "";
      lenis?.start();
      hide();
    },
  });
  const reveal = () => gsap.delayedCall(1, () => gsap.set(titles, { opacity: 1 }));
  (document.fonts?.ready ?? Promise.resolve()).then(reveal, reveal);

  const tags = gsap.utils.toArray<HTMLElement>(".fx-tag");
  tags.forEach((t, i) => tl.to(t.querySelectorAll(".fx-tword"), { y: "0%", duration: 0.75 }, 0.5 + i * 0.1));
  tl.to(".fx-preloader .fx-char span", { y: "0%", duration: 0.75, stagger: 0.05 }, 0.5)
    .to(".fx-split .fx-char span", { y: "0%", duration: 0.75, stagger: 0.05 }, 0.5);
  tags.forEach((t, i) => tl.to(t.querySelectorAll(".fx-tword"), { y: "110%", duration: 0.75 }, 2 + i * 0.1));
  tl.set([".fx-preloader", ".fx-split"], { clipPath: (i: number) => (i === 0 ? "polygon(0 0,100% 0,100% 50%,0 50%)" : "polygon(0 50%,100% 50%,100% 100%,0 100%)") }, 2.5)
    .to([".fx-preloader", ".fx-split"], { y: (i: number) => (i === 0 ? "-50%" : "50%"), duration: 1 }, 2.5);
  return true;
}
