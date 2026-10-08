// Entrada: el logotipo real de Wave sube enmascarado sobre un fondo de luz suave, una barra marca el avance
// y la pantalla se abre en dos mitades. Se muestra una vez por sesión y se salta con "reducir movimiento".
import { gsap, SplitText, lenis, reduceMotion } from "./core";
import { sfx } from "./sound";

const KEY = "wavePreloaderSeen";

function hide() {
  [".fx-preloader", ".fx-split", ".fx-tags", ".fx-pre-ui"].forEach((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (el) el.style.display = "none";
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function initPreloader(): number {
  const pre = document.querySelector(".fx-preloader");
  if (!pre) return 0.1;
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "true"; } catch { /* sin storage */ }
  if (seen || reduceMotion) { hide(); return 0.1; }

  document.documentElement.style.overflow = "hidden";
  lenis?.stop();

  document.querySelectorAll(".fx-tag p").forEach((p) => new SplitText(p, { type: "words", wordsClass: "fx-tword" }));
  const logos = gsap.utils.toArray<HTMLElement>(".fx-pre-logo img");
  const bars = gsap.utils.toArray<HTMLElement>(".fx-pre-bar");
  const tags = gsap.utils.toArray<HTMLElement>(".fx-tag");
  gsap.set(logos, { yPercent: 118, autoAlpha: 1 });
  const titles = gsap.utils.toArray<HTMLElement>(".fx-pre-logo");
  gsap.set(bars, { scaleX: 0 });
  gsap.set(".fx-tags p", { opacity: 1 });
  gsap.set(".fx-pre-ui", { autoAlpha: 0 });

  const finish = () => {
    try { sessionStorage.setItem(KEY, "true"); } catch { /* sin storage */ }
    document.documentElement.style.overflow = "";
    lenis?.start();
    hide();
  };

  const tl = gsap.timeline({ defaults: { ease: "hop" }, paused: true, onComplete: finish });
  tags.forEach((t, i) => tl.to(t.querySelectorAll(".fx-tword"), { y: "0%", duration: 0.55 }, 0.25 + i * 0.08));
  tl.to(logos, { yPercent: 0, duration: 0.9 }, 0.15)
    .fromTo(titles, { scale: 0.96 }, { scale: 1, duration: 1.4, ease: "power2.out" }, 0.15)
    .to(bars, { scaleX: 1, duration: 1.15, ease: "power2.inOut" }, 0.2)
    .to(".fx-pre-ui", { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0.35)
    .to(".fx-pre-ui", { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 1.5);
  tags.forEach((t, i) => tl.to(t.querySelectorAll(".fx-tword"), { y: "110%", duration: 0.5 }, 1.2 + i * 0.07));
  tl.to(logos, { yPercent: -4, duration: 0.3, ease: "power2.in" }, 1.28)
    .set([".fx-preloader", ".fx-split"], { clipPath: (i: number) => (i === 0 ? "polygon(0 0,100% 0,100% 50%,0 50%)" : "polygon(0 50%,100% 50%,100% 100%,0 100%)") }, 1.5)
    .to([".fx-preloader", ".fx-split"], { y: (i: number) => (i === 0 ? "-50%" : "50%"), duration: 0.85 }, 1.5)
    .call(() => sfx.play("whoosh"), [], 1.5);

  // El logotipo tiene que estar descargado antes de empezar, para que no aparezca a trozos.
  const first = document.querySelector<HTMLImageElement>(".fx-pre-logo img");
  const ready = first ? Promise.race([first.decode().catch(() => {}), wait(1800)]) : Promise.resolve();
  ready.then(() => tl.play(0.0));
  // El hero empieza a entrar cuando las dos mitades ya se abren.
  return 2.0;
}
