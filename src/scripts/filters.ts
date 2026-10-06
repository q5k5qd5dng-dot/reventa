import { gsap } from "gsap";
import { $$, on } from "./util";
import { bindAll } from "./global";

interface Opts {
  root: HTMLElement;
  sig: AbortSignal;
  itemSel: string;
  catSel: string;
  countEl?: HTMLElement | null;
  emptyEl?: HTMLElement | null;
  q?: HTMLInputElement | null;
  city?: HTMLSelectElement | null;
  sort?: HTMLSelectElement | null;
  initialQ?: string;
}

/** Filtro por categoría + búsqueda + ciudad + orden, con animación de entrada. */
export function setupFilters(o: Opts) {
  const items = $$(o.itemSel, o.root);
  const tabs = $$(o.catSel, o.root);
  const parent = items[0]?.parentElement;
  let cat = "all";
  const first = true;
  const apply = (animate = true) => {
    const term = (o.q?.value ?? "").trim().toLowerCase();
    const city = o.city?.value ?? "";
    let n = 0;
    const vis: HTMLElement[] = [];
    for (const c of items) {
      const ok = (cat === "all" || c.dataset.cat === cat) && (!term || (c.dataset.s ?? "").includes(term)) && (!city || c.dataset.city === city);
      c.classList.toggle("hidden", !ok);
      if (ok) { n++; vis.push(c); }
    }
    const s = o.sort?.value;
    if (s && parent) {
      const sorted = [...items].sort((a, b) => s === "asc" ? +a.dataset.p! - +b.dataset.p! : s === "desc" ? +b.dataset.p! - +a.dataset.p! : +new Date(a.dataset.date!) - +new Date(b.dataset.date!));
      sorted.forEach((el) => parent.appendChild(el));
    }
    if (o.countEl) o.countEl.textContent = `${n} evento${n === 1 ? "" : "s"}`;
    o.emptyEl?.classList.toggle("hidden", n > 0);
    if (animate && vis.length) gsap.fromTo(vis, { y: 40, autoAlpha: 0, scale: 0.94 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.05, ease: "power3.out", overwrite: true });
  };
  tabs.forEach((t) => on(t, "click", () => {
    cat = t.dataset.cat ?? t.dataset.xcat ?? "all";
    tabs.forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    apply();
  }, o.sig));
  on(o.q, "input", () => apply(), o.sig);
  on(o.city, "change", () => apply(), o.sig);
  on(o.sort, "change", () => apply(), o.sig);
  if (o.initialQ && o.q) o.q.value = o.initialQ;
  apply(false);
  bindAll(o.root, o.sig);
  void first;
  return { apply };
}
