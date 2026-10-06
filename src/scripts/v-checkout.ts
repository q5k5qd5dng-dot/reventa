import { gsap } from "gsap";
import { $, $$, on, toast, store, getUser, eur, paintQR, shake } from "./util";
import { bindAll, footerFx } from "./global";
import { byId } from "../data/events";
import { confetti } from "./confetti";
import { setErr, clearErr } from "./forms";
import type { Cart } from "./v-event";

const FEE = 0.08;
export interface Ticket { id: string; ev: string; seat: string; code: string; at: number }

export function init(sig: AbortSignal) {
  const cart = store.get<Cart | null>("cart", null);
  const ev = cart ? byId(cart.id) : null;
  if (!cart || !ev || !cart.seats.length) { toast("Elige tus asientos primero", "!"); location.hash = "#/eventos"; return; }
  const root = $("#v-checkout")!;
  bindAll(root, sig);

  const base = cart.seats.reduce((s, x) => s + x.price, 0), fee = Math.round(base * FEE), total = base + fee;
  $("#co-back")!.setAttribute("href", `#/evento/${ev.id}`);
  $("#co-art")!.innerHTML = $<HTMLTemplateElement>(`template[data-poster="${ev.id}"]`)?.innerHTML ?? "";
  $("#co-artist")!.textContent = ev.a; $("#co-title")!.textContent = ev.t; $("#co-meta")!.textContent = `${ev.d} · ${ev.time} · ${ev.c}`;
  $("#co-qty")!.textContent = `${cart.seats.length} entrada${cart.seats.length > 1 ? "s" : ""}`;
  $("#co-base")!.textContent = eur(base); $("#co-fee")!.textContent = eur(fee);
  $("#pay-amount")!.textContent = `${total} €`;
  const o = { v: 0 };
  gsap.to(o, { v: total, duration: 1.2, ease: "power3.out", onUpdate: () => ($("#co-total")!.textContent = Math.round(o.v).toString()) });
  $("#co-items")!.innerHTML = cart.seats.map((s) => `<li class="flex items-center justify-between rounded-2xl border border-line bg-white/5 px-4 py-3"><span>${s.label}</span><b>${s.price} €</b></li>`).join("");

  const user = getUser();
  if (user) { $<HTMLInputElement>("#c-name")!.value = user.name; $<HTMLInputElement>("#c-email")!.value = user.email; }

  /* pasos */
  const panes = $$(".co-pane", root);
  const bars = $$(".co-step b", root);
  let step = 0;
  const go = (n: number, instant = false) => {
    const from = panes[step], to = panes[n], dir = n >= step ? 1 : -1;
    bars.forEach((b, i) => gsap.to(b, { width: i < n ? "100%" : i === n ? "50%" : "0%", duration: 0.7, ease: "power3.out" }));
    $$(".co-step span", root).forEach((s, i) => s.classList.toggle("!text-white", i <= n));
    if (instant || from === to) { panes.forEach((p) => p.classList.add("hidden")); to.classList.remove("hidden"); step = n; return; }
    gsap.to(from, { x: -40 * dir, autoAlpha: 0, duration: 0.25, onComplete: () => {
      from.classList.add("hidden"); gsap.set(from, { clearProps: "all" }); to.classList.remove("hidden");
      gsap.fromTo(to.children, { x: 40 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.55, stagger: 0.06, ease: "power3.out" });
      step = n;
    } });
  };
  go(0, true);
  $$(".co-next", root).forEach((b) => on(b, "click", (e: Event) => {
    if (step === 1) {
      e.preventDefault(); const n = $<HTMLInputElement>("#c-name")!, em = $<HTMLInputElement>("#c-email")!; clearErr(panes[1]);
      const a = setErr(n, n.value.trim().length >= 3 ? "" : "Nombre y apellidos"), c = setErr(em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value) ? "" : "Email no válido");
      if (!(a && c)) return;
      $("#pc-name")!.textContent = n.value.toUpperCase();
    }
    e.preventDefault(); go(step + 1);
  }, sig));
  $$(".co-prev", root).forEach((b) => on(b, "click", () => go(step - 1), sig));
  on(panes[1], "submit", (e: Event) => e.preventDefault(), sig);

  /* tarjeta en vivo */
  const num = $<HTMLInputElement>("#p-num")!, exp = $<HTMLInputElement>("#p-exp")!, cvc = $<HTMLInputElement>("#p-cvc")!;
  on(num, "input", () => { num.value = num.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); $("#pc-num")!.textContent = (num.value + " ••••••••••••••••").slice(0, 19).replace(/ ?(.{4})/g, "$1 ").trim().padEnd(19, "•"); }, sig);
  on(exp, "input", () => { let v = exp.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); exp.value = v; $("#pc-exp")!.textContent = v || "MM/AA"; }, sig);
  on(cvc, "input", () => (cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4)), sig);
  on(cvc, "focus", () => gsap.to("#paycard", { rotationY: -14, rotationX: 6, scale: 1.03, duration: 0.6, transformPerspective: 800 }), sig);
  on(cvc, "blur", () => gsap.to("#paycard", { rotationY: 0, rotationX: 0, scale: 1, duration: 0.6 }), sig);
  on(num, "focus", () => gsap.to("#paycard", { rotationY: 0, duration: 0.4 }), sig);

  /* pagar */
  on($(".co-pay", root), "click", (e: Event) => {
    e.preventDefault(); clearErr(panes[2]);
    const ok = [
      setErr(num, num.value.replace(/\s/g, "").length === 16 ? "" : "Debe tener 16 dígitos"),
      setErr(exp, /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp.value) ? "" : "MM/AA"),
      setErr(cvc, cvc.value.length >= 3 ? "" : "3 o 4 dígitos"),
    ];
    if (!ok.every(Boolean)) return;
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true; btn.innerHTML = `<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"></span> Procesando…`;
    setTimeout(() => {
      const tickets = store.get<Ticket[]>("tickets", []);
      cart.seats.forEach((s, i) => tickets.unshift({ id: `${ev.id}-${Date.now()}-${i}`, ev: ev.id, seat: s.label, code: `HT-${Math.random().toString(16).slice(2, 8).toUpperCase()}`, at: Date.now() }));
      store.set("tickets", tickets);
      store.set("cart", null);
      $("#done-art")!.innerHTML = $<HTMLTemplateElement>(`template[data-poster="${ev.id}"]`)?.innerHTML ?? "";
      $("#done-title")!.textContent = ev.t; $("#done-meta")!.textContent = `${ev.v} · ${ev.d} · ${ev.time}`;
      $("#done-seats")!.textContent = `${cart.seats.length}×`;
      paintQR($("[data-qr='done']")!, tickets[0].code);
      go(3);
      setTimeout(() => {
        confetti($<HTMLCanvasElement>("#confetti")!, 0.5, 0.35);
        setTimeout(() => confetti($<HTMLCanvasElement>("#confetti")!, 0.2, 0.5, 120), 350);
        setTimeout(() => confetti($<HTMLCanvasElement>("#confetti")!, 0.8, 0.5, 120), 600);
        const p = $<SVGPathElement>("#ok-check")!; const l = p.getTotalLength?.() ?? 30;
        gsap.fromTo(p, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", delay: 0.2 });
        gsap.fromTo("#done-card", { rotationY: -90, y: 80, autoAlpha: 0 }, { rotationY: 0, y: 0, autoAlpha: 1, duration: 1.4, ease: "expo.out", transformPerspective: 1200, delay: 0.3 });
        toast("¡Compra realizada! Tu entrada está en tu cuenta", "🎟");
      }, 450);
    }, 1500);
  }, sig);
  void shake;
  footerFx();
}
