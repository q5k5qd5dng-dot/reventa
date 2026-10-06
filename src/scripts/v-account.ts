import { gsap } from "gsap";
import { $, $$, on, toast, store, getUser, paintQR, countTo, reduced } from "./util";
import { bindAll, footerFx } from "./global";
import { events, byId, poster } from "../data/events";
import type { Ticket } from "./v-checkout";

export function init(sig: AbortSignal) {
  const user = getUser();
  if (!user) { toast("Inicia sesión para ver tu cuenta", "!"); store.set("next", "#/cuenta"); location.hash = "#/login"; return; }
  const root = $("#v-cuenta")!;
  $("#acc-name")!.textContent = user.name.split(" ")[0];
  $<HTMLInputElement>("#a-name")!.value = user.name;
  $<HTMLInputElement>("#a-email")!.value = user.email;

  /* entradas compradas (guardadas) */
  const grid = $("#tickets")!;
  $$("[data-extra]", grid).forEach((x) => x.remove());
  store.get<Ticket[]>("tickets", []).forEach((t, i) => {
    const e = byId(t.ev); if (!e) return;
    const d = document.createElement("div");
    d.className = "flip aspect-[3/4]"; d.dataset.flip = ""; d.dataset.extra = "";
    d.innerHTML = `<div class="flip-inner h-full w-full"><button type="button" class="flip-face poster-wrap block h-full w-full text-left"><div class="poster absolute inset-0">${poster(e, 700 + i)}</div><div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div><span class="absolute left-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-extrabold text-black">Nueva</span><div class="absolute inset-x-0 bottom-0 p-6"><p class="text-xs font-bold uppercase tracking-widest text-white/70">${e.a}</p><p class="font-display text-2xl font-semibold leading-tight">${e.t}</p><p class="mt-1 text-sm text-white/70">${t.seat}</p><p class="mt-4 text-xs text-lime">Toca para ver el QR ↻</p></div></button><button type="button" class="flip-face flip-back grid h-full w-full place-items-center rounded-[1.6rem] bg-white p-8 text-black"><div class="w-full"><p class="text-center text-xs font-bold uppercase tracking-widest text-black/50">${e.t}</p><div class="qr mx-auto mt-4 max-w-[12rem]" data-code="${t.code}"></div><p class="mt-4 text-center font-display text-lg font-bold">${t.code}</p></div></button></div>`;
    grid.prepend(d);
    paintQR(d.querySelector("[data-code]") as HTMLElement, t.code);
  });
  $$("[data-qr]", grid).forEach((q) => paintQR(q, q.dataset.qr!));
  on(grid, "click", (e: Event) => { const f = (e.target as HTMLElement).closest(".flip"); f?.classList.toggle("flipped"); }, sig);

  /* favoritos */
  const favIds: string[] = (() => { try { return JSON.parse(localStorage.getItem("ht:favs") || "[]"); } catch { return []; } })();
  const favs = $("#favs")!;
  favs.innerHTML = favIds.map((id, i) => { const e = byId(id); return e ? `<a href="#/evento/${e.id}" class="group block" data-view-cursor><div class="poster-wrap aspect-[4/5]"><div class="poster absolute inset-0 transition duration-700 group-hover:scale-110">${poster(e, 800 + i)}</div><div class="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div><div class="absolute inset-x-0 bottom-0 p-5"><p class="font-display text-xl font-semibold">${e.t}</p><p class="text-sm text-white/70">${e.d} · ${e.c}</p></div></div></a>` : ""; }).join("");
  $("#favs-empty")!.classList.toggle("hidden", favIds.length > 0);

  /* en venta guardadas */
  const sold = store.get<{ ev: string; qty: number; price: number }[]>("selling", []);
  const list = $("[data-pane='selling'] .glass")!;
  $$("[data-extra]", list).forEach((x) => x.remove());
  sold.forEach((s) => { const e = byId(s.ev) ?? events[0]; const d = document.createElement("div"); d.dataset.extra = ""; d.className = "flex flex-wrap items-center gap-4 p-5"; d.innerHTML = `<div class="poster-wrap h-16 w-14 shrink-0 !rounded-xl"><div class="poster absolute inset-0">${poster(e, 950)}</div></div><div class="min-w-0 flex-1"><p class="truncate font-semibold">${e.t}</p><p class="text-sm text-mute">${s.qty} entrada${s.qty > 1 ? "s" : ""} · ${s.price} € c/u</p></div><span class="rounded-full bg-lime px-3 py-1 text-xs font-bold text-black">Nueva</span>`; list.prepend(d); });

  /* pestañas */
  const tabs = $$(".atab", root), panes = $$(".apane", root);
  const open = (k: string, first = false) => {
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === k)));
    panes.forEach((p) => {
      const on_ = p.dataset.pane === k;
      if (!on_) { p.classList.add("hidden"); return; }
      p.classList.remove("hidden");
      if (!first) gsap.fromTo(p.children, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power3.out" });
      if (k === "wallet") wallet();
    });
  };
  const wallet = () => {
    $$("#v-cuenta [data-count]").forEach((el) => countTo(el, +el.dataset.count!, +(el.dataset.dec ?? 0), "", "", 1.6));
    const line = $<SVGPathElement>("#chart-line")!, len = line.getTotalLength();
    gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: reduced ? 0 : 2, ease: "power2.inOut" });
    gsap.to("#chart-area", { opacity: 1, duration: 1, delay: 1.2 });
  };
  tabs.forEach((t) => on(t, "click", () => open(t.dataset.tab!), sig));
  open("tickets", true);
  gsap.fromTo("#v-cuenta .glass, #tickets > *", { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", delay: 0.2 });

  on($("#logout"), "click", () => { store.set("user", null); dispatchEvent(new Event("ht:user")); toast("Sesión cerrada", "👋"); location.hash = "#/"; }, sig);
  on($("#settings-form"), "submit", (e: Event) => {
    e.preventDefault();
    const n = $<HTMLInputElement>("#a-name")!.value.trim() || user.name, em = $<HTMLInputElement>("#a-email")!.value.trim() || user.email;
    store.set("user", { name: n, email: em }); dispatchEvent(new Event("ht:user")); $("#acc-name")!.textContent = n.split(" ")[0]; toast("Cambios guardados");
  }, sig);
  bindAll(root, sig);
  footerFx();
}
