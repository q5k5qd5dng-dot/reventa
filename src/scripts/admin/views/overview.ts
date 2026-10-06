import { get, ico, esc, eur, eurK, int, pct, dshort, ago, avatar, CAT } from "../util";
import { lineChart, sparkline, donut, hbars } from "../charts";
import { seg, bindSeg, delta, countUp, stagger, status, fail } from "../ui";
import type { Ctx } from "../main";

const RANGES: [string, string][] = [["7", "7 días"], ["30", "30 días"], ["90", "90 días"], ["365", "12 meses"]];

export async function render(host: HTMLElement, ctx: Ctx) {
  host.innerHTML = `<div class="ph"><div><h1>${greet()}, ${esc(ctx.user.name.split(" ")[0])}</h1><p>Esto es lo que ha pasado en Handticket <span class="live" style="margin-left:.5rem"><i></i>En directo</span></p></div><div class="row gap-2 wrap">${seg(RANGES, String(ctx.days), "rng")}<a class="btn" href="/api/admin/orders.csv">${ico("dl")}Exportar pedidos</a></div></div><div id="ov">${skeleton()}</div>`;
  bindSeg(host.querySelector("#rng")!, (v) => ctx.setDays(+v));
  try {
    const d = await get("/api/admin/overview", { days: ctx.days }); paint(host.querySelector("#ov")!, d, ctx);
  } catch (e) { fail(e); }
}
const greet = () => { const h = new Date().getHours(); return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches"; };
const skeleton = () => `<div class="grid g5">${Array.from({ length: 5 }, () => `<div class="card kpi"><div class="skel" style="height:.9rem;width:50%"></div><div class="skel mt-2" style="height:1.8rem;width:70%"></div><div class="skel mt-2" style="height:.8rem;width:40%"></div></div>`).join("")}</div><div class="card mt-3" style="height:22rem"></div>`;

function paint(el: HTMLElement, d: any, ctx: Ctx) {
  const c = d.cur, p = d.prev, S = d.series as any[];
  const k = (key: string) => S.map((s) => s[key]);
  const KP: [string, string, number, number, (n: number) => string, string, string, number[], boolean?, string?][] = [
    ["Volumen (GMV)", "money", c.gmv, p.gmv, (n) => eur(n, 0), "Entradas vendidas en el marketplace", "var(--c1)", k("gmv")],
    ["Ingresos Handticket", "wallet", c.revenue, p.revenue, (n) => eur(n, 0), `${eur(c.netRevenue, 0)} netos de IVA`, "var(--c3)", k("revenue")],
    ["Pedidos", "cart", c.orders, p.orders, (n) => int(n), `${int(c.tickets)} entradas`, "var(--c2)", k("orders")],
    ["Ticket medio", "target", c.aov, p.aov, (n) => eur(n, 2), "Por pedido", "var(--c4)", k("gmv").map((g, i) => (S[i].orders ? g / S[i].orders : 0))],
    ["Take rate", "percent", c.takeRate * 100, p.takeRate * 100, (n) => n.toFixed(1).replace(".", ",") + " %", "Ingresos / GMV", "var(--c6)", k("revenue").map((r, i) => (S[i].gmv ? (r / S[i].gmv) * 100 : 0))],
    ["Nuevos usuarios", "users", c.newUsers, p.newUsers, (n) => int(n), `${int(c.buyers)} han comprado`, "var(--c5)", k("users")],
    ["Anuncios publicados", "ticket", c.newListings, p.newListings, (n) => int(n), `${int(d.live.activeListings)} activos ahora`, "var(--c2)", k("listings")],
    ["Reembolsos", "ref", c.refunds, p.refunds, (n) => int(n), `${pct(c.refundRate)} de los pedidos`, "var(--c7)", [], true],
    ["Compradores únicos", "users", c.buyers, p.buyers, (n) => int(n), c.buyers ? `${(c.orders / c.buyers).toFixed(2).replace(".", ",")} pedidos / comprador` : "", "var(--c3)", []],
    ["Dinero retenido", "shield", d.live.held, d.live.held, (n) => eur(n, 0), "Pendiente de pagar a vendedores", "var(--c8)", []],
  ];
  const card = ([l, i, v, pv, f, sub, col, sp, inv]: (typeof KP)[number], idx: number) => `<div class="card kpi ${sp.length > 2 ? "has-sp" : ""}" data-k="${idx}"><div class="lbl">${l}<span class="ico" style="background:color-mix(in srgb,${col} 14%,transparent);color:${col}">${ico(i)}</span></div><div class="val" data-v="${v}">${f(v)}</div><div class="foot"><span class="trunc">${sub}</span>${idx === 9 ? "" : delta(v, pv, inv)}</div>${sp.length > 2 ? sparkline(sp, col) : ""}</div>`;
  const alerts = d.alerts, chips = [
    alerts.payoutsDue ? `<a class="badge acc" href="#/payouts" style="height:2rem;padding:0 .9rem">${alerts.payoutsDue} liquidaciones listas · ${eur(alerts.payoutsDueAmount, 0)}</a>` : "",
    alerts.tickets ? `<a class="badge warn" href="#/support" style="height:2rem;padding:0 .9rem">${alerts.tickets} tickets de soporte abiertos</a>` : "",
    alerts.risk ? `<a class="badge bad" href="#/risk" style="height:2rem;padding:0 .9rem">${alerts.risk} alertas de riesgo</a>` : "",
  ].filter(Boolean).join("");
  const t = d.live.today;
  el.innerHTML = `${chips ? `<div class="row gap-2 wrap" style="margin-bottom:1.1rem">${chips}</div>` : ""}<div class="grid g5" id="kp">${KP.slice(0, 5).map((r, i) => card(r, i)).join("")}</div>
  <div class="grid g5" style="margin-top:1.1rem">${KP.slice(5).map((r, i) => card(r, i + 5)).join("")}</div>
  <div class="grid g-main mt-3"><div class="card"><div class="card-h"><div><h3>Rendimiento</h3><small>Últimos ${d.days} días</small></div>${seg([["sales", "Ventas e ingresos"], ["orders", "Pedidos"], ["growth", "Crecimiento"]], "sales", "mt")}</div><div class="card-b"><div id="main-chart"></div><div class="legend mt-2" id="main-legend"></div></div></div>
  <div class="grid" style="gap:1.1rem;align-content:start"><div class="card pad"><div class="row between"><b>Hoy</b><span class="live"><i></i>Tiempo real</span></div><div class="grid g2 mt-2" style="gap:.8rem"><div><div class="muted xs">Volumen</div><div class="b" style="font-size:1.35rem" id="t-gmv">${eur(t.gmv, 0)}</div></div><div><div class="muted xs">Pedidos</div><div class="b" style="font-size:1.35rem">${t.orders}</div></div><div><div class="muted xs">Ingresos</div><div class="b" style="font-size:1.1rem">${eur(t.revenue, 0)}</div></div><div><div class="muted xs">Altas</div><div class="b" style="font-size:1.1rem">${t.newUsers}</div></div></div></div>
  <div class="card"><div class="card-h"><h3>Eventos que más venden</h3><a class="btn sm ghost" href="#/events">Ver todos</a></div><div class="card-b"><div class="list">${d.top.map((e: any, i: number) => `<div><span class="rank">${i + 1}</span><div class="grow"><div class="trunc b">${esc(e.name)}</div><div class="muted xs">${esc(e.city)} · ${int(e.tickets)} entradas</div></div><b class="num">${eurK(e.gmv)}</b></div>`).join("") || '<p class="muted">Sin ventas en el periodo</p>'}</div></div></div></div></div>
  <div class="grid g3 mt-3"><div class="card"><div class="card-h"><div><h3>Ventas por categoría</h3><small>Reparto del GMV</small></div></div><div class="card-b" id="cat"></div></div><div class="card"><div class="card-h"><div><h3>Ciudades</h3><small>Top por volumen</small></div></div><div class="card-b">${hbars(d.byCity.map((c: any) => ({ k: c.k, v: c.gmv, sub: `${c.n} ped.` })), (n) => eurK(n), "var(--c2)")}</div></div><div class="card"><div class="card-h"><div><h3>Últimos pedidos</h3><small>Actividad reciente</small></div><a class="btn sm ghost" href="#/orders">Ver todos</a></div><div class="card-b"><div class="list">${d.recent.map((o: any) => `<a href="#/orders/${o.id}" style="color:inherit">${avatar(o.buyer, "sm")}<div class="grow"><div class="trunc b" style="font-size:13px">${esc(o.buyer)}</div><div class="muted xs trunc">${esc(o.event)} · ${ago(o.created_at)}</div></div><div class="r"><b class="num sm">${eur(o.total, 2)}</b><div>${status(o.status)}</div></div></a>`).join("")}</div></div></div></div>`;
  // animaciones y gráficos
  el.querySelectorAll<HTMLElement>(".kpi .val").forEach((v) => { const i = +v.closest<HTMLElement>(".kpi")!.dataset.k!; countUp(v, +v.dataset.v!, KP[i][4]); });
  stagger(".kpi", el); stagger(".card.pad, .card-h", el);
  const draw = (m: string) => {
    const host = el.querySelector<HTMLElement>("#main-chart")!, labels = S.map((s) => dshort(s.d)), L = el.querySelector("#main-legend")!;
    const sets: Record<string, any> = {
      sales: { series: [{ name: "Volumen", color: "#e8590c", data: k("gmv"), fmt: (n: number) => eur(n, 0) }, { name: "Ingresos", color: "#12a05c", data: k("revenue"), fmt: (n: number) => eur(n, 0) }], y: (n: number) => (n >= 1000 ? n / 1000 + "k" : String(Math.round(n))) },
      orders: { mode: "bars", series: [{ name: "Pedidos", color: "#2563eb", data: k("orders"), fmt: int }, { name: "Entradas", color: "#c7d7ff", data: k("tickets"), fmt: int }], y: (n: number) => String(Math.round(n)) },
      growth: { mode: "bars", series: [{ name: "Usuarios nuevos", color: "#7c4dff", data: k("users"), fmt: int }, { name: "Anuncios nuevos", color: "#f5a524", data: k("listings"), fmt: int }], y: (n: number) => String(Math.round(n)) },
    };
    const s = sets[m]; lineChart(host, { labels, series: s.series, yFmt: s.y, mode: s.mode, height: innerWidth > 1280 ? 400 : 300 });
    L.innerHTML = s.series.map((x: any) => `<span><i style="background:${x.color}"></i>${x.name}</span>`).join("");
  };
  draw("sales"); bindSeg(el.querySelector("#mt")!, draw);
  const cats = d.byCat.map((c: any) => ({ k: CAT[c.k] ?? c.k, v: c.gmv })); donut(el.querySelector("#cat")!, cats, (n) => eurK(n), { top: eurK(c.gmv), bottom: "GMV" });
}
