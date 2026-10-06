import { gsap } from "gsap";
import { animate } from "motion";
import { $, $$, on, toast, store, shake, paintQR, fine, reduced } from "./util";
import { bindAll } from "./global";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const setErr = (input: HTMLInputElement, msg: string) => {
  const f = input.closest(".field")!;
  f.classList.toggle("err", !!msg);
  (f.querySelector(".msg") as HTMLElement).textContent = msg;
  if (msg) shake(f as HTMLElement);
  return !msg;
};
export const clearErr = (form: HTMLElement) => $$(".field.err", form).forEach((f) => { f.classList.remove("err"); (f.querySelector(".msg") as HTMLElement).textContent = ""; });

export function init(sig: AbortSignal, mode: "login" | "register") {
  const root = $("#v-login")!;
  bindAll(root, sig);
  $$("[data-qr]", root).forEach((q) => paintQR(q, q.dataset.qr!));
  const forms = { login: $("#f-login")!, register: $("#f-register")!, forgot: $("#f-forgot")! };
  const pill = $("#auth-pill")!;
  let cur: keyof typeof forms = "login";

  const show = (k: keyof typeof forms, first = false) => {
    const prev = forms[cur], next = forms[k];
    const tab = k === "register" ? 1 : 0;
    $$("[data-auth]", root).forEach((b, i) => { b.classList.toggle("text-black", i === tab); b.classList.toggle("text-white/70", i !== tab); });
    animate(pill, { x: tab ? "100%" : "0%" }, { type: "spring", stiffness: 300, damping: 26 });
    if (first || prev === next) { Object.values(forms).forEach((f) => f.classList.add("hidden")); next.classList.remove("hidden"); }
    else {
      gsap.to(prev, { x: -30, autoAlpha: 0, duration: 0.25, onComplete: () => { prev.classList.add("hidden"); gsap.set(prev, { clearProps: "all" }); next.classList.remove("hidden"); gsap.fromTo(next, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }); stag(next); } });
    }
    cur = k;
    if (first) stag(next);
  };
  const stag = (f: HTMLElement) => gsap.fromTo(f.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.06, ease: "power3.out", delay: 0.05 });
  $$("[data-auth]", root).forEach((b) => on(b, "click", () => show(b.dataset.auth as "login" | "register"), sig));
  on($("[data-forgot]"), "click", () => show("forgot"), sig);
  on($("[data-back]"), "click", () => show("login"), sig);
  show(mode, true);

  // ver/ocultar contraseña
  $$("[data-eye]", root).forEach((b) => on(b, "click", () => { const i = b.parentElement!.querySelector("input")!; const t = i.type === "password"; i.type = t ? "text" : "password"; b.textContent = t ? "OCULTAR" : "VER"; }, sig));
  // fuerza de contraseña
  const rp = $<HTMLInputElement>("#r-pass")!;
  on(rp, "input", () => {
    const v = rp.value; let s = 0;
    if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
    $$(".strength i", root).forEach((b, i) => (b.style.background = i < s ? ["#ff3d9a", "#ffb020", "#c6ff3d", "#22d3ee"][s - 1] : ""));
  }, sig);
  // sociales
  $$("[data-social]", root).forEach((b) => on(b, "click", () => toast(`Demo: inicio con ${b.dataset.social} no disponible`, "i"), sig));

  const done = (name: string, email: string) => {
    store.set("user", { name, email });
    dispatchEvent(new Event("ht:user"));
    toast(`¡Bienvenido, ${name.split(" ")[0]}!`, "👋");
    const next = store.get<string>("next", "#/cuenta");
    store.set("next", "");
    location.hash = next || "#/cuenta";
  };
  on(forms.login, "submit", (e: Event) => {
    e.preventDefault(); clearErr(forms.login);
    const em = $<HTMLInputElement>("#l-email")!, pw = $<HTMLInputElement>("#l-pass")!;
    const a = setErr(em, emailOk(em.value) ? "" : "Introduce un email válido"), b = setErr(pw, pw.value.length >= 6 ? "" : "Mínimo 6 caracteres");
    if (a && b) done(em.value.split("@")[0].replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase()), em.value);
  }, sig);
  on(forms.register, "submit", (e: Event) => {
    e.preventDefault(); clearErr(forms.register);
    const n = $<HTMLInputElement>("#r-name")!, em = $<HTMLInputElement>("#r-email")!, pw = $<HTMLInputElement>("#r-pass")!, t = $<HTMLInputElement>("#r-terms")!;
    const ok = [setErr(n, n.value.trim().length >= 2 ? "" : "Dinos tu nombre"), setErr(em, emailOk(em.value) ? "" : "Introduce un email válido"), setErr(pw, pw.value.length >= 8 ? "" : "Mínimo 8 caracteres")];
    if (!t.checked) { shake(t.parentElement as HTMLElement); toast("Acepta los términos para continuar", "!"); ok.push(false); }
    if (ok.every(Boolean)) done(n.value.trim(), em.value);
  }, sig);
  on(forms.forgot, "submit", (e: Event) => {
    e.preventDefault(); clearErr(forms.forgot);
    const em = $<HTMLInputElement>("#f-email")!;
    if (setErr(em, emailOk(em.value) ? "" : "Introduce un email válido")) { toast("Te hemos enviado el enlace (demo)", "✉"); show("login"); }
  }, sig);

  // ticket flotante del panel
  const card = $("#auth-card")!;
  if (fine && !reduced) {
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" }), ry = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });
    gsap.set(card, { transformPerspective: 1200 });
    on(root, "pointermove", (e: PointerEvent) => { ry((e.clientX / innerWidth - 0.35) * 40); rx(-(e.clientY / innerHeight - 0.5) * 26); card.style.setProperty("--hx", String(Math.round((e.clientX / innerWidth) * 360))); }, sig);
  }
  gsap.fromTo("#auth-ticket", { y: 120, rotationY: -60, autoAlpha: 0 }, { y: 0, rotationY: 0, autoAlpha: 1, duration: 1.5, ease: "expo.out" });
  if (!reduced) gsap.to("#auth-ticket", { y: -14, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
}
