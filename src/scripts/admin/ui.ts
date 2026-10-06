import { animate, spring } from "motion";
import { $, $$, esc, ico, debounce, reduced, ApiErr, qs } from "./util";

/* ═════ Toast ═════ */
export function toast(msg: string, kind: "ok" | "bad" | "" = "ok") {
  const host = $("#toasts")!, t = document.createElement("div");
  t.className = `toast ${kind}`; t.innerHTML = `${ico(kind === "bad" ? "alert" : "check")}<span>${esc(msg)}</span>`; host.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 200); }, 3800);
}
export const fail = (e: unknown) => toast(e instanceof ApiErr || e instanceof Error ? e.message : "Algo ha fallado", "bad");

/* ═════ Capas ═════ */
let layer: { close: () => void } | null = null;
function scrim(onClose: () => void) { const s = document.createElement("div"); s.className = "scrim"; document.body.appendChild(s); requestAnimationFrame(() => s.classList.add("on")); s.addEventListener("click", onClose); return s; }
export function closeLayer() { layer?.close(); }
addEventListener("keydown", (e) => { if (e.key === "Escape") closeLayer(); });

export function drawer(opts: { title: string; sub?: string; body: string; footer?: string; mount?: (el: HTMLElement, close: () => void) => void }) {
  closeLayer();
  const el = document.createElement("aside"); el.className = "drawer"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="drawer-h"><div><h2>${esc(opts.title)}</h2>${opts.sub ? `<p class="muted sm">${opts.sub}</p>` : ""}</div><button class="icon-btn" data-x aria-label="Cerrar">${ico("x")}</button></div><div class="drawer-b">${opts.body}</div>${opts.footer ? `<div class="drawer-f">${opts.footer}</div>` : ""}`;
  document.body.appendChild(el);
  const close = () => { s.classList.remove("on"); el.classList.remove("on"); layer = null; setTimeout(() => { s.remove(); el.remove(); }, 320); };
  const s = scrim(close); layer = { close }; requestAnimationFrame(() => el.classList.add("on"));
  $("[data-x]", el)!.addEventListener("click", close); opts.mount?.(el, close); (el.querySelector("input,textarea,select,button.pri") as HTMLElement | null)?.blur();
  return { el, close };
}
export function modal(opts: { html: string; footer?: string; wide?: boolean; mount?: (el: HTMLElement, close: () => void) => void }) {
  closeLayer();
  const el = document.createElement("div"); el.className = `modal ${opts.wide ? "wide" : ""}`; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="modal-b">${opts.html}</div>${opts.footer ? `<div class="modal-f">${opts.footer}</div>` : ""}`; document.body.appendChild(el);
  const close = () => { s.classList.remove("on"); el.classList.remove("on"); layer = null; setTimeout(() => { s.remove(); el.remove(); }, 220); };
  const s = scrim(close); s.style.zIndex = "94"; layer = { close }; requestAnimationFrame(() => el.classList.add("on"));
  if (!reduced) animate(el, { scale: [0.96, 1] }, { type: spring, stiffness: 380, damping: 26 });
  opts.mount?.(el, close); setTimeout(() => el.querySelector<HTMLElement>("input,textarea,select")?.focus(), 80);
  return { el, close };
}
/** Confirmación (con motivo opcional). Devuelve el motivo o null si se cancela. */
export function confirmDialog(o: { title: string; text: string; ok: string; danger?: boolean; reason?: boolean | string }) {
  return new Promise<string | null>((res) => {
    let done = false; const fin = (v: string | null) => { if (!done) { done = true; res(v); } };
    const m = modal({
      html: `<div class="ic" style="${o.danger ? "" : "background:var(--accent-soft);color:var(--accent)"}">${ico("alert")}</div><h3>${esc(o.title)}</h3><p class="d">${o.text}</p>${o.reason ? `<div class="field mt-2"><label>${typeof o.reason === "string" ? esc(o.reason) : "Motivo (opcional)"}</label><textarea class="textarea" id="cd-r" rows="2" style="min-height:4.5rem"></textarea></div>` : ""}`,
      footer: `<button class="btn" data-c>Cancelar</button><button class="btn ${o.danger ? "bad solid" : "pri"}" data-ok>${esc(o.ok)}</button>`,
      mount: (el, close) => { $("[data-c]", el)!.addEventListener("click", () => { close(); fin(null); }); $("[data-ok]", el)!.addEventListener("click", () => { const v = ($("#cd-r", el) as HTMLTextAreaElement | null)?.value ?? ""; close(); fin(v); }); },
    });
    new MutationObserver((_, ob) => { if (!document.body.contains(m.el)) { ob.disconnect(); fin(null); } }).observe(document.body, { childList: true });
  });
}

/* ═════ Componentes ═════ */
export const badge = (t: string, kind = "") => `<span class="badge ${kind}">${esc(t)}</span>`;
export const STATUS: Record<string, [string, string]> = {
  paid: ["Pagado", "ok"], refunded: ["Reembolsado", "bad"], pending: ["Pendiente", "warn"], failed: ["Fallido", "bad"],
  active: ["Activo", "ok"], sold: ["Vendido", "info"], removed: ["Retirado", "plain"], cancelled: ["Cancelado", "bad"],
  held: ["Retenido", "warn"], released: ["Liberado", "info"], payout_paid: ["Pagado", "ok"], due: ["Listo para liberar", "acc"],
  open: ["Abierto", "warn"], solved: ["Resuelto", "ok"], valid: ["Válida", "ok"], void: ["Anulada", "bad"],
  service: ["Gastos de gestión", "info"], commission: ["Comisión", "violet"], credit: ["Abono", "bad"],
  high: ["Alta", "bad"], medium: ["Media", "warn"], low: ["Baja", "info"], normal: ["Normal", "plain"],
};
export const status = (s: string, override?: string) => { const [t, k] = STATUS[override ?? s] ?? [s, ""]; return badge(t, k); };
export function delta(cur: number, prev: number, invert = false) {
  if (!prev && !cur) return `<span class="delta flat">—</span>`; if (!prev) return `<span class="delta up">${ico("up")}nuevo</span>`;
  const d = (cur - prev) / Math.abs(prev), good = invert ? d < 0 : d > 0, flat = Math.abs(d) < 0.005;
  return `<span class="delta ${flat ? "flat" : good ? "up" : "down"}">${flat ? "" : ico(d > 0 ? "up" : "down")}${(Math.abs(d) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span>`;
}
export const empty = (t: string, d = "", icon = "search") => `<div class="empty"><div><div class="ico" style="margin-inline:auto">${ico(icon)}</div><b>${esc(t)}</b>${esc(d)}</div></div>`;
export const seg = (opts: [string, string][], cur: string, id = "") => `<div class="seg" ${id ? `id="${id}"` : ""} role="tablist">${opts.map(([v, l]) => `<button data-v="${v}" class="${v === cur ? "on" : ""}" role="tab">${esc(l)}</button>`).join("")}</div>`;
export function bindSeg(root: HTMLElement, onChange: (v: string) => void) {
  root.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>("button[data-v]"); if (!b) return; $$("button", root).forEach((x) => x.classList.toggle("on", x === b)); onChange(b.dataset.v!); });
}
export function countUp(el: HTMLElement, to: number, fmt: (n: number) => string, dur = 0.9) {
  if (reduced) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - t0) / (dur * 1000)), e = 1 - (1 - p) ** 4; el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(to); }; requestAnimationFrame(tick);
}
export function stagger(sel: string, root: ParentNode = document) {
  if (reduced) return; const els = [...root.querySelectorAll<HTMLElement>(sel)];
  els.forEach((e, i) => e.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 520, delay: i * 55, easing: "cubic-bezier(.3,.8,.3,1)", fill: "backwards" }));
}

/* ═════ Tabla de datos con filtros, orden y paginación ═════ */
export interface Col<R> { key: string; label: string; sort?: string; r?: boolean; render: (r: R) => string; w?: string }
export interface Filter { key: string; type: "search" | "select" | "date"; placeholder?: string; options?: [string, string][]; value?: string }
export interface TableCfg<R> {
  host: HTMLElement; cols: Col<R>[]; filters?: Filter[]; size?: number; sort?: string; dir?: "asc" | "desc";
  load: (p: Record<string, unknown>) => Promise<{ rows: R[]; total: number; [k: string]: any }>;
  onRow?: (r: R) => void; extra?: string; bindExtra?: (root: HTMLElement) => void; summary?: (res: any) => string; selectable?: boolean; emptyText?: [string, string];
  exportUrl?: (p: Record<string, unknown>) => string; actions?: (r: R) => string; onActions?: (act: string, r: R) => void; onSelect?: (rows: R[]) => void; bulk?: string;
}
export function dataTable<R extends { id?: string }>(c: TableCfg<R>) {
  const st: Record<string, any> = { page: 1, size: c.size ?? 20, sort: c.sort, dir: c.dir ?? "desc" };
  c.filters?.forEach((f) => (st[f.key] = f.value ?? ""));
  let rows: R[] = [], total = 0, seq = 0; const sel = new Set<string>();
  c.host.innerHTML = `<div class="tools">${(c.filters ?? []).map((f) => f.type === "search" ? `<div class="search"><span>${ico("search")}</span><input class="input" data-f="${f.key}" placeholder="${esc(f.placeholder ?? "Buscar…")}" value="${esc(f.value ?? "")}"/></div>` : f.type === "date" ? `<input type="date" class="input" data-f="${f.key}" title="${esc(f.placeholder ?? "")}" aria-label="${esc(f.placeholder ?? "")}"/>` : `<select class="select" data-f="${f.key}">${f.options!.map(([v, l]) => `<option value="${v}" ${v === (f.value ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`).join("")}<span class="grow"></span><span class="bulk-slot row gap-2">${c.bulk ?? ""}</span>${c.extra ?? ""}${c.exportUrl ? `<button class="btn sm" data-export>${ico("dl")}Exportar CSV</button>` : ""}</div><div class="sum-slot"></div><div class="tw"><table class="t"><thead></thead><tbody></tbody></table></div><div class="pager"></div>`;
  const thead = $("thead", c.host)!, tbody = $("tbody", c.host)!, pager = $(".pager", c.host)!, sumSlot = $(".sum-slot", c.host)!;
  const head = () => (thead.innerHTML = `<tr>${c.selectable ? `<th style="width:2.4rem"><input type="checkbox" class="chk" data-all/></th>` : ""}${c.cols.map((k) => `<th class="${k.sort ? "sort" : ""} ${k.r ? "r" : ""} ${st.sort === k.sort ? "on" : ""}" ${k.sort ? `data-s="${k.sort}"` : ""} ${k.w ? `style="width:${k.w}"` : ""}>${esc(k.label)}${k.sort ? `<span class="ar">${st.sort === k.sort && st.dir === "asc" ? "↑" : "↓"}</span>` : ""}</th>`).join("")}${c.actions ? "<th></th>" : ""}</tr>`);
  const skeleton = () => (tbody.innerHTML = Array.from({ length: Math.min(8, st.size) }, () => `<tr>${c.cols.concat(c.selectable ? [{} as Col<R>] : []).map(() => `<td><div class="skel" style="height:1rem;width:${50 + Math.random() * 40}%"></div></td>`).join("")}${c.actions ? "<td></td>" : ""}</tr>`).join(""));
  const params = () => ({ page: st.page, size: st.size, sort: st.sort, dir: st.dir, ...Object.fromEntries((c.filters ?? []).map((f) => [f.key, st[f.key]])) });
  async function load() {
    const my = ++seq; head(); if (!rows.length) skeleton();
    try {
      const res = await c.load(params()); if (my !== seq) return; rows = res.rows; total = res.total;
      sumSlot.innerHTML = c.summary ? c.summary(res) : ""; paint();
    } catch (e) { fail(e); tbody.innerHTML = `<tr><td colspan="99">${empty("No se han podido cargar los datos", "Inténtalo de nuevo", "alert")}</td></tr>`; }
  }
  function paint() {
    const pages = Math.max(1, Math.ceil(total / st.size));
    if (!rows.length) tbody.innerHTML = `<tr><td colspan="99">${empty(c.emptyText?.[0] ?? "Sin resultados", c.emptyText?.[1] ?? "Prueba con otros filtros")}</td></tr>`;
    else {
      tbody.innerHTML = rows.map((r, i) => `<tr class="${c.onRow ? "click" : ""}" data-i="${i}">${c.selectable ? `<td><input type="checkbox" class="chk" data-sel="${r.id}" ${sel.has(r.id!) ? "checked" : ""}/></td>` : ""}${c.cols.map((k) => `<td class="${k.r ? "r num" : ""}">${k.render(r)}</td>`).join("")}${c.actions ? `<td>${c.actions(r)}</td>` : ""}</tr>`).join("");
      if (!reduced) tbody.querySelectorAll("tr").forEach((tr, i) => tr.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 300, delay: Math.min(i, 12) * 22, fill: "backwards" }));
    }
    const from = total ? (st.page - 1) * st.size + 1 : 0, to = Math.min(total, st.page * st.size);
    const nums: (number | "…")[] = []; for (let p = 1; p <= pages; p++) if (p === 1 || p === pages || Math.abs(p - st.page) <= 1) nums.push(p); else if (nums.at(-1) !== "…") nums.push("…");
    pager.innerHTML = `<span>${from}–${to} de ${total.toLocaleString("es-ES")}</span><div class="row gap-2"><select class="select" data-size style="height:2rem;width:auto;padding-block:0">${[10, 20, 50, 100].map((n) => `<option ${n === st.size ? "selected" : ""} value="${n}">${n} / pág.</option>`).join("")}</select><div class="pg"><button data-p="${st.page - 1}" ${st.page <= 1 ? "disabled" : ""} aria-label="Anterior">${ico("left")}</button>${nums.map((n) => (n === "…" ? `<button disabled>…</button>` : `<button data-p="${n}" class="${n === st.page ? "on" : ""}">${n}</button>`)).join("")}<button data-p="${st.page + 1}" ${st.page >= pages ? "disabled" : ""} aria-label="Siguiente">${ico("chev")}</button></div></div>`;
    c.onSelect?.(rows.filter((r) => sel.has(r.id!)));
  }
  c.host.addEventListener("input", debounce((e: Event) => { const t = e.target as HTMLInputElement; if (t.dataset.f && t.tagName === "INPUT" && t.type !== "date") { st[t.dataset.f] = t.value; st.page = 1; load(); } }, 280));
  c.host.addEventListener("change", (e) => { const t = e.target as HTMLInputElement | HTMLSelectElement; if (t.dataset.f && (t.tagName === "SELECT" || (t as HTMLInputElement).type === "date")) { st[t.dataset.f] = t.value; st.page = 1; load(); } if (t.dataset.size) { st.size = +t.value; st.page = 1; load(); } if (t.dataset.all !== undefined) { rows.forEach((r) => ((t as HTMLInputElement).checked ? sel.add(r.id!) : sel.delete(r.id!))); paint(); } if (t.dataset.sel) { (t as HTMLInputElement).checked ? sel.add(t.dataset.sel) : sel.delete(t.dataset.sel); c.onSelect?.(rows.filter((r) => sel.has(r.id!))); } });
  c.host.addEventListener("click", (e) => {
    const t = e.target as HTMLElement, th = t.closest<HTMLElement>("th[data-s]"), pg = t.closest<HTMLElement>("[data-p]"), ex = t.closest("[data-export]"), act = t.closest<HTMLElement>("[data-act]"), tr = t.closest<HTMLElement>("tbody tr[data-i]");
    if (th) { const s = th.dataset.s!; st.dir = st.sort === s && st.dir === "desc" ? "asc" : "desc"; st.sort = s; st.page = 1; load(); }
    else if (pg && !pg.hasAttribute("disabled")) { st.page = +pg.dataset.p!; load(); c.host.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
    else if (ex) location.href = c.exportUrl!(params());
    else if (act && tr) { e.stopPropagation(); c.onActions?.(act.dataset.act!, rows[+tr.dataset.i!]); }
    else if (tr && c.onRow && !t.closest("input,button,a,select")) c.onRow(rows[+tr.dataset.i!]);
  });
  c.bindExtra?.(c.host); load();
  return { reload: load, selected: () => rows.filter((r) => sel.has(r.id!)), clearSel: () => { sel.clear(); paint(); }, params };
}
export { qs };
