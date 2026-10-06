import { config } from "./config.mjs";
import { q, id, now, tx, audit } from "./db.mjs";
import * as A from "./auth.mjs";
import { HttpError, EMAIL_RE } from "./auth.mjs";
import * as pay from "./payments.mjs";
import { sendMail } from "./mail.mjs";
import crypto from "node:crypto";
import { on } from "./router.mjs";
import { issueInvoice } from "./invoices.mjs";

const eur = (c) => Math.round(c) / 100;
const cents = (e) => Math.round(Number(e) * 100);
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const eventRow = (r) => (r ? JSON.parse(r.data) : null);
const getEvent = (eid) => eventRow(q.get("SELECT data FROM events WHERE id = ?", String(eid)));
const need = (ctx) => { if (!ctx.user) throw new HttpError(401, "Inicia sesión para continuar"); return ctx.user; };
const int = (v, min, max, msg) => { const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, msg); return n; };
const listingOut = (l) => ({ id: l.id, ev: l.event_id, type: l.type, qty: l.qty_left, price: eur(l.price_cents), orig: eur(l.orig_cents), status: l.status, at: l.created_at, zone: l.zone, row: l.row, seat: l.seat, note: l.note });

/** Entrega las entradas de un pedido pagado (idempotente). */
export function fulfill(orderId, ref) {
  return tx(() => {
    const o = q.get("SELECT * FROM orders WHERE id = ?", orderId);
    if (!o || o.status === "paid") return o;
    q.run("UPDATE orders SET status = 'paid', provider_ref = COALESCE(?, provider_ref) WHERE id = ?", ref ?? null, orderId);
    for (let i = 0; i < o.qty; i++) q.run("INSERT INTO tickets (id, order_id, owner_id, event_id, type, code, created_at) VALUES (?,?,?,?,?,?,?)", id(12), orderId, o.buyer_id, o.event_id, o.type, `${o.code}-${i + 1}`, now());
    if (o.listing_id) {
      const l = q.get("SELECT seller_id FROM listings WHERE id = ?", o.listing_id);
      const ev = getEvent(o.event_id);
      q.run("INSERT INTO seller_payouts (id, seller_id, order_id, amount_cents, release_at) VALUES (?,?,?,?,?)", id(12), l.seller_id, orderId, Math.round(o.subtotal_cents * (1 - config.feeSeller)), new Date(ev.date).getTime() + config.payoutDelayDays * 864e5);
    }
    const buyer = q.get("SELECT name, email FROM users WHERE id = ?", o.buyer_id);
    if (o.fee_cents > 0) issueInvoice({ kind: "service", orderId, party: buyer, partyId: o.buyer_id, grossCents: o.fee_cents, concept: `Gastos de gestión · pedido ${o.code}` });
    if (o.listing_id) {
      const sl = q.get("SELECT u.id, u.name, u.email FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.id = ?", o.listing_id);
      issueInvoice({ kind: "commission", orderId, party: sl, partyId: sl.id, grossCents: o.subtotal_cents - Math.round(o.subtotal_cents * (1 - config.feeSeller)), concept: `Comisión de venta · pedido ${o.code}` });
    }
    audit(o.buyer_id, "order_paid", { orderId });
    return q.get("SELECT * FROM orders WHERE id = ?", orderId);
  });
}


/* ═══ Estado ═══ */
on("GET", "/api/health", () => ({ ok: true, payments: pay.mode(), time: now() }));

/* ═══ Auth ═══ */
on("POST", "/api/auth/register", async (c) => {
  const { user, session } = await A.register(c.body, c.req);
  c.headers["set-cookie"] = A.cookie(session.token, session.exp);
  return { user: publicUser(user) };
});
on("POST", "/api/auth/login", async (c) => {
  const { user, session } = await A.login(c.body, c.req);
  c.headers["set-cookie"] = A.cookie(session.token, session.exp);
  return { user: publicUser(user) };
});
on("POST", "/api/auth/logout", (c) => { A.destroySession(c.req); c.headers["set-cookie"] = A.clearCookie(); return { ok: true }; });
on("GET", "/api/auth/me", (c) => ({ user: c.user ? publicUser(c.user) : null }));
on("POST", "/api/auth/forgot", async (c) => {
  const email = String(c.body.email ?? "").trim().toLowerCase();
  if (A.limited(`forgot:${c.req.ip}`, 5, 3600e3)) throw new HttpError(429, "Demasiadas solicitudes. Inténtalo más tarde.");
  const u = EMAIL_RE.test(email) && q.get("SELECT id, name FROM users WHERE email = ?", email);
  if (u) {
    const token = A.createToken(u.id, "reset", 3600e3);
    await sendMail({ to: email, subject: "Restablece tu contraseña de Handticket", text: `Hola ${u.name},\n\nPara crear una contraseña nueva entra aquí (caduca en 1 hora):\n${config.publicUrl}/#/restablecer/${token}\n\nSi no lo has pedido tú, ignora este mensaje.` });
  }
  return { ok: true }; // misma respuesta exista o no el email
});
on("POST", "/api/auth/reset", async (c) => { await A.resetPassword(c.body.token, c.body.password); return { ok: true }; });
on("POST", "/api/auth/password", async (c) => { await A.changePassword(need(c), c.body); return { ok: true }; });

/* ═══ Cuenta ═══ */
on("PATCH", "/api/me", (c) => {
  const u = need(c), name = String(c.body.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) throw new HttpError(400, "Nombre no válido", "name");
  q.run("UPDATE users SET name = ? WHERE id = ?", name, u.id);
  return { user: publicUser({ ...u, name }) };
});
on("DELETE", "/api/me", async (c) => {
  const u = need(c);
  if (q.get("SELECT 1 FROM orders o JOIN events e ON e.id = o.event_id WHERE o.buyer_id = ? AND o.status = 'paid' AND e.starts_at > ?", u.id, now())) throw new HttpError(409, "Tienes entradas de eventos futuros. Revéndelas antes de borrar la cuenta.");
  if (q.get("SELECT 1 FROM seller_payouts WHERE seller_id = ? AND status = 'held'", u.id)) throw new HttpError(409, "Tienes cobros pendientes de liquidar.");
  q.run("UPDATE listings SET status = 'removed' WHERE seller_id = ?", u.id);
  const anon = `deleted-${u.id}@invalid`;
  q.run("UPDATE users SET name = 'Cuenta eliminada', email = ?, pass_hash = '!' WHERE id = ?", anon, u.id);
  q.run("DELETE FROM sessions WHERE user_id = ?", u.id); q.run("DELETE FROM payout_accounts WHERE user_id = ?", u.id);
  audit(u.id, "account_deleted"); c.headers["set-cookie"] = A.clearCookie();
  return { ok: true };
});
on("GET", "/api/me/payout", (c) => {
  const p = q.get("SELECT holder, last4 FROM payout_accounts WHERE user_id = ?", need(c).id);
  return { payout: p ?? null };
});
on("PUT", "/api/me/payout", (c) => {
  const u = need(c), holder = String(c.body.holder ?? "").trim(), iban = String(c.body.iban ?? "").replace(/\s/g, "").toUpperCase();
  if (holder.length < 3 || holder.length > 100) throw new HttpError(400, "Nombre y apellidos del titular", "holder");
  if (!/^ES\d{22}$/.test(iban) || !ibanOk(iban)) throw new HttpError(400, "IBAN no válido", "iban");
  const iv = crypto.randomBytes(12), ci = crypto.createCipheriv("aes-256-gcm", config.dataKey, iv), enc = Buffer.concat([ci.update(iban, "utf8"), ci.final()]);
  const blob = Buffer.concat([iv, ci.getAuthTag(), enc]).toString("base64");
  q.run("INSERT INTO payout_accounts (user_id, holder, iban_enc, last4, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET holder=excluded.holder, iban_enc=excluded.iban_enc, last4=excluded.last4, updated_at=excluded.updated_at", u.id, holder, blob, iban.slice(-4), now());
  audit(u.id, "payout_updated", null, c.req.ip);
  return { payout: { holder, last4: iban.slice(-4) } };
});
function ibanOk(iban) { // módulo 97
  const r = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (ch) => ch.charCodeAt(0) - 55);
  let rem = 0; for (const d of r) rem = (rem * 10 + +d) % 97; return rem === 1;
}

/* ═══ Eventos ═══ */
on("GET", "/api/events", () => ({ events: q.all("SELECT data FROM events ORDER BY starts_at").map(eventRow) }));
on("GET", "/api/events/:id", (c) => {
  const e = getEvent(c.params.id); if (!e) throw new HttpError(404, "Evento no encontrado");
  const ls = q.all("SELECT l.*, u.name seller FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.event_id = ? AND l.status = 'active' AND l.qty_left > 0 ORDER BY l.price_cents", e.id);
  return { event: e, listings: ls.map((l) => ({ ...listingOut(l), seller: l.seller.split(" ")[0] })) };
});

/* ═══ Anuncios (vender) ═══ */
on("GET", "/api/me/listings", (c) => ({ listings: q.all("SELECT * FROM listings WHERE seller_id = ? AND status != 'removed' ORDER BY created_at DESC", need(c).id).map(listingOut) }));
on("POST", "/api/listings", (c) => {
  const u = need(c), b = c.body, e = getEvent(b.event);
  if (!e) throw new HttpError(400, "Evento no válido");
  if (new Date(e.date).getTime() < now()) throw new HttpError(400, "El evento ya ha pasado");
  const type = e.tickets.find((t) => t.n === b.type); if (!type) throw new HttpError(400, "Tipo de entrada no válido");
  const qty = int(b.qty, 1, 10, "Cantidad no válida"), price = cents(b.price), orig = cents(b.orig);
  if (!(orig > 0) || !(price > 0)) throw new HttpError(400, "Indica el precio original y el de venta");
  if (price > Math.round(orig * config.maxMarkup)) throw new HttpError(400, `El precio no puede superar el ${Math.round(config.maxMarkup * 100)} % del original`, "price");
  if (!q.get("SELECT 1 FROM payout_accounts WHERE user_id = ?", u.id)) throw new HttpError(400, "Añade tu información de pago para poder cobrar", "payout");
  const pages = Array.isArray(b.pages) ? b.pages.slice(0, 50).map((p) => ({ file: String(p.file ?? "").slice(0, 120), page: +p.page || 1, hash: String(p.hash ?? "").slice(0, 64) })) : [];
  for (const p of pages) if (p.hash && q.get("SELECT 1 FROM listings WHERE status = 'active' AND pages LIKE ?", `%${p.hash}%`)) throw new HttpError(409, "Una de las entradas ya está publicada");
  const lid = id(10).toUpperCase();
  q.run("INSERT INTO listings (id, seller_id, event_id, type, qty, qty_left, price_cents, orig_cents, zone, row, seat, note, nominative, pages, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    lid, u.id, e.id, type.n, qty, qty, price, orig, str(b.zone), str(b.row), str(b.seat), str(b.note, 500), b.nominative ? 1 : 0, JSON.stringify(pages), now());
  audit(u.id, "listing_created", { lid }, c.req.ip);
  return { listing: listingOut(q.get("SELECT * FROM listings WHERE id = ?", lid)) };
});
const str = (v, n = 80) => (v == null || v === "" ? null : String(v).slice(0, n));
on("PATCH", "/api/listings/:id", (c) => {
  const u = need(c), l = q.get("SELECT * FROM listings WHERE id = ? AND seller_id = ? AND status = 'active'", c.params.id, u.id);
  if (!l) throw new HttpError(404, "Anuncio no encontrado");
  const price = cents(c.body.price);
  if (!(price > 0) || price > Math.round(l.orig_cents * config.maxMarkup)) throw new HttpError(400, "Precio no válido", "price");
  q.run("UPDATE listings SET price_cents = ? WHERE id = ?", price, l.id);
  return { listing: listingOut({ ...l, price_cents: price }) };
});
on("DELETE", "/api/listings/:id", (c) => {
  const u = need(c), l = q.get("SELECT * FROM listings WHERE id = ? AND seller_id = ? AND status = 'active'", c.params.id, u.id);
  if (!l) throw new HttpError(404, "Anuncio no encontrado");
  if (l.qty_left < l.qty) throw new HttpError(409, "Ya hay entradas vendidas: debes entregarlas");
  q.run("UPDATE listings SET status = 'removed' WHERE id = ?", l.id);
  return { ok: true };
});

/* ═══ Pedidos y entradas ═══ */
on("POST", "/api/orders", async (c) => {
  const u = need(c), b = c.body;
  if (A.limited(`order:${u.id}`, 20, 600e3)) throw new HttpError(429, "Demasiados intentos");
  const e = getEvent(b.event); if (!e) throw new HttpError(400, "Evento no válido");
  if (new Date(e.date).getTime() < now()) throw new HttpError(400, "El evento ya ha pasado");
  const qty = int(b.qty, 1, 6, "Puedes comprar entre 1 y 6 entradas");
  let type, unit, listing = null;
  if (b.listingId) {
    listing = q.get("SELECT * FROM listings WHERE id = ? AND status = 'active'", String(b.listingId));
    if (!listing || listing.event_id !== e.id) throw new HttpError(404, "El anuncio ya no está disponible");
    if (listing.seller_id === u.id) throw new HttpError(400, "No puedes comprar tu propio anuncio");
    if (listing.qty_left < qty) throw new HttpError(409, `Solo quedan ${listing.qty_left} entradas en este anuncio`);
    type = e.tickets.find((t) => t.n === listing.type); unit = listing.price_cents;
  } else { // anuncios de demostración del catálogo: precio fijado por el servidor
    type = e.tickets.find((t) => t.n === b.type); if (!type?.list) throw new HttpError(400, "Tipo de entrada no disponible");
    unit = cents(type.from);
    const u2 = cents(b.unitPrice); // el catálogo de demostración puede traer su propio precio dentro de un rango razonable
    if (u2 && u2 >= unit * 0.5 && u2 <= unit * 2) unit = u2;
  }
  let subtotal = unit * qty, fee = Math.round(subtotal * config.feeBuyer), total = subtotal + fee;
  if (b.feeIncluded) { total = subtotal; fee = total - Math.round(total / (1 + config.feeBuyer)); subtotal = total - fee; }
  const oid = id(12), code = `HT-${id(6).toUpperCase().replace(/[-_]/g, "X")}`;
  tx(() => {
    if (listing) {
      const r = q.run("UPDATE listings SET qty_left = qty_left - ?, status = CASE WHEN qty_left - ? = 0 THEN 'sold' ELSE status END WHERE id = ? AND qty_left >= ? AND status = 'active'", qty, qty, listing.id, qty);
      if (!r.changes) throw new HttpError(409, "Otra persona acaba de comprar estas entradas");
    }
    q.run("INSERT INTO orders (id, buyer_id, listing_id, event_id, type, qty, subtotal_cents, fee_cents, total_cents, status, code, created_at) VALUES (?,?,?,?,?,?,?,?,?,'pending',?,?)", oid, u.id, listing?.id ?? null, e.id, type.n, qty, subtotal, fee, total, code, now());
  });
  let res;
  try { res = await pay.charge({ orderId: oid, totalCents: total, description: `${e.name} · ${type.n} ×${qty}`, email: u.email }); }
  catch (err) { cancelOrder(oid); console.error(err); throw new HttpError(502, "No hemos podido iniciar el pago"); }
  q.run("UPDATE orders SET provider = ?, provider_ref = ? WHERE id = ?", res.provider, res.ref, oid);
  if (res.status === "paid") fulfill(oid, res.ref);
  return { order: orderOut(q.get("SELECT * FROM orders WHERE id = ?", oid)), checkoutUrl: res.url ?? null };
});
function cancelOrder(oid) {
  tx(() => {
    const o = q.get("SELECT * FROM orders WHERE id = ?", oid);
    if (!o || o.status !== "pending") return;
    q.run("UPDATE orders SET status = 'failed' WHERE id = ?", oid);
    if (o.listing_id) q.run("UPDATE listings SET qty_left = qty_left + ?, status = 'active' WHERE id = ?", o.qty, o.listing_id);
  });
}
const orderOut = (o) => ({ id: o.id, ev: o.event_id, type: o.type, qty: o.qty, total: eur(o.total_cents), subtotal: eur(o.subtotal_cents), fee: eur(o.fee_cents), code: o.code, status: o.status, at: o.created_at });
on("GET", "/api/me/orders", (c) => ({ orders: q.all("SELECT * FROM orders WHERE buyer_id = ? AND status = 'paid' ORDER BY created_at DESC", need(c).id).map(orderOut) }));
on("GET", "/api/me/tickets", (c) => ({ tickets: q.all("SELECT id, event_id ev, type, code, status, created_at at FROM tickets WHERE owner_id = ? ORDER BY created_at DESC", need(c).id) }));
on("GET", "/api/me/payouts", (c) => ({ payouts: q.all("SELECT id, order_id, amount_cents, status, release_at FROM seller_payouts WHERE seller_id = ? ORDER BY release_at DESC", need(c).id).map((p) => ({ ...p, amount: eur(p.amount_cents) })) }));

/* ═══ Webhook de Stripe ═══ */
on("POST", "/api/webhooks/stripe", (c) => {
  if (!pay.verifyStripe(c.raw, c.req.headers["stripe-signature"])) throw new HttpError(400, "Firma no válida");
  const ev = JSON.parse(c.raw), obj = ev.data?.object, oid = obj?.client_reference_id ?? obj?.metadata?.order_id;
  if (oid && ev.type === "checkout.session.completed" && obj.payment_status === "paid") fulfill(oid, obj.payment_intent);
  if (oid && ev.type === "checkout.session.expired") cancelOrder(oid);
  return { received: true };
});
