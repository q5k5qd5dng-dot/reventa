import { gsap } from "gsap";
import { $, $$, on, toast } from "./util";
import { bindAll, splitReveal, footerFx, reveal } from "./global";
import { setErr, clearErr } from "./forms";

export function init(sig: AbortSignal) {
  const root = $("#v-ayuda")!;
  bindAll(root, sig);
  const q = $<HTMLInputElement>("#helpq")!, items = $$("#helplist details"), empty = $("#helpempty")!;
  const filter = () => {
    const t = q.value.trim().toLowerCase();
    let n = 0;
    items.forEach((d) => { const ok = !t || d.dataset.q!.includes(t); d.classList.toggle("hidden", !ok); if (ok) n++; if (ok && t) d.open = n === 1; });
    empty.classList.toggle("hidden", n > 0);
  };
  on(q, "input", filter, sig);
  $$("[data-help-topic]", root).forEach((t) => on(t, "click", (e: Event) => { e.preventDefault(); q.value = t.querySelector("h3")!.textContent!.split(" ")[0].toLowerCase(); filter(); $("#helplist")!.scrollIntoView({ behavior: "smooth", block: "center" }); }, sig));
  items.forEach((d) => on(d, "toggle", () => { const p = d.querySelector("p"); if (d.open && p) gsap.fromTo(p, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }); }, sig));
  on($("#contact"), "submit", (e: Event) => {
    e.preventDefault(); const f = e.currentTarget as HTMLElement; clearErr(f);
    const em = $<HTMLInputElement>("#h-email")!, m = $<HTMLInputElement>("#h-msg")!;
    const a = setErr(em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value) ? "" : "Email no válido"), b = setErr(m, m.value.trim().length > 4 ? "" : "Cuéntanos un poco más");
    if (a && b) { toast("Mensaje enviado. Te respondemos en menos de 24 h", "✉"); em.value = m.value = ""; }
  }, sig);
  reveal("[data-help-topic]", root, { stagger: 0.1 });
  splitReveal(root);
  footerFx();
}
