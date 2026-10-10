// Servicios con vista previa que sigue al cursor, marca blanca interactiva,
// fases fijadas al scroll y marquesinas.
import { gsap, ScrollTrigger, reduceMotion } from "./core";
import { confetti } from "./motion";
import { sfx } from "./sound";

export function initFeatures() {
  const items = document.querySelectorAll<HTMLElement>(".svc-item");
  if (!items.length) return;
  const prev = document.querySelector<HTMLElement>(".svc-preview");
  const canHover = matchMedia("(hover: hover) and (min-width: 1001px)").matches && !reduceMotion && !!prev;

  items.forEach((item) => {
    const btn = item.querySelector<HTMLButtonElement>(".svc-row")!;
    btn.addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      items.forEach((o) => {
        o.classList.remove("is-open");
        o.querySelector(".svc-row")?.setAttribute("aria-expanded", "false");
      });
      if (open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        if (prev) gsap.to(prev, { opacity: 0, duration: 0.2, overwrite: true });
      }
    });
    item.querySelector(".svc-more")?.addEventListener("transitionend", () => ScrollTrigger.refresh());
  });

  if (!canHover || !prev) return;
  const t = prev.querySelector<HTMLElement>("[data-pv-title]")!;
  const d = prev.querySelector<HTMLElement>("[data-pv-desc]")!;
  const k = prev.querySelector<HTMLElement>("[data-pv-kicker]")!;
  const bars = prev.querySelectorAll<HTMLElement>("[data-pv-bar]");
  const x = gsap.quickTo(prev, "x", { duration: 0.5, ease: "power3" });
  const y = gsap.quickTo(prev, "y", { duration: 0.5, ease: "power3" });
  gsap.set(prev, { opacity: 0, scale: 0.85, rotation: -6 });
  items.forEach((item, i) => {
    const row = item.querySelector<HTMLElement>(".svc-row")!;
    row.addEventListener("mouseenter", () => {
      if (item.classList.contains("is-open")) return;
      t.textContent = row.dataset.title || "";
      d.textContent = row.dataset.desc || "";
      k.textContent = String(i + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
      bars.forEach((b, j) => gsap.to(b, { scaleX: 0.25 + ((i * 37 + j * 23) % 70) / 100, duration: 0.5, ease: "power3.out" }));
      gsap.to(prev, { opacity: 1, scale: 1, rotation: 0, duration: 0.45, ease: "expo.out", overwrite: true });
    });
    row.addEventListener("mouseleave", () => gsap.to(prev, { opacity: 0, scale: 0.85, rotation: -6, duration: 0.3, overwrite: true }));
    row.addEventListener("mousemove", (e) => { x(e.clientX + 28); y(e.clientY - 70); });
  });
}

// Marca blanca: una sola marca alimenta la web, el email y el Wallet.
export function initWhiteLabel() {
  const root = document.querySelector<HTMLElement>("#wl-root");
  if (!root) return;
  const st = { brand: "Tu Local", accent: "#21aec0", bg: "#0f0f12", radius: 14, map: true, general: 1, copa: 0, tables: new Set<number>() };
  const PRICE = { general: 8, copa: 12, table: 150 };

  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  };
  const euro = (n: number) => n + " €";
  const pulse = (name: string) => root.querySelectorAll<HTMLElement>(`[data-callout="${name}"]`).forEach((el) => {
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  });

  const render = () => {
    const light = lum(st.bg) > 0.5;
    const set = (k: string, v: string) => root.style.setProperty(k, v);
    set("--wl-accent", st.accent);
    set("--wl-on", lum(st.accent) > 0.35 ? "#0a0a0a" : "#fff");
    set("--wl-bg", st.bg);
    set("--wl-fg", light ? "#111" : "#fff");
    set("--wl-mut", light ? "#666" : "#8d8d95");
    set("--wl-line", light ? "#e4e4e4" : "#2a2a30");
    set("--wl-radius", st.radius + "px");
    root.classList.toggle("has-map", st.map);
    const name = st.brand.trim() || "Tu Local";
    root.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = name));
    root.querySelectorAll("[data-initial]").forEach((el) => (el.textContent = name[0].toUpperCase()));
    root.querySelectorAll("[data-radius-out]").forEach((el) => (el.textContent = st.radius + " px"));

    const tables = [...st.tables].sort((a, b) => a - b);
    const total = st.general * PRICE.general + st.copa * PRICE.copa + (st.map ? tables.length * PRICE.table : 0);
    root.querySelectorAll("[data-total]").forEach((el) => (el.textContent = euro(total)));
    root.querySelector("[data-q-general]")!.textContent = String(st.general);
    root.querySelector("[data-q-copa]")!.textContent = String(st.copa);
    const lines: string[] = [];
    if (st.general) lines.push(`<li><span>${st.general}× Entrada normal</span><b>${st.general * PRICE.general} €</b></li>`);
    if (st.copa) lines.push(`<li><span>${st.copa}× Entrada + copa</span><b>${st.copa * PRICE.copa} €</b></li>`);
    if (st.map && tables.length) lines.push(`<li><span>Mesa ${tables.join(", ")} · 4 pers.</span><b>${tables.length * PRICE.table} €</b></li>`);
    if (!lines.length) lines.push("<li><span>Aún no has elegido nada</span></li>");
    root.querySelectorAll("[data-order]").forEach((el) => (el.innerHTML = lines.join("")));
    const units = st.general + st.copa + (st.map ? tables.length : 0);
    root.querySelectorAll("[data-count]").forEach((el) => (el.textContent = String(units)));
    root.querySelectorAll("[data-order-count]").forEach((el) => (el.textContent = "x" + units));
    root.querySelectorAll("[data-ticket-type]").forEach((el) => (el.textContent = st.copa ? "Entrada + copa" : st.general ? "Entrada normal" : tables.length ? "Mesa VIP" : "—"));
    root.querySelectorAll("[data-people]").forEach((el) => (el.textContent = String(st.general + st.copa + (st.map ? tables.length * 4 : 0))));
    root.querySelectorAll<SVGElement>(".wl-table").forEach((t) => t.classList.toggle("is-on", st.tables.has(Number(t.dataset.n))));
  };

  const press = (sel: string, attr: string, on: (v: string) => void) =>
    root.querySelectorAll<HTMLButtonElement>(sel).forEach((b) => b.addEventListener("click", () => {
      root.querySelectorAll(sel).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      on(b.getAttribute(attr)!);
      render();
    }));
  press("[data-accent]", "data-accent", (v) => { st.accent = v; pulse("accent"); });
  press("[data-bg]", "data-bg", (v) => { st.bg = v; pulse("bg"); });
  root.querySelector<HTMLInputElement>("#wl-brand")?.addEventListener("input", (e) => { st.brand = (e.target as HTMLInputElement).value; render(); });
  root.querySelector<HTMLInputElement>("#wl-radius")?.addEventListener("input", (e) => { st.radius = Number((e.target as HTMLInputElement).value); pulse("radius"); render(); });
  root.querySelector<HTMLInputElement>("#wl-map")?.addEventListener("change", (e) => { st.map = (e.target as HTMLInputElement).checked; pulse("map"); render(); });

  root.querySelectorAll<HTMLElement>("[data-step]").forEach((b) => b.addEventListener("click", () => {
    const [k, d] = b.dataset.step!.split(":") as ["general" | "copa", string];
    st[k] = Math.max(0, Math.min(8, st[k] + Number(d)));
    render();
  }));
  root.querySelectorAll<SVGElement>(".wl-table").forEach((t) => {
    const n = Number(t.dataset.n);
    const toggle = () => { st.tables.has(n) ? st.tables.delete(n) : st.tables.add(n); render(); };
    t.addEventListener("click", toggle);
    t.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") { e.preventDefault(); toggle(); } });
  });
  const toast = root.querySelector<HTMLElement>(".wl-toast");
  root.querySelector("[data-buy]")?.addEventListener("click", (e) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    sfx.play("chime");
    confetti({ x: r.left + r.width / 2, y: r.top }, [st.accent, "#ffffff", "#facc15", "#6366f1"]);
    toast?.classList.add("is-on");
    setTimeout(() => toast?.classList.remove("is-on"), 2200);
  });

  const tabs = root.querySelectorAll<HTMLButtonElement>("[data-wl-tab]");
  const panes = root.querySelectorAll<HTMLElement>("[data-wl-pane]");
  const select = (t: HTMLButtonElement) => {
    tabs.forEach((x) => { x.setAttribute("aria-selected", String(x === t)); x.tabIndex = x === t ? 0 : -1; });
    panes.forEach((p) => (p.hidden = p.dataset.wlPane !== t.dataset.wlTab));
    root.dispatchEvent(new CustomEvent("tabchange", { detail: t }));
    ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const k = (e as KeyboardEvent).key;
      if (k !== "ArrowRight" && k !== "ArrowLeft") return;
      e.preventDefault();
      const n = tabs[(i + (k === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      n.focus(); select(n);
    });
  });
  render();
}

// Indicador deslizante bajo la pestaña activa.
export function initTabs() {
  document.querySelectorAll<HTMLElement>(".wl-tabs").forEach((list) => {
    const ind = document.createElement("i");
    ind.className = "tab-ind";
    list.appendChild(ind);
    const move = (animate = true) => {
      const on = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!on) return;
      const vars = { x: on.offsetLeft, width: on.offsetWidth, duration: animate && !reduceMotion ? 0.5 : 0, ease: "power3.out" };
      gsap.to(ind, vars);
    };
    move(false);
    new ResizeObserver(() => move(false)).observe(list);
    list.querySelectorAll("button").forEach((b) => new ResizeObserver(() => move(false)).observe(b));
    document.querySelector("#wl-root")?.addEventListener("tabchange", () => move());
    addEventListener("resize", () => move(false));
    document.fonts?.ready.then(() => move(false));
  });
}

// Panel en ordenador y móvil: contadores y barras al entrar en pantalla.
export function initDevices() {
  const sec = document.querySelector<HTMLElement>(".dev");
  if (!sec) return;
  const run = () => {
    sec.classList.add("is-in");
    sec.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + suffix;
      if (reduceMotion) { el.textContent = fmt(to); return; }
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.8, ease: "power2.out", onUpdate: () => (el.textContent = fmt(o.v)) });
    });
  };
  ScrollTrigger.create({ trigger: sec, start: "top 70%", once: true, onEnter: run });
}

export function initFaq() {
  const items = document.querySelectorAll<HTMLElement>(".faq-item");
  items.forEach((item) => {
    const q = item.querySelector<HTMLButtonElement>(".faq-q")!;
    q.addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      items.forEach((o) => { o.classList.remove("is-open"); o.querySelector(".faq-q")?.setAttribute("aria-expanded", "false"); });
      if (open) { item.classList.add("is-open"); q.setAttribute("aria-expanded", "true"); }
    });
    item.querySelector(".faq-a")?.addEventListener("transitionend", () => ScrollTrigger.refresh());
  });
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
    const prev = cur;
    cur = i;
    if (prev !== -1) sfx.play("pop");
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
    end: () => "+=" + innerHeight * (mobile ? 1.6 : 2),
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
