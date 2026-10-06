import crypto from "node:crypto";
import { config } from "./config.mjs";
import { q, id, now, tx, audit } from "./db.mjs";
import { on } from "./router.mjs";
import { HttpError } from "./auth.mjs";
import * as pay from "./payments.mjs";
import { sendMail } from "./mail.mjs";
import { creditNote, invoiceHtml, eur } from "./invoices.mjs";
import { SCHEMA, current, saveSettings } from "./settings.mjs";

const DAY = 864e5, eu = (c) => Math.round(c) / 100;
const admin = (c) => { if (!c.user) throw new HttpError(401, "Inicia sesión"); if (c.user.role !== "admin") throw new HttpError(403, "Acceso restringido a administradores"); return c.user; };
const A = (method, path, h) => on(method, path, (c) => { admin(c); return h(c); });
const csv = (rows, cols) => ({ __raw: true, type: "text/csv; charset=utf-8", body: "﻿" + [cols.map((x) => x[0]).join(";"), ...rows.map((r) => cols.map(([, f]) => { const v = typeof f === "function" ? f(r) : r[f]; return `"${String(v ?? "").replace(/"/g, '""')}"`; }).join(";"))].join("\r\n") });
const withName = (o, n) => ({ ...o, __filename: n });
const page = (c, def = 25) => { const p = Math.max(1, +c.query.get("page") || 1), size = Math.min(200, Math.max(1, +c.query.get("size") || def)); return { p, size, off: (p - 1) * size }; };
const like = (s) => `%${String(s ?? "").trim().replace(/[%_]/g, "")}%`;
const ev = (r) => (r ? JSON.parse(r.data) : null);
const tz = "'unixepoch','+2 hours'";

/* ═════════ Resumen ═════════ */
function totals(from, to) {
  const o = q.get("SELECT COALESCE(SUM(subtotal_cents),0) gmv, COALESCE(SUM(fee_cents),0) fees, COUNT(*) orders, COALESCE(SUM(qty),0) tickets FROM orders WHERE status='paid' AND created_at>=? AND created_at<?", from, to);
  const inv = q.get("SELECT COALESCE(SUM(total_cents),0) gross, COALESCE(SUM(base_cents),0) net FROM invoices WHERE issued_at>=? AND issued_at<?", from, to);
  const ref = q.get("SELECT COUNT(*) n FROM orders WHERE status='refunded' AND created_at>=? AND created_at<?", from, to).n;
  return {
    gmv: eu(o.gmv), revenue: eu(inv.gross), netRevenue: eu(inv.net), orders: o.orders, tickets: o.tickets,
    aov: o.orders ? eu(o.gmv / o.orders) : 0, takeRate: o.gmv ? +(inv.gross / o.gmv).toFixed(4) : 0,
    newUsers: q.get("SELECT COUNT(*) n FROM users WHERE created_at>=? AND created_at<?", from, to).n,
    newListings: q.get("SELECT COUNT(*) n FROM listings WHERE created_at>=? AND created_at<?", from, to).n,
    refunds: ref, refundRate: o.orders + ref ? +(ref / (o.orders + ref)).toFixed(4) : 0,
    buyers: q.get("SELECT COUNT(DISTINCT buyer_id) n FROM orders WHERE status='paid' AND created_at>=? AND created_at<?", from, to).n,
  };
}
function series(from, days) {
  const rows = q.all(`SELECT date(created_at/1000,${tz}) d, SUM(subtotal_cents) gmv, COUNT(*) orders, SUM(qty) tickets FROM orders WHERE status='paid' AND created_at>=? GROUP BY d`, from);
  const rev = Object.fromEntries(q.all(`SELECT date(issued_at/1000,${tz}) d, SUM(total_cents) r, SUM(base_cents) n FROM invoices WHERE issued_at>=? GROUP BY d`, from).map((r) => [r.d, r]));
  const us = Object.fromEntries(q.all(`SELECT date(created_at/1000,${tz}) d, COUNT(*) n FROM users WHERE created_at>=? GROUP BY d`, from).map((r) => [r.d, r.n]));
  const ls = Object.fromEntries(q.all(`SELECT date(created_at/1000,${tz}) d, COUNT(*) n FROM listings WHERE created_at>=? GROUP BY d`, from).map((r) => [r.d, r.n]));
  const m = Object.fromEntries(rows.map((r) => [r.d, r])), out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from + i * DAY + 2 * 36e5).toISOString().slice(0, 10), r = m[d];
    out.push({ d, gmv: eu(r?.gmv ?? 0), orders: r?.orders ?? 0, tickets: r?.tickets ?? 0, revenue: eu(rev[d]?.r ?? 0), net: eu(rev[d]?.n ?? 0), users: us[d] ?? 0, listings: ls[d] ?? 0 });
  }
  return out;
}
const startOfDay = () => { const d = new Date(Date.now() + 2 * 36e5); d.setUTCHours(0, 0, 0, 0); return d.getTime() - 2 * 36e5; };

A("GET", "/api/admin/overview", (c) => {
  const days = [7, 30, 90, 365].includes(+c.query.get("days")) ? +c.query.get("days") : 30;
  const to = startOfDay() + DAY, from = to - days * DAY, prevFrom = from - days * DAY;
  const cur = totals(from, to), prev = totals(prevFrom, from);
  const byCat = q.all(`SELECT json_extract(e.data,'$.cat') k, SUM(o.subtotal_cents) gmv, COUNT(*) n FROM orders o JOIN events e ON e.id=o.event_id WHERE o.status='paid' AND o.created_at>=? GROUP BY k ORDER BY gmv DESC`, from).map((r) => ({ k: r.k, gmv: eu(r.gmv), n: r.n }));
  const byCity = q.all(`SELECT json_extract(e.data,'$.c') k, SUM(o.subtotal_cents) gmv, COUNT(*) n FROM orders o JOIN events e ON e.id=o.event_id WHERE o.status='paid' AND o.created_at>=? GROUP BY k ORDER BY gmv DESC LIMIT 8`, from).map((r) => ({ k: r.k, gmv: eu(r.gmv), n: r.n }));
  const top = q.all(`SELECT e.id, json_extract(e.data,'$.name') name, json_extract(e.data,'$.c') city, SUM(o.subtotal_cents) gmv, SUM(o.qty) tickets, COUNT(*) orders FROM orders o JOIN events e ON e.id=o.event_id WHERE o.status='paid' AND o.created_at>=? GROUP BY e.id ORDER BY gmv DESC LIMIT 6`, from).map((r) => ({ ...r, gmv: eu(r.gmv) }));
  const recent = q.all(`SELECT o.id, o.code, o.total_cents, o.qty, o.status, o.created_at, u.name buyer, json_extract(e.data,'$.name') event FROM orders o JOIN users u ON u.id=o.buyer_id JOIN events e ON e.id=o.event_id ORDER BY o.created_at DESC LIMIT 8`).map((r) => ({ ...r, total: eu(r.total_cents) }));
  const pend = q.get("SELECT COUNT(*) n, COALESCE(SUM(amount_cents),0) a FROM seller_payouts WHERE status='held' AND release_at<=?", now());
  const held = q.get("SELECT COALESCE(SUM(amount_cents),0) a FROM seller_payouts WHERE status IN ('held','released')");
  return {
    days, cur, prev, series: series(from, days), byCat, byCity, top, recent,
    alerts: { tickets: q.get("SELECT COUNT(*) n FROM support_tickets WHERE status!='solved'").n, risk: riskList().length, payoutsDue: pend.n, payoutsDueAmount: eu(pend.a) },
    live: { today: totals(startOfDay(), startOfDay() + DAY), activeListings: q.get("SELECT COUNT(*) n FROM listings WHERE status='active' AND qty_left>0").n, users: q.get("SELECT COUNT(*) n FROM users").n, held: eu(held.a) },
  };
});

/* ═════════ Estadísticas avanzadas ═════════ */
A("GET", "/api/admin/stats", (c) => {
  const days = [30, 90, 365].includes(+c.query.get("days")) ? +c.query.get("days") : 90, from = startOfDay() + DAY - days * DAY;
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of q.all(`SELECT CAST(strftime('%w',datetime(created_at/1000,${tz})) AS INT) w, CAST(strftime('%H',datetime(created_at/1000,${tz})) AS INT) h, COUNT(*) n FROM orders WHERE status='paid' AND created_at>=? GROUP BY w,h`, from)) heat[(r.w + 6) % 7][r.h] = r.n;
  const totalUsers = q.get("SELECT COUNT(*) n FROM users").n;
  const funnel = [
    ["Usuarios registrados", totalUsers],
    ["Han comprado", q.get("SELECT COUNT(DISTINCT buyer_id) n FROM orders WHERE status IN ('paid','refunded')").n],
    ["Han vendido (publicado)", q.get("SELECT COUNT(DISTINCT seller_id) n FROM listings").n],
    ["Compradores recurrentes", q.get("SELECT COUNT(*) n FROM (SELECT buyer_id FROM orders WHERE status='paid' GROUP BY buyer_id HAVING COUNT(*)>=2)").n],
    ["Vendedores con venta", q.get("SELECT COUNT(DISTINCT l.seller_id) n FROM listings l JOIN orders o ON o.listing_id=l.id WHERE o.status='paid'").n],
  ].map(([k, n]) => ({ k, n }));
  const bucket = (r) => (r < 0.8 ? "< 80 %" : r < 1 ? "80–99 %" : r <= 1.0001 ? "100 %" : r < 1.1 ? "101–109 %" : r < 1.2 ? "110–119 %" : "120–130 %");
  const mk = {}; for (const r of q.all("SELECT price_cents*1.0/orig_cents r FROM listings WHERE created_at>=?", from)) mk[bucket(r.r)] = (mk[bucket(r.r)] ?? 0) + 1;
  const order = ["< 80 %", "80–99 %", "100 %", "101–109 %", "110–119 %", "120–130 %"];
  const tts = q.get("SELECT AVG(o.t - l.created_at) ms, COUNT(*) n FROM listings l JOIN (SELECT listing_id, MIN(created_at) t FROM orders WHERE status='paid' GROUP BY listing_id) o ON o.listing_id=l.id");
  const ls = q.get("SELECT COUNT(*) n, COALESCE(SUM(CASE WHEN status='sold' THEN 1 ELSE 0 END),0) sold FROM listings");
  // cohortes semanales de registro → compra
  const wk = (t) => Math.floor((t - from) / (7 * DAY));
  const us = q.all("SELECT id, created_at t FROM users WHERE created_at>=?", from), uw = new Map(us.map((u) => [u.id, wk(u.t)]));
  const co = new Map();
  for (const o of q.all("SELECT buyer_id b, created_at t FROM orders WHERE status='paid' AND created_at>=?", from)) { const cw = uw.get(o.b); if (cw == null) continue; const k = wk(o.t) - cw; if (k < 0) continue; const set = co.get(cw) ?? co.set(cw, new Map()).get(cw); (set.get(k) ?? set.set(k, new Set()).get(k)).add(o.b); }
  const nW = Math.ceil(days / 7), sizes = Array(nW).fill(0); us.forEach((u) => sizes[uw.get(u.id)]++);
  const cohorts = Array.from({ length: Math.min(nW, 12) }, (_, i) => ({ week: new Date(from + (nW - Math.min(nW, 12) + i) * 7 * DAY).toISOString().slice(5, 10), size: 0, ret: [] }));
  const off = nW - cohorts.length;
  cohorts.forEach((r, i) => { const w = off + i; r.size = sizes[w]; for (let k = 0; k < nW - w && k < 8; k++) r.ret.push(r.size ? +(((co.get(w)?.get(k)?.size ?? 0) / r.size) * 100).toFixed(1) : 0); });
  const sellers = q.all(`SELECT u.id, u.name, COUNT(*) sales, SUM(o.subtotal_cents) gmv FROM orders o JOIN listings l ON l.id=o.listing_id JOIN users u ON u.id=l.seller_id WHERE o.status='paid' AND o.created_at>=? GROUP BY u.id ORDER BY gmv DESC LIMIT 6`, from).map((r) => ({ ...r, gmv: eu(r.gmv) }));
  const buyers = q.all(`SELECT u.id, u.name, COUNT(*) orders, SUM(o.total_cents) total FROM orders o JOIN users u ON u.id=o.buyer_id WHERE o.status='paid' AND o.created_at>=? GROUP BY u.id ORDER BY total DESC LIMIT 6`, from).map((r) => ({ ...r, total: eu(r.total) }));
  const sizesQ = q.all("SELECT qty k, COUNT(*) n FROM orders WHERE status='paid' AND created_at>=? GROUP BY qty ORDER BY qty", from);
  const price = q.all("SELECT CASE WHEN total_cents<2500 THEN '< 25 €' WHEN total_cents<5000 THEN '25–50 €' WHEN total_cents<10000 THEN '50–100 €' WHEN total_cents<20000 THEN '100–200 €' ELSE '> 200 €' END k, COUNT(*) n FROM orders WHERE status='paid' AND created_at>=? GROUP BY k", from);
  const po = ["< 25 €", "25–50 €", "50–100 €", "100–200 €", "> 200 €"];
  return { days, heat, funnel, markup: order.map((k) => ({ k, n: mk[k] ?? 0 })), timeToSell: { hours: tts.ms ? +(tts.ms / 36e5).toFixed(1) : 0, n: tts.n }, sellThrough: ls.n ? +(ls.sold / ls.n).toFixed(3) : 0, cohorts, sellers, buyers, orderSizes: sizesQ, ticketPrices: po.map((k) => ({ k, n: price.find((p) => p.k === k)?.n ?? 0 })) };
});

/* ═════════ Pedidos ═════════ */
const ORD_SORT = { created_at: "o.created_at", total: "o.total_cents", qty: "o.qty" };
function orderQuery(c) {
  const where = ["1=1"], args = [], s = c.query.get("q"), st = c.query.get("status"), from = c.query.get("from"), to = c.query.get("to");
  if (s) { where.push("(o.code LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR json_extract(e.data,'$.name') LIKE ?)"); args.push(like(s), like(s), like(s), like(s)); }
  if (st) { where.push("o.status = ?"); args.push(st); }
  if (from) { where.push("o.created_at >= ?"); args.push(new Date(from).getTime()); }
  if (to) { where.push("o.created_at < ?"); args.push(new Date(to).getTime() + DAY); }
  const sort = ORD_SORT[c.query.get("sort")] ?? "o.created_at", dir = c.query.get("dir") === "asc" ? "ASC" : "DESC";
  return { sql: `FROM orders o JOIN users u ON u.id=o.buyer_id JOIN events e ON e.id=o.event_id WHERE ${where.join(" AND ")}`, args, order: `ORDER BY ${sort} ${dir}` };
}
const orderRow = (r) => ({ id: r.id, code: r.code, buyer: r.buyer, buyerId: r.buyer_id, email: r.email, event: r.event, eventId: r.event_id, type: r.type, qty: r.qty, subtotal: eu(r.subtotal_cents), fee: eu(r.fee_cents), total: eu(r.total_cents), status: r.status, provider: r.provider, listingId: r.listing_id, at: r.created_at });
const ORD_COLS = "o.*, u.name buyer, u.email, json_extract(e.data,'$.name') event";
A("GET", "/api/admin/orders", (c) => {
  const { p, size, off } = page(c), { sql, args, order } = orderQuery(c);
  const total = q.get(`SELECT COUNT(*) n, COALESCE(SUM(CASE WHEN o.status='paid' THEN o.total_cents END),0) sum ${sql}`, ...args);
  return { total: total.n, sum: eu(total.sum), page: p, size, rows: q.all(`SELECT ${ORD_COLS} ${sql} ${order} LIMIT ? OFFSET ?`, ...args, size, off).map(orderRow) };
});
A("GET", "/api/admin/orders.csv", (c) => {
  const { sql, args, order } = orderQuery(c);
  const rows = q.all(`SELECT ${ORD_COLS} ${sql} ${order} LIMIT 20000`, ...args).map(orderRow);
  return csv(rows, [["Pedido", "code"], ["Fecha", (r) => new Date(r.at).toISOString()], ["Comprador", "buyer"], ["Email", "email"], ["Evento", "event"], ["Tipo", "type"], ["Cantidad", "qty"], ["Subtotal", (r) => r.subtotal.toFixed(2).replace(".", ",")], ["Gastos gestión", (r) => r.fee.toFixed(2).replace(".", ",")], ["Total", (r) => r.total.toFixed(2).replace(".", ",")], ["Estado", "status"]]);
});
A("GET", "/api/admin/orders/:id", (c) => {
  const r = q.get(`SELECT ${ORD_COLS} FROM orders o JOIN users u ON u.id=o.buyer_id JOIN events e ON e.id=o.event_id WHERE o.id=?`, c.params.id);
  if (!r) throw new HttpError(404, "Pedido no encontrado");
  const l = r.listing_id ? q.get("SELECT l.id, l.price_cents, l.orig_cents, u.id sid, u.name seller, u.email semail FROM listings l JOIN users u ON u.id=l.seller_id WHERE l.id=?", r.listing_id) : null;
  return {
    order: orderRow(r), seller: l ? { id: l.sid, name: l.seller, email: l.semail, unit: eu(l.price_cents), orig: eu(l.orig_cents) } : null,
    tickets: q.all("SELECT id, code, status FROM tickets WHERE order_id=?", r.id),
    invoices: q.all("SELECT id, number, kind, total_cents, issued_at FROM invoices WHERE order_id=? ORDER BY issued_at", r.id).map((i) => ({ ...i, total: eu(i.total_cents) })),
    payout: q.get("SELECT id, status, amount_cents, release_at FROM seller_payouts WHERE order_id=?", r.id),
    audit: q.all("SELECT action, meta, at FROM audit_log WHERE meta LIKE ? ORDER BY at DESC LIMIT 10", `%${r.id}%`),
  };
});
export async function refundOrder(oid, reason, adminId) {
  const o = q.get("SELECT * FROM orders WHERE id=?", oid);
  if (!o) throw new HttpError(404, "Pedido no encontrado");
  if (o.status !== "paid") throw new HttpError(409, "Solo se pueden reembolsar pedidos pagados");
  const pr = q.get("SELECT status FROM seller_payouts WHERE order_id=?", oid);
  if (pr?.status === "paid") throw new HttpError(409, "El vendedor ya cobró este pedido: gestiona la devolución manualmente");
  tx(() => {
    q.run("UPDATE orders SET status='refunded' WHERE id=?", oid);
    q.run("UPDATE tickets SET status='void' WHERE order_id=?", oid);
    q.run("UPDATE seller_payouts SET status='cancelled' WHERE order_id=? AND status IN ('held','released')", oid);
    if (o.listing_id) q.run("UPDATE listings SET qty_left=qty_left+?, status='active' WHERE id=? AND status IN ('active','sold')", o.qty, o.listing_id);
    for (const i of q.all("SELECT * FROM invoices WHERE order_id=? AND kind!='credit'", oid)) creditNote(i, `Abono por reembolso del pedido ${o.code}`);
    audit(adminId, "order_refunded", { orderId: oid, reason });
  });
  if (o.provider === "stripe") await pay.refund(o.provider_ref);
  const b = q.get("SELECT name, email FROM users WHERE id=?", o.buyer_id);
  sendMail({ to: b.email, subject: `Reembolso de tu pedido ${o.code}`, text: `Hola ${b.name},\n\nHemos reembolsado ${eur(o.total_cents)} de tu pedido ${o.code}.\nMotivo: ${reason || "gestión de soporte"}.\n\nEl abono puede tardar entre 3 y 10 días hábiles en reflejarse.` }).catch(() => {});
}
A("POST", "/api/admin/orders/:id/refund", async (c) => { await refundOrder(c.params.id, String(c.body.reason ?? "").slice(0, 200), c.user.id); return { ok: true }; });

/* ═════════ Anuncios (moderación) ═════════ */
A("GET", "/api/admin/listings", (c) => {
  const { p, size, off } = page(c), where = ["1=1"], args = [], s = c.query.get("q"), st = c.query.get("status");
  if (s) { where.push("(u.name LIKE ? OR u.email LIKE ? OR json_extract(e.data,'$.name') LIKE ? OR l.id LIKE ?)"); args.push(like(s), like(s), like(s), like(s)); }
  if (st) { where.push("l.status = ?"); args.push(st); }
  if (c.query.get("flag") === "markup") where.push("l.price_cents*1.0/l.orig_cents >= 1.2");
  const from = `FROM listings l JOIN users u ON u.id=l.seller_id JOIN events e ON e.id=l.event_id WHERE ${where.join(" AND ")}`;
  const sort = { created_at: "l.created_at", price: "l.price_cents", markup: "l.price_cents*1.0/l.orig_cents" }[c.query.get("sort")] ?? "l.created_at", dir = c.query.get("dir") === "asc" ? "ASC" : "DESC";
  return { total: q.get(`SELECT COUNT(*) n ${from}`, ...args).n, page: p, size, rows: q.all(`SELECT l.*, u.name seller, u.email semail, json_extract(e.data,'$.name') event ${from} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`, ...args, size, off).map((r) => ({ id: r.id, seller: r.seller, sellerId: r.seller_id, email: r.semail, event: r.event, eventId: r.event_id, type: r.type, qty: r.qty, left: r.qty_left, price: eu(r.price_cents), orig: eu(r.orig_cents), markup: +(r.price_cents / r.orig_cents).toFixed(3), status: r.status, at: r.created_at, note: r.note })) };
});
A("POST", "/api/admin/listings/:id/remove", (c) => {
  const l = q.get("SELECT * FROM listings WHERE id=?", c.params.id); if (!l) throw new HttpError(404, "Anuncio no encontrado");
  if (l.status === "removed") throw new HttpError(409, "Ya estaba retirado");
  if (l.qty_left < l.qty) throw new HttpError(409, "Ya tiene ventas: reembolsa los pedidos antes");
  q.run("UPDATE listings SET status='removed' WHERE id=?", l.id); audit(c.user.id, "listing_removed", { id: l.id, reason: c.body.reason });
  const s = q.get("SELECT name, email FROM users WHERE id=?", l.seller_id);
  sendMail({ to: s.email, subject: "Hemos retirado tu anuncio", text: `Hola ${s.name},\n\nHemos retirado tu anuncio ${l.id}. Motivo: ${String(c.body.reason ?? "incumple las condiciones").slice(0, 200)}.\nSi crees que es un error, responde a este correo.` }).catch(() => {});
  return { ok: true };
});
A("POST", "/api/admin/listings/:id/restore", (c) => { q.run("UPDATE listings SET status='active' WHERE id=? AND status='removed' AND qty_left>0", c.params.id); audit(c.user.id, "listing_restored", { id: c.params.id }); return { ok: true }; });

/* ═════════ Eventos ═════════ */
function eventStats() {
  const m = new Map(q.all("SELECT event_id id, SUM(subtotal_cents) gmv, SUM(qty) tix, COUNT(*) n FROM orders WHERE status='paid' GROUP BY event_id").map((r) => [r.id, r]));
  const l = new Map(q.all("SELECT event_id id, COUNT(*) n, COALESCE(SUM(qty_left),0) avail FROM listings WHERE status='active' AND qty_left>0 GROUP BY event_id").map((r) => [r.id, r]));
  return (e) => ({ gmv: eu(m.get(e.id)?.gmv ?? 0), sold: m.get(e.id)?.tix ?? 0, orders: m.get(e.id)?.n ?? 0, listings: l.get(e.id)?.n ?? 0, available: l.get(e.id)?.avail ?? 0 });
}
A("GET", "/api/admin/events", () => { const st = eventStats(); return { rows: q.all("SELECT data FROM events ORDER BY starts_at").map(ev).map((e) => ({ id: e.id, name: e.name ?? e.t, t: e.t, city: e.c, venue: e.v, cat: e.cat, date: e.date, status: e.status ?? "active", hot: !!e.hot, tickets: e.tickets, desc: e.desc, ...st(e) })) }; });
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
function validEvent(b, base = {}) {
  const e = { ...base };
  for (const k of ["name", "t", "v", "c", "cat", "date", "desc", "address", "a"]) if (b[k] != null) e[k] = String(b[k]).trim().slice(0, 400);
  if (!e.name || e.name.length < 3) throw new HttpError(400, "Pon un nombre al evento", "name");
  e.t ||= e.name;
  if (!e.v) throw new HttpError(400, "Indica el recinto", "v");
  if (!e.c) throw new HttpError(400, "Indica la ciudad", "c");
  if (!["musica", "festival", "deporte", "teatro", "club"].includes(e.cat)) throw new HttpError(400, "Categoría no válida", "cat");
  if (!e.date || isNaN(new Date(e.date))) throw new HttpError(400, "Fecha no válida", "date");
  if (Array.isArray(b.tickets)) e.tickets = b.tickets.slice(0, 12).map((t) => ({ n: String(t.n ?? "").trim().slice(0, 60), sub: String(t.sub ?? "").slice(0, 80), from: Math.max(1, +t.from || 1), list: base.tickets?.find((x) => x.n === t.n)?.list ?? 0 })).filter((t) => t.n);
  if (!e.tickets?.length) throw new HttpError(400, "Añade al menos un tipo de entrada", "tickets");
  if (b.hot != null) e.hot = !!b.hot;
  e.a ||= e.name; e.desc ||= ""; e.address ||= `${e.v}, ${e.c}`; e.area ||= e.c; e.people ||= [e.a]; e.demand ||= "Demanda media"; e.wanted ||= 0; e.status ||= "active";
  return e;
}
A("POST", "/api/admin/events", (c) => {
  const e = validEvent(c.body); e.id = slug(e.name) + "-" + id(3).toLowerCase().replace(/[^a-z0-9]/g, "x");
  q.run("INSERT INTO events (id, data, starts_at) VALUES (?,?,?)", e.id, JSON.stringify(e), new Date(e.date).getTime()); audit(c.user.id, "event_created", { id: e.id });
  return { id: e.id };
});
A("PATCH", "/api/admin/events/:id", (c) => {
  const row = q.get("SELECT data FROM events WHERE id=?", c.params.id); if (!row) throw new HttpError(404, "Evento no encontrado");
  const e = validEvent({ ...ev(row), ...c.body }, ev(row)); q.run("UPDATE events SET data=?, starts_at=? WHERE id=?", JSON.stringify(e), new Date(e.date).getTime(), e.id); audit(c.user.id, "event_updated", { id: e.id });
  return { ok: true };
});
A("POST", "/api/admin/events/:id/cancel", async (c) => {
  const row = q.get("SELECT data FROM events WHERE id=?", c.params.id); if (!row) throw new HttpError(404, "Evento no encontrado");
  const e = ev(row); e.status = "cancelled"; q.run("UPDATE events SET data=? WHERE id=?", JSON.stringify(e), e.id);
  q.run("UPDATE listings SET status='removed' WHERE event_id=? AND status='active'", e.id);
  let n = 0; if (c.body.refund) for (const o of q.all("SELECT id FROM orders WHERE event_id=? AND status='paid'", e.id)) { try { await refundOrder(o.id, "Evento cancelado", c.user.id); n++; } catch {} }
  audit(c.user.id, "event_cancelled", { id: e.id, refunded: n }); return { ok: true, refunded: n };
});

/* ═════════ Usuarios ═════════ */
const USER_SORT = { created_at: "u.created_at", spent: "spent", sales: "sold", name: "u.name", last: "u.last_login_at" };
A("GET", "/api/admin/users", (c) => {
  const { p, size, off } = page(c), where = ["1=1"], args = [], s = c.query.get("q"), role = c.query.get("role"), st = c.query.get("status");
  if (s) { where.push("(u.name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)"); args.push(like(s), like(s), like(s)); }
  if (role) { where.push("u.role=?"); args.push(role); }
  if (st === "banned") where.push("u.banned_at IS NOT NULL"); if (st === "active") where.push("u.banned_at IS NULL");
  const sort = USER_SORT[c.query.get("sort")] ?? "u.created_at", dir = c.query.get("dir") === "asc" ? "ASC" : "DESC";
  const base = `FROM users u WHERE ${where.join(" AND ")}`;
  const rows = q.all(`SELECT u.id, u.name, u.email, u.role, u.created_at, u.last_login_at, u.banned_at,
    (SELECT COUNT(*) FROM orders o WHERE o.buyer_id=u.id AND o.status='paid') orders,
    (SELECT COALESCE(SUM(total_cents),0) FROM orders o WHERE o.buyer_id=u.id AND o.status='paid') spent,
    (SELECT COUNT(*) FROM listings l WHERE l.seller_id=u.id) listings,
    (SELECT COALESCE(SUM(qty-qty_left),0) FROM listings l WHERE l.seller_id=u.id) sold,
    (SELECT COUNT(*) FROM orders o WHERE o.buyer_id=u.id AND o.status='refunded') refunds,
    EXISTS(SELECT 1 FROM payout_accounts p WHERE p.user_id=u.id) hasIban
    ${base} ORDER BY ${sort} ${dir} LIMIT ? OFFSET ?`, ...args, size, off).map((r) => ({ ...r, spent: eu(r.spent), banned: !!r.banned_at }));
  return { total: q.get(`SELECT COUNT(*) n ${base}`, ...args).n, page: p, size, rows };
});
A("GET", "/api/admin/users.csv", () => csv(q.all("SELECT id, name, email, role, created_at, last_login_at, banned_at FROM users ORDER BY created_at DESC"), [["ID", "id"], ["Nombre", "name"], ["Email", "email"], ["Rol", "role"], ["Alta", (r) => new Date(r.created_at).toISOString()], ["Último acceso", (r) => (r.last_login_at ? new Date(r.last_login_at).toISOString() : "")], ["Suspendido", (r) => (r.banned_at ? "sí" : "no")]]));
A("GET", "/api/admin/users/:id", (c) => {
  const u = q.get("SELECT id, name, email, role, created_at, last_login_at, banned_at FROM users WHERE id=?", c.params.id); if (!u) throw new HttpError(404, "Usuario no encontrado");
  return {
    user: { ...u, banned: !!u.banned_at },
    payout: q.get("SELECT holder, last4 FROM payout_accounts WHERE user_id=?", u.id),
    orders: q.all(`SELECT o.id, o.code, o.total_cents, o.qty, o.status, o.created_at, json_extract(e.data,'$.name') event FROM orders o JOIN events e ON e.id=o.event_id WHERE o.buyer_id=? ORDER BY o.created_at DESC LIMIT 15`, u.id).map((r) => ({ ...r, total: eu(r.total_cents) })),
    listings: q.all(`SELECT l.id, l.qty, l.qty_left, l.price_cents, l.status, l.created_at, json_extract(e.data,'$.name') event FROM listings l JOIN events e ON e.id=l.event_id WHERE l.seller_id=? ORDER BY l.created_at DESC LIMIT 15`, u.id).map((r) => ({ ...r, price: eu(r.price_cents) })),
    sessions: q.all("SELECT ip, ua, created_at, expires_at FROM sessions WHERE user_id=? ORDER BY created_at DESC LIMIT 5", u.id),
    audit: q.all("SELECT action, meta, ip, at FROM audit_log WHERE user_id=? ORDER BY at DESC LIMIT 15", u.id),
    tickets: q.all("SELECT id, subject, status, created_at FROM support_tickets WHERE user_id=? ORDER BY created_at DESC LIMIT 5", u.id),
  };
});
A("POST", "/api/admin/users/:id/ban", (c) => {
  if (c.params.id === c.user.id) throw new HttpError(400, "No puedes suspenderte a ti mismo");
  const ban = c.body.ban !== false; q.run("UPDATE users SET banned_at=? WHERE id=?", ban ? now() : null, c.params.id);
  if (ban) { q.run("DELETE FROM sessions WHERE user_id=?", c.params.id); q.run("UPDATE listings SET status='removed' WHERE seller_id=? AND status='active' AND qty_left=qty", c.params.id); }
  audit(c.user.id, ban ? "user_banned" : "user_unbanned", { id: c.params.id, reason: c.body.reason }); return { ok: true };
});
A("POST", "/api/admin/users/:id/role", (c) => {
  if (!["user", "admin"].includes(c.body.role)) throw new HttpError(400, "Rol no válido");
  if (c.params.id === c.user.id) throw new HttpError(400, "No puedes cambiar tu propio rol");
  q.run("UPDATE users SET role=? WHERE id=?", c.body.role, c.params.id); audit(c.user.id, "role_changed", { id: c.params.id, role: c.body.role }); return { ok: true };
});

/* ═════════ Liquidaciones a vendedores ═════════ */
A("GET", "/api/admin/payouts", (c) => {
  const { p, size, off } = page(c), st = c.query.get("status"), where = ["1=1"], args = [];
  if (st === "due") { where.push("sp.status='held' AND sp.release_at<=?"); args.push(now()); } else if (st) { where.push("sp.status=?"); args.push(st); }
  const from = `FROM seller_payouts sp JOIN users u ON u.id=sp.seller_id JOIN orders o ON o.id=sp.order_id LEFT JOIN payout_accounts pa ON pa.user_id=sp.seller_id WHERE ${where.join(" AND ")}`;
  const sum = (s, extra = "") => eu(q.get(`SELECT COALESCE(SUM(amount_cents),0) a FROM seller_payouts WHERE status ${s} ${extra}`).a);
  return {
    total: q.get(`SELECT COUNT(*) n ${from}`, ...args).n, page: p, size,
    summary: { held: sum("='held'", `AND release_at>${now()}`), due: sum("='held'", `AND release_at<=${now()}`), released: sum("='released'"), paid: sum("='paid'") },
    rows: q.all(`SELECT sp.id, sp.status, sp.amount_cents, sp.release_at, u.id sid, u.name seller, u.email, o.code, pa.holder, pa.last4 ${from} ORDER BY sp.release_at LIMIT ? OFFSET ?`, ...args, size, off).map((r) => ({ ...r, amount: eu(r.amount_cents), due: r.status === "held" && r.release_at <= now() })),
  };
});
A("POST", "/api/admin/payouts/release", (c) => {
  const ids = Array.isArray(c.body.ids) ? c.body.ids.slice(0, 500) : null;
  const r = ids ? ids.map((x) => q.run("UPDATE seller_payouts SET status='released' WHERE id=? AND status='held'", String(x)).changes).reduce((a, b) => a + b, 0) : q.run("UPDATE seller_payouts SET status='released' WHERE status='held' AND release_at<=?", now()).changes;
  audit(c.user.id, "payouts_released", { n: r }); return { released: r };
});
A("POST", "/api/admin/payouts/paid", (c) => {
  const ids = (Array.isArray(c.body.ids) ? c.body.ids : []).slice(0, 500); if (!ids.length) throw new HttpError(400, "Selecciona liquidaciones");
  const r = ids.map((x) => q.run("UPDATE seller_payouts SET status='paid' WHERE id=? AND status='released'", String(x)).changes).reduce((a, b) => a + b, 0);
  audit(c.user.id, "payouts_paid", { n: r, ref: c.body.reference }); return { paid: r };
});
function decryptIban(blob) { try { const b = Buffer.from(blob, "base64"), d = crypto.createDecipheriv("aes-256-gcm", config.dataKey, b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8"); } catch { return ""; } }
/** Remesa de transferencias (CSV para la banca online / conversión a SEPA XML). Registra el acceso a los IBAN. */
A("GET", "/api/admin/payouts.csv", (c) => {
  const st = c.query.get("status") === "paid" ? "paid" : "released";
  const rows = q.all("SELECT sp.id, sp.amount_cents, o.code, u.name, u.email, pa.holder, pa.iban_enc FROM seller_payouts sp JOIN users u ON u.id=sp.seller_id JOIN orders o ON o.id=sp.order_id JOIN payout_accounts pa ON pa.user_id=sp.seller_id WHERE sp.status=?", st);
  audit(c.user.id, "payouts_exported", { n: rows.length });
  return csv(rows, [["Beneficiario", "holder"], ["IBAN", (r) => decryptIban(r.iban_enc)], ["Importe EUR", (r) => (r.amount_cents / 100).toFixed(2)], ["Concepto", (r) => `Handticket ${r.code}`], ["Email", "email"], ["Referencia", "id"]]);
});

/* ═════════ Facturación ═════════ */
function invQuery(c) {
  const where = ["1=1"], args = [], s = c.query.get("q"), k = c.query.get("kind"), from = c.query.get("from"), to = c.query.get("to");
  if (s) { where.push("(number LIKE ? OR party_name LIKE ? OR party_email LIKE ?)"); args.push(like(s), like(s), like(s)); }
  if (k) { where.push("kind=?"); args.push(k); }
  if (from) { where.push("issued_at>=?"); args.push(new Date(from).getTime()); }
  if (to) { where.push("issued_at<?"); args.push(new Date(to).getTime() + DAY); }
  return { w: where.join(" AND "), args };
}
const invRow = (r) => ({ id: r.id, number: r.number, kind: r.kind, party: r.party_name, email: r.party_email, concept: r.concept, base: eu(r.base_cents), vat: eu(r.vat_cents), total: eu(r.total_cents), rate: r.vat_rate, rectifies: r.rectifies, orderId: r.order_id, at: r.issued_at });
A("GET", "/api/admin/invoices", (c) => {
  const { p, size, off } = page(c), { w, args } = invQuery(c);
  const t = q.get(`SELECT COUNT(*) n, COALESCE(SUM(base_cents),0) base, COALESCE(SUM(vat_cents),0) vat, COALESCE(SUM(total_cents),0) total FROM invoices WHERE ${w}`, ...args);
  const quarters = q.all("SELECT year, ((CAST(strftime('%m',issued_at/1000,'unixepoch') AS INT)-1)/3)+1 qt, SUM(base_cents) base, SUM(vat_cents) vat, SUM(total_cents) total, COUNT(*) n FROM invoices GROUP BY year, qt ORDER BY year DESC, qt DESC LIMIT 8").map((r) => ({ ...r, base: eu(r.base), vat: eu(r.vat), total: eu(r.total) }));
  return { total: t.n, totals: { base: eu(t.base), vat: eu(t.vat), total: eu(t.total) }, quarters, page: p, size, rows: q.all(`SELECT * FROM invoices WHERE ${w} ORDER BY issued_at DESC, seq DESC LIMIT ? OFFSET ?`, ...args, size, off).map(invRow) };
});
A("GET", "/api/admin/invoices.csv", (c) => { const { w, args } = invQuery(c); return csv(q.all(`SELECT * FROM invoices WHERE ${w} ORDER BY issued_at LIMIT 50000`, ...args).map(invRow), [["Nº factura", "number"], ["Fecha", (r) => new Date(r.at).toISOString().slice(0, 10)], ["Tipo", "kind"], ["Cliente", "party"], ["Email", "email"], ["Concepto", "concept"], ["Base", (r) => r.base.toFixed(2).replace(".", ",")], ["IVA %", (r) => Math.round(r.rate * 100)], ["Cuota IVA", (r) => r.vat.toFixed(2).replace(".", ",")], ["Total", (r) => r.total.toFixed(2).replace(".", ",")], ["Rectifica", "rectifies"]]); });
A("GET", "/api/admin/invoices/:id/html", (c) => { const i = q.get("SELECT * FROM invoices WHERE id=?", c.params.id); if (!i) throw new HttpError(404, "Factura no encontrada"); return { __raw: true, type: "text/html; charset=utf-8", body: invoiceHtml(i) }; });

/* ═════════ Riesgo y fraude ═════════ */
function riskList() {
  const out = [], t = now();
  for (const r of q.all("SELECT l.id, l.price_cents, l.orig_cents, l.qty_left, u.id uid, u.name, json_extract(e.data,'$.name') ev FROM listings l JOIN users u ON u.id=l.seller_id JOIN events e ON e.id=l.event_id WHERE l.status='active' AND l.price_cents*1.0/l.orig_cents>=1.25"))
    out.push({ key: `markup:${r.id}`, kind: "markup", severity: "medium", title: `Precio al ${Math.round((r.price_cents / r.orig_cents) * 100)} % del original`, detail: `${r.name} · ${r.ev}`, ref: { type: "listing", id: r.id }, at: t });
  for (const r of q.all("SELECT u.id, u.name, u.created_at, COUNT(*) n FROM users u JOIN listings l ON l.seller_id=u.id WHERE u.created_at>? AND l.status='active' GROUP BY u.id HAVING n>=3", t - 2 * DAY))
    out.push({ key: `newseller:${r.id}`, kind: "new_seller", severity: "high", title: `Cuenta nueva con ${r.n} anuncios en 48 h`, detail: r.name, ref: { type: "user", id: r.id }, at: r.created_at });
  for (const r of q.all("SELECT u.id, u.name, COUNT(*) n FROM orders o JOIN users u ON u.id=o.buyer_id WHERE o.status='refunded' GROUP BY u.id HAVING n>=2"))
    out.push({ key: `refunds:${r.id}`, kind: "refunds", severity: r.n >= 3 ? "high" : "medium", title: `${r.n} reembolsos en la cuenta`, detail: r.name, ref: { type: "user", id: r.id }, at: t });
  for (const r of q.all("SELECT COALESCE(user_id, ip) k, ip, user_id, COUNT(*) n, MAX(at) at FROM audit_log WHERE action='login_failed' AND at>? GROUP BY ip HAVING n>=5", t - DAY))
    out.push({ key: `bruteforce:${r.ip}`, kind: "login", severity: "high", title: `${r.n} accesos fallidos desde la misma IP`, detail: r.ip, ref: r.user_id ? { type: "user", id: r.user_id } : null, at: r.at });
  for (const r of q.all("SELECT s.id, s.subject, s.created_at FROM support_tickets s WHERE s.priority='high' AND s.status!='solved'"))
    out.push({ key: `ticket:${r.id}`, kind: "ticket", severity: "medium", title: "Ticket de soporte prioritario", detail: r.subject, ref: { type: "ticket", id: r.id }, at: r.created_at });
  const done = new Set(q.all("SELECT key FROM risk_resolutions").map((r) => r.key));
  const rank = { high: 0, medium: 1, low: 2 };
  return out.filter((x) => !done.has(x.key)).sort((a, b) => rank[a.severity] - rank[b.severity] || b.at - a.at);
}
A("GET", "/api/admin/risk", () => ({ alerts: riskList(), resolved: q.all("SELECT key, action, note, at FROM risk_resolutions ORDER BY at DESC LIMIT 20") }));
A("POST", "/api/admin/risk/resolve", (c) => { const key = String(c.body.key ?? ""); if (!key) throw new HttpError(400, "Falta la alerta"); q.run("INSERT INTO risk_resolutions (key, action, note, admin_id, at) VALUES (?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET action=excluded.action, note=excluded.note, at=excluded.at", key, c.body.action === "dismiss" ? "dismiss" : "resolved", String(c.body.note ?? "").slice(0, 300), c.user.id, now()); return { ok: true }; });

/* ═════════ Soporte ═════════ */
A("GET", "/api/admin/support", (c) => {
  const { p, size, off } = page(c), where = ["1=1"], args = [], st = c.query.get("status"), s = c.query.get("q");
  if (st) { where.push("t.status=?"); args.push(st); } if (s) { where.push("(t.subject LIKE ? OR t.email LIKE ? OR t.order_code LIKE ?)"); args.push(like(s), like(s), like(s)); }
  const from = `FROM support_tickets t LEFT JOIN users u ON u.id=t.user_id WHERE ${where.join(" AND ")}`;
  const cnt = Object.fromEntries(q.all("SELECT status, COUNT(*) n FROM support_tickets GROUP BY status").map((r) => [r.status, r.n]));
  return { total: q.get(`SELECT COUNT(*) n ${from}`, ...args).n, counts: cnt, page: p, size, rows: q.all(`SELECT t.*, u.name user, (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id=t.id) msgs ${from} ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END, CASE t.priority WHEN 'high' THEN 0 ELSE 1 END, t.updated_at DESC LIMIT ? OFFSET ?`, ...args, size, off) };
});
A("GET", "/api/admin/support/:id", (c) => { const t = q.get("SELECT t.*, u.name user FROM support_tickets t LEFT JOIN users u ON u.id=t.user_id WHERE t.id=?", c.params.id); if (!t) throw new HttpError(404, "Ticket no encontrado"); return { ticket: t, messages: q.all("SELECT author, author_name, body, at FROM support_messages WHERE ticket_id=? ORDER BY at", t.id) }; });
A("POST", "/api/admin/support/:id/reply", async (c) => {
  const t = q.get("SELECT * FROM support_tickets WHERE id=?", c.params.id); if (!t) throw new HttpError(404, "Ticket no encontrado");
  const body = String(c.body.body ?? "").trim().slice(0, 4000); if (body.length < 2) throw new HttpError(400, "Escribe una respuesta");
  q.run("INSERT INTO support_messages (ticket_id, author, author_name, body, at) VALUES (?,?,?,?,?)", t.id, "admin", c.user.name, body, now());
  q.run("UPDATE support_tickets SET status=?, updated_at=? WHERE id=?", c.body.solve ? "solved" : "pending", now(), t.id);
  if (t.email) sendMail({ to: t.email, subject: `Re: ${t.subject}`, text: `${body}\n\n— ${c.user.name}, soporte Handticket` }).catch(() => {});
  audit(c.user.id, "support_reply", { id: t.id }); return { ok: true };
});
A("PATCH", "/api/admin/support/:id", (c) => {
  const { status, priority } = c.body;
  if (status && ["open", "pending", "solved"].includes(status)) q.run("UPDATE support_tickets SET status=?, updated_at=? WHERE id=?", status, now(), c.params.id);
  if (priority && ["normal", "high"].includes(priority)) q.run("UPDATE support_tickets SET priority=? WHERE id=?", priority, c.params.id);
  return { ok: true };
});
/* El usuario abre un ticket desde el Centro de ayuda */
on("POST", "/api/support", (c) => {
  const subject = String(c.body.subject ?? "").trim().slice(0, 140), message = String(c.body.message ?? "").trim().slice(0, 4000), email = String(c.body.email ?? c.user?.email ?? "").trim().toLowerCase();
  if (subject.length < 3) throw new HttpError(400, "Cuéntanos el asunto", "subject"); if (message.length < 10) throw new HttpError(400, "Describe un poco más tu problema", "message");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, "Email no válido", "email");
  const tid = id(8).toUpperCase(), cat = ["pedido", "pago", "vendedor", "cuenta", "general"].includes(c.body.category) ? c.body.category : "general";
  q.run("INSERT INTO support_tickets (id, user_id, email, subject, category, priority, order_code, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)", tid, c.user?.id ?? null, email, subject, cat, /entrada no|no funciona|fraude|estafa/i.test(subject + message) ? "high" : "normal", String(c.body.orderCode ?? "").slice(0, 20) || null, now(), now());
  q.run("INSERT INTO support_messages (ticket_id, author, author_name, body, at) VALUES (?,?,?,?,?)", tid, "user", c.user?.name ?? email, message, now());
  return { id: tid };
});
on("GET", "/api/me/support", (c) => { if (!c.user) throw new HttpError(401, "Inicia sesión"); return { tickets: q.all("SELECT id, subject, status, created_at, updated_at FROM support_tickets WHERE user_id=? ORDER BY updated_at DESC", c.user.id) }; });

/* ═════════ Auditoría, ajustes, búsqueda ═════════ */
A("GET", "/api/admin/audit", (c) => {
  const { p, size, off } = page(c, 40), where = ["1=1"], args = [], a = c.query.get("action"), s = c.query.get("q");
  if (a) { where.push("a.action=?"); args.push(a); } if (s) { where.push("(u.name LIKE ? OR u.email LIKE ? OR a.ip LIKE ? OR a.meta LIKE ?)"); args.push(like(s), like(s), like(s), like(s)); }
  const from = `FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE ${where.join(" AND ")}`;
  return { total: q.get(`SELECT COUNT(*) n ${from}`, ...args).n, page: p, size, actions: q.all("SELECT DISTINCT action FROM audit_log ORDER BY action").map((r) => r.action), rows: q.all(`SELECT a.id, a.action, a.meta, a.ip, a.at, u.name user, u.email ${from} ORDER BY a.id DESC LIMIT ? OFFSET ?`, ...args, size, off) };
});
A("GET", "/api/admin/settings", () => ({ schema: SCHEMA, values: current(), payments: pay.mode() }));
A("PUT", "/api/admin/settings", (c) => { try { const r = saveSettings(c.body); audit(c.user.id, "settings_changed", r); return { values: current() }; } catch (e) { throw new HttpError(400, e.message); } });
A("GET", "/api/admin/search", (c) => {
  const s = String(c.query.get("q") ?? "").trim(); if (s.length < 2) return { results: [] }; const l = like(s);
  return { results: [
    ...q.all("SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 5", l, l).map((r) => ({ type: "Usuario", title: r.name, sub: r.email, hash: `#/users/${r.id}` })),
    ...q.all("SELECT id, code FROM orders WHERE code LIKE ? LIMIT 5", l).map((r) => ({ type: "Pedido", title: r.code, sub: "", hash: `#/orders/${r.id}` })),
    ...q.all("SELECT id, json_extract(data,'$.name') n, json_extract(data,'$.c') c FROM events WHERE data LIKE ? LIMIT 5", l).map((r) => ({ type: "Evento", title: r.n, sub: r.c, hash: `#/events` })),
    ...q.all("SELECT id, number, party_name FROM invoices WHERE number LIKE ? LIMIT 4", l).map((r) => ({ type: "Factura", title: r.number, sub: r.party_name, hash: `#/invoices` })),
  ] };
});
void withName;

A("GET", "/api/admin/badges", () => {
  const due = q.get("SELECT COUNT(*) n, COALESCE(SUM(amount_cents),0) a FROM seller_payouts WHERE status='held' AND release_at<=?", now());
  return { tickets: q.get("SELECT COUNT(*) n FROM support_tickets WHERE status='open'").n, risk: riskList().length, payoutsDue: due.n, payoutsDueAmount: eu(due.a), highRisk: riskList().filter((r) => r.severity === "high").length };
});
