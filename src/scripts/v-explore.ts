import { gsap } from "gsap";
import { $, store } from "./util";
import { splitReveal, footerFx } from "./global";
import { setupFilters } from "./filters";

export function init(sig: AbortSignal) {
  const root = $("#v-eventos")!;
  const pending = store.get<string>("pendingQ", "");
  store.set("pendingQ", "");
  setupFilters({
    root, sig, itemSel: ".xev", catSel: ".xcat",
    countEl: $("#xcount"), emptyEl: $("#xempty"),
    q: $<HTMLInputElement>("#xq"), city: $<HTMLSelectElement>("#xcity"), sort: $<HTMLSelectElement>("#xsort"),
    initialQ: pending,
  });
  gsap.fromTo(".xev", { y: 80, autoAlpha: 0, scale: 0.92 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1, stagger: 0.07, ease: "power4.out", delay: 0.2 });
  splitReveal(root);
  footerFx();
}
