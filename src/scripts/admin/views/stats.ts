import { get, ico, esc, eur, eurK, int, pct, avatar, dshort } from "../util";
import { lineChart, heatmap, hbars, donut } from "../charts";
import { seg, bindSeg, stagger, fail } from "../ui";
import type { Ctx } from "../main";

export async function render(host: HTMLElement, ctx: Ctx) {
  const days = [30, 90, 365].includes(ctx.days) ? ctx.days : 90;
  host.innerHTML = `<div class="ph"><div><h1>Estadísticas</h1><p>Comportamiento de compradores y vendedores, embudo y retención</p></div>${seg([["30", "30 días"], ["90", "90 días"], ["365", "12 meses"]], String(days), "rng")}</div><div id="st"><div class="card" style="height:24rem"></div></div>`;
  bindSeg(host.querySelector("#rng")!, (v) => ctx.setDays(+v));
  try {
    const [d, o] = await Promise.all([get("/api/admin/stats", { days }), get("/api/admin/overview", { days })]); paint(host.querySelector("#st")!, d, o);
  } catch (e) { fail(e); }
}

function paint(el: HTMLElement, d: any, o: any) {
  const f = d.funnel, base = f[0].n || 1, S = o.series as any[];
  const rate = (a: number, b: number) => (b ? pct(a / b, 0) : "—");
  const pcol = (v: number) => `color-mix(in srgb, var(--accent) ${Math.min(100, Math.round(v * 3.4))}%, var(--surface-3))`;
  el.innerHTML = `<div class="grid g4">
    <div class="card kpi"><div class="lbl">Tasa de venta<span class="ico">${ico("ticket")}</span></div><div class="val">${pct(d.sellThrough, 0)}</div><div class="foot"><span>Anuncios que acaban vendidos</span></div></div>
    <div class="card kpi"><div class="lbl">Tiempo hasta vender<span class="ico">${ico("clock")}</span></div><div class="val">${d.timeToSell.hours < 48 ? d.timeToSell.hours.toLocaleString("es-ES") + " <small>h</small>" : (d.timeToSell.hours / 24).toFixed(1).replace(".", ",") + " <small>días</small>"}</div><div class="foot"><span>Media sobre ${int(d.timeToSell.n)} anuncios</span></div></div>
    <div class="card kpi"><div class="lbl">Recompra<span class="ico">${ico("ref")}</span></div><div class="val">${rate(f[3].n, f[1].n)}</div><div class="foot"><span>${int(f[3].n)} de ${int(f[1].n)} compradores repiten</span></div></div>
    <div class="card kpi"><div class="lbl">Conversión a compra<span class="ico">${ico("target")}</span></div><div class="val">${rate(f[1].n, f[0].n)}</div><div class="foot"><span>Registrados que han comprado</span></div></div></div>
  <div class="grid g-main mt-3"><div class="card"><div class="card-h"><div><h3>Altas de usuarios y pedidos</h3><small>Evolución diaria</small></div></div><div class="card-b"><div id="c-a"></div></div></div>
  <div class="card"><div class="card-h"><div><h3>Embudo de marketplace</h3><small>De registro a transacción</small></div></div><div class="card-b"><div class="funnel">${f.map((s: any) => `<div class="st"><i style="width:${Math.max(4, (s.n / base) * 100)}%"></i><span>${esc(s.k)}</span><b>${int(s.n)}</b></div>`).join("")}</div></div></div></div>
  <div class="card mt-3"><div class="card-h"><div><h3>¿Cuándo se compra?</h3><small>Pedidos por día de la semana y hora (hora peninsular)</small></div></div><div class="card-b"><div id="heat"></div></div></div>
  <div class="grid g3 mt-3"><div class="card"><div class="card-h"><div><h3>Sobreprecio de los anuncios</h3><small>Precio de venta vs. original</small></div></div><div class="card-b">${hbars(d.markup.map((m: any) => ({ k: m.k, v: m.n })), int, "var(--c4)")}</div></div>
  <div class="card"><div class="card-h"><div><h3>Valor del pedido</h3><small>Distribución por importe</small></div></div><div class="card-b">${hbars(d.ticketPrices.map((m: any) => ({ k: m.k, v: m.n })), int, "var(--c6)")}</div></div>
  <div class="card"><div class="card-h"><div><h3>Entradas por pedido</h3><small>Tamaño de grupo</small></div></div><div class="card-b" id="sizes"></div></div></div>
  <div class="card mt-3"><div class="card-h"><div><h3>Retención por cohortes</h3><small>% de usuarios registrados cada semana que compran en la semana N</small></div></div><div class="card-b tw"><table class="cohort"><thead><tr><th style="text-align:left">Cohorte</th><th>Usuarios</th>${Array.from({ length: Math.max(...d.cohorts.map((c: any) => c.ret.length), 1) }, (_, i) => `<th>Sem. ${i}</th>`).join("")}</tr></thead><tbody>${d.cohorts.map((c: any) => `<tr><td class="l">Sem. ${c.week}</td><td>${c.size}</td>${c.ret.map((v: number) => `<td style="background:${pcol(v)};color:${v > 20 ? "#fff" : "var(--text)"}">${v ? v.toLocaleString("es-ES") + "%" : "·"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>
  <div class="grid g-main2 mt-3"><div class="card"><div class="card-h"><div><h3>Mejores vendedores</h3><small>Por volumen vendido</small></div></div><div class="card-b"><div class="list">${d.sellers.map((s: any, i: number) => `<a href="#/users/${s.id}" style="color:inherit"><span class="rank">${i + 1}</span>${avatar(s.name, "sm")}<div class="grow"><div class="b trunc">${esc(s.name)}</div><div class="muted xs">${s.sales} ventas</div></div><b class="num">${eur(s.gmv, 0)}</b></a>`).join("") || '<p class="muted">Sin datos</p>'}</div></div></div>
  <div class="card"><div class="card-h"><div><h3>Mejores compradores</h3><small>Por gasto total</small></div></div><div class="card-b"><div class="list">${d.buyers.map((s: any, i: number) => `<a href="#/users/${s.id}" style="color:inherit"><span class="rank">${i + 1}</span>${avatar(s.name, "sm")}<div class="grow"><div class="b trunc">${esc(s.name)}</div><div class="muted xs">${s.orders} pedidos</div></div><b class="num">${eur(s.total, 0)}</b></a>`).join("") || '<p class="muted">Sin datos</p>'}</div></div></div></div>`;
  stagger(".card", el);
  lineChart(el.querySelector("#c-a")!, { labels: S.map((s) => dshort(s.d)), height: 270, series: [{ name: "Pedidos", color: "#2563eb", data: S.map((s) => s.orders), fmt: int }, { name: "Altas", color: "#e8590c", data: S.map((s) => s.users), fmt: int, area: false }], yFmt: (n) => String(Math.round(n)) });
  heatmap(el.querySelector("#heat")!, d.heat);
  donut(el.querySelector("#sizes")!, d.orderSizes.map((s: any) => ({ k: `${s.k} ${s.k === 1 ? "entrada" : "entradas"}`, v: s.n })), int, { top: int(d.orderSizes.reduce((a: number, b: any) => a + b.n, 0)), bottom: "pedidos" });
  void eurK;
}
