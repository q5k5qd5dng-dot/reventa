import { gsap } from "gsap";
import { $, $$, reduced } from "./util";
import { esc } from "./r-core";
import { legal, legalBy } from "../data/legal";

export function renderLegal(slug?: string): string {
  const d = legalBy(slug) ?? legal[0];
  const link = (u: string) => esc(u).replace(/(https?:\/\/[^\s]+?)(?=[.,]?(\s|$))/g, `<a class="text-accent underline" href="$1" target="_blank" rel="noopener">$1</a>`);
  return `<section class="mx-auto max-w-[62rem] px-6 pb-24 pt-32 md:pt-36">
    <nav class="flex flex-wrap gap-2 text-sm" aria-label="Documentos legales" data-l-in>${legal.map((l) => `<a href="#/legal/${l.slug}" class="rounded-full px-4 py-2 transition ${l.slug === d.slug ? "bg-ink text-white" : "bg-[#f1f1f3] text-ink/80 hover:bg-[#e8e8ec]"}">${l.n}</a>`).join("")}</nav>
    <h1 class="mt-10 text-[2.2rem] font-semibold leading-tight tracking-tight sm:text-[3.2rem]" data-l-in>${d.n}</h1>
    <p class="mt-3 text-sm text-sub" data-l-in>Última actualización: ${d.upd}</p>
    <p class="mt-6 max-w-3xl text-lg text-ink/80" data-l-in>${esc(d.intro)}</p>
    <div class="mt-10 grid gap-12 lg:grid-cols-[15rem_1fr]">
      <aside class="hidden lg:block"><ul id="l-toc" class="sticky top-28 space-y-1 border-l border-line text-sm">${d.secs.map((s, i) => `<li><a href="#" data-sec="${i}" class="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-ink/60 transition hover:text-ink">${esc(s.h.replace(/^\d+\.\s/, ""))}</a></li>`).join("")}</ul></aside>
      <article class="space-y-10 text-[1.02rem] leading-[1.75] text-ink/85">${d.secs.map((s, i) => `<section id="l-s${i}" data-lsec="${i}" class="scroll-mt-28"><h2 class="text-[1.4rem] font-semibold text-ink">${esc(s.h)}</h2><div class="mt-3 space-y-3">${s.p.map((p) => `<p>${link(p)}</p>`).join("")}</div></section>`).join("")}
        <p class="rounded-2xl bg-[#f6f6f7] p-5 text-sm text-ink/70">Este texto es una plantilla informativa para la demostración del producto. Antes de publicar el servicio real debe ser revisado y adaptado por un profesional jurídico.</p></article>
    </div></section>`;
}

export function initLegal(root: HTMLElement, sig: AbortSignal) {
  if (!reduced) gsap.fromTo("[data-l-in]", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: "power3.out" });
  const links = $$<HTMLElement>("#l-toc a", root), secs = $$<HTMLElement>("[data-lsec]", root);
  links.forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); secs[+a.dataset.sec!]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }, { signal: sig }));
  const set = (i: number) => links.forEach((a, j) => { a.classList.toggle("!border-accent", i === j); a.classList.toggle("!text-ink", i === j); });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(+(e.target as HTMLElement).dataset.lsec!); }), { rootMargin: "-20% 0px -70% 0px" });
  secs.forEach((s) => io.observe(s));
  sig.addEventListener("abort", () => io.disconnect());
  set(0);
}
