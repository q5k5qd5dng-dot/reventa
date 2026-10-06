import { get, post, ico, esc, eur, int, dt, ago, avatar, qs } from "../util";
import { dataTable, status, badge, toast, fail, confirmDialog, stagger } from "../ui";
import type { Ctx } from "../main";

const head = (t: string, p: string, extra = "") => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div><div class="row gap-2 wrap">${extra}</div></div>`;

/* ═════ Liquidaciones ═════ */
export async function payouts(host: HTMLElement, _ctx: Ctx) {
  host.innerHTML = head("Liquidaciones", "Dinero retenido y pagos a vendedores tras el evento", `<a class="btn" href="/api/admin/payouts.csv?status=released">${ico("dl")}Remesa de transferencias</a>`) + `<div class="grid g4" id="ps"></div><div class="alert info mt-3">${ico("shield")}<div><b>Cómo funciona</b><p>El importe de cada venta queda <b>retenido</b> hasta pasados unos días del evento. Entonces pasa a <b>listo</b>, lo <b>liberas</b>, descargas la remesa y, tras ordenar las transferencias, lo marcas como <b>pagado</b>.</p></div></div><div class="card mt-3" id="tb"></div>`;
  let sel: any[] = [], t: ReturnType<typeof dataTable<any>>;
  const cards = (s: any) => { host.querySelector("#ps")!.innerHTML = [["Retenido", s.held, "clock", "warn", "Aún no liberable"], ["Listo para liberar", s.due, "check", "acc", "El evento ya pasó"], ["Liberado", s.released, "wallet", "info", "Pendiente de transferir"], ["Pagado", s.paid, "money", "ok", "Transferido a vendedores"]].map(([l, v, i, k, sub]: any) => `<div class="card kpi"><div class="lbl">${l}<span class="ico">${ico(i)}</span></div><div class="val">${eur(v, 0)}</div><div class="foot"><span>${sub}</span></div></div>`).join(""); stagger(".kpi", host); };
  t = dataTable<any>({
    host: host.querySelector("#tb")!, selectable: true, sort: "release_at", dir: "asc",
    filters: [{ key: "status", type: "select", options: [["", "Todas"], ["due", "Listas para liberar"], ["held", "Retenidas"], ["released", "Liberadas"], ["paid", "Pagadas"], ["cancelled", "Canceladas"]], value: "due" }],
    load: async (p) => { const r = await get("/api/admin/payouts", p); cards(r.summary); return r; },
    bulk: `<button class="btn sm" data-bulk="release" disabled>Liberar</button><button class="btn sm pri" data-bulk="paid" disabled>Marcar como pagado</button>`,
    bindExtra: (root) => root.addEventListener("click", async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-bulk]"); if (!b) return; const ids = t.selected().map((r) => r.id);
      const ok = await confirmDialog({ title: b.dataset.bulk === "release" ? `Liberar ${ids.length} liquidaciones` : `Marcar ${ids.length} como pagadas`, text: b.dataset.bulk === "release" ? "Pasarán a estado «liberado» y aparecerán en la remesa." : "Confirma que ya has ordenado las transferencias bancarias.", ok: "Confirmar" });
      if (ok === null) return; try { const r = await post(`/api/admin/payouts/${b.dataset.bulk}`, { ids }); toast(`${r.released ?? r.paid} liquidaciones actualizadas`); t.clearSel(); t.reload(); } catch (er) { fail(er); }
    }),
    onSelect: (rows) => { sel = rows; host.querySelectorAll<HTMLButtonElement>("[data-bulk]").forEach((b) => (b.disabled = !rows.length)); void sel; },
    cols: [
      { key: "seller", label: "Vendedor", render: (r) => `<a class="who" href="#/users/${r.sid}">${avatar(r.seller, "sm")}<div class="trunc"><b>${esc(r.seller)}</b><small>${esc(r.email)}</small></div></a>` },
      { key: "code", label: "Pedido", render: (r) => `<span class="mono">${esc(r.code)}</span>` },
      { key: "holder", label: "Cuenta", render: (r) => (r.holder ? `${esc(r.holder)}<div class="muted xs">•••• ${esc(r.last4)}</div>` : badge("Sin IBAN", "bad")) },
      { key: "release", label: "Liberación", sort: "release_at", render: (r) => `${dt(r.release_at, false)}<div class="muted xs">${r.release_at > Date.now() ? "en " + Math.ceil((r.release_at - Date.now()) / 864e5) + " días" : "hace " + Math.floor((Date.now() - r.release_at) / 864e5) + " días"}</div>` },
      { key: "amount", label: "Importe", r: true, render: (r) => `<b>${eur(r.amount)}</b>` },
      { key: "status", label: "Estado", render: (r) => status(r.status === "paid" ? "payout_paid" : r.due ? "due" : r.status) },
    ],
  });
}

/* ═════ Facturación ═════ */
export async function invoices(host: HTMLElement) {
  host.innerHTML = head("Facturación", "Facturas emitidas, abonos y resumen de IVA por trimestre", `<a class="btn" id="exp" href="/api/admin/invoices.csv">${ico("dl")}Libro de facturas (CSV)</a>`) + `<div class="grid g4" id="is"></div><div class="grid g-main mt-3"><div class="card" id="tb" style="min-width:0"></div><div class="card" id="q"><div class="card-h"><div><h3>IVA por trimestre</h3><small>Base, cuota y total facturado</small></div></div><div class="card-b" id="qb"></div></div></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, sort: "created_at",
    filters: [{ key: "q", type: "search", placeholder: "Nº de factura, cliente…" }, { key: "kind", type: "select", options: [["", "Todos los tipos"], ["service", "Gastos de gestión"], ["commission", "Comisiones"], ["credit", "Abonos"]] }, { key: "from", type: "date", placeholder: "Desde" }, { key: "to", type: "date", placeholder: "Hasta" }],
    exportUrl: (p) => "/api/admin/invoices.csv?" + qs({ ...p, page: "", size: "" }),
    load: async (p) => {
      const r = await get("/api/admin/invoices", p);
      host.querySelector("#is")!.innerHTML = [["Base imponible", r.totals.base, "file"], ["IVA repercutido", r.totals.vat, "percent"], ["Total facturado", r.totals.total, "money"], ["Facturas", r.total, "log"]].map(([l, v, i]: any, k) => `<div class="card kpi"><div class="lbl">${l}<span class="ico">${ico(i)}</span></div><div class="val">${k === 3 ? int(v) : eur(v, 2)}</div><div class="foot"><span>Según los filtros activos</span></div></div>`).join("");
      host.querySelector("#qb")!.innerHTML = r.quarters.length ? `<table class="t"><thead><tr><th>Periodo</th><th class="r">Base</th><th class="r">IVA</th></tr></thead><tbody>${r.quarters.map((x: any) => `<tr><td><b>${x.year} T${x.qt}</b><div class="muted xs">${x.n} facturas</div></td><td class="r num">${eur(x.base, 0)}</td><td class="r num"><b>${eur(x.vat, 0)}</b></td></tr>`).join("")}</tbody></table>` : '<p class="muted">Sin facturas</p>';
      stagger(".kpi", host); return r;
    },
    onRow: (r) => window.open(`/api/admin/invoices/${r.id}/html`, "_blank"),
    cols: [
      { key: "number", label: "Nº", render: (r) => `<span class="mono b">${esc(r.number)}</span><div class="muted xs">${dt(r.at, false)}</div>` },
      { key: "kind", label: "Tipo", render: (r) => status(r.kind) },
      { key: "party", label: "Cliente", render: (r) => `<div class="trunc" style="max-width:13rem"><b style="font-weight:500">${esc(r.party)}</b><div class="muted xs">${esc(r.email ?? "")}</div></div>` },
      { key: "base", label: "Base", r: true, render: (r) => eur(r.base) },
      { key: "vat", label: "IVA", r: true, render: (r) => `${eur(r.vat)}<div class="muted xs">${Math.round(r.rate * 100)} %</div>` },
      { key: "total", label: "Total", r: true, render: (r) => `<b style="${r.total < 0 ? "color:var(--bad)" : ""}">${eur(r.total)}</b>` },
    ],
    actions: (r) => `<div class="acts"><a class="icon-btn" href="/api/admin/invoices/${r.id}/html" target="_blank" title="Ver / imprimir" onclick="event.stopPropagation()">${ico("ext")}</a></div>`,
  });
  void t; void ago;
}
