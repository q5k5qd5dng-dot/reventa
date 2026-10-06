// Datos de demostración realistas para el panel de administración (120 días de actividad).
// Uso: npm run seed:demo        (añade --reset para vaciar antes)
import { db, q, id, now, seedEvents } from "./db.mjs";
import { hashPassword } from "./auth.mjs";
import { issueInvoice, creditNote } from "./invoices.mjs";
import { config } from "./config.mjs";

if (process.argv.includes("--reset")) for (const t of ["risk_resolutions", "support_messages", "support_tickets", "invoices", "seller_payouts", "tickets", "orders", "listings", "payout_accounts", "audit_log", "sessions", "tokens", "users"]) db.exec(`DELETE FROM ${t}`);
if (q.get("SELECT COUNT(*) n FROM users").n > 5) { console.log("Ya hay datos. Usa --reset para regenerar."); process.exit(0); }
seedEvents();

let seed = 20261006; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)], int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const weighted = (items, w) => { let t = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) if ((t -= w[i]) < 0) return items[i]; return items.at(-1); };
const first = ["Lucía", "Pablo", "Marta", "Carlos", "Sofía", "Hugo", "Elena", "Álvaro", "Paula", "Diego", "Carmen", "Javier", "Laura", "Adrián", "Irene", "Sergio", "Noa", "Mario", "Claudia", "Rubén", "Alba", "Iván", "Nerea", "Óscar", "Julia", "Dani", "Ana", "Raúl", "Eva", "Jorge"];
const last = ["García", "Martín", "López", "Sánchez", "Pérez", "Gómez", "Ruiz", "Hernández", "Díaz", "Moreno", "Muñoz", "Álvarez", "Romero", "Navarro", "Torres", "Domínguez", "Gil", "Vázquez", "Serrano", "Blanco", "Ortega", "Marín", "Soler", "Iglesias"];
const DAY = 864e5, T = now(), START = T - 120 * DAY;
const hp = await hashPassword("demo-password-1");

// Administrador de demostración
q.run("INSERT INTO users (id, name, email, pass_hash, role, created_at, last_login_at) VALUES (?,?,?,?,?,?,?)", "admin-demo", "Daniel (admin)", "admin@handticket.es", await hashPassword("admin1234"), "admin", START, T - 36e5);

// Usuarios con crecimiento acelerado y estacionalidad
const users = [];
const dayWeight = (d) => 0.6 + (d / 120) * 1.8 + (new Date(START + d * DAY).getDay() % 6 === 5 ? 0.5 : 0);
for (let i = 0; i < 420; i++) {
  const d = weighted([...Array(120).keys()], [...Array(120).keys()].map(dayWeight)), t = START + d * DAY + int(8, 23) * 36e5 + int(0, 59) * 6e4, name = `${pick(first)} ${pick(last)}`;
  const uid = id(14); q.run("INSERT INTO users (id, name, email, pass_hash, created_at, last_login_at, banned_at) VALUES (?,?,?,?,?,?,?)", uid, name, `${name.normalize("NFD").replace(/[^\w ]/g, "").toLowerCase().replace(/ /g, ".")}${int(1, 99)}@${pick(["gmail.com", "hotmail.es", "outlook.es", "icloud.com", "yahoo.es"])}`, hp, t, Math.min(T, t + int(0, 60) * DAY), i === 7 || i === 61 ? T - 5 * DAY : null);
  users.push({ id: uid, name, t });
}
const events = q.all("SELECT data FROM events").map((r) => JSON.parse(r.data));
const evW = events.map((e) => ({ "gira-verano": 5, "duro-festival": 6, "viva-noche": 2.5, "jornada-12": 3, "noche-techno": 3.5, "rey-escena": 2, "copa-europa": 4, "sunset-sessions": 2.5 })[e.id] ?? 2);

// Vendedores (≈22 % de usuarios) con IBAN
const sellers = users.filter(() => rnd() < 0.22);
const ibanEnc = Buffer.from("demo").toString("base64");
for (const s of sellers) q.run("INSERT INTO payout_accounts (user_id, holder, iban_enc, last4, updated_at) VALUES (?,?,?,?,?)", s.id, s.name, ibanEnc, String(int(1000, 9999)), s.t);

// Anuncios
const listings = [];
for (let i = 0; i < 780; i++) {
  const s = pick(sellers), e = weighted(events, evW), tt = pick(e.tickets), t = Math.min(T - 3600e3, Math.max(s.t + 36e5, START + rnd() ** 0.8 * (T - START)));
  const orig = Math.round(tt.from * (0.78 + rnd() * 0.3)) * 100, mk = weighted([0.85, 0.95, 1, 1.05, 1.12, 1.2, 1.26], [1, 2, 6, 4, 3, 1.3, 0.6]), qty = weighted([1, 2, 3, 4], [4, 6, 2, 1]);
  const lid = id(10).toUpperCase(); const price = Math.round(orig * mk);
  q.run("INSERT INTO listings (id, seller_id, event_id, type, qty, qty_left, price_cents, orig_cents, status, created_at, pages) VALUES (?,?,?,?,?,?,?,?,?,?,?)", lid, s.id, e.id, tt.n, qty, qty, price, orig, "active", t, "[]");
  listings.push({ id: lid, s, e, tt, qty, left: qty, price, t });
}
// Pedidos (≈58 % de los anuncios se venden en 1-2 pedidos) + pedidos del catálogo
const orders = [];
const mkOrder = (b, e, tt, qty, unit, listing, t, status) => {
  const sub = unit * qty, fee = Math.round(sub * config.feeBuyer), total = sub + fee, oid = id(12), code = `HT-${id(6).toUpperCase().replace(/[-_]/g, "X")}`;
  q.run("INSERT INTO orders (id, buyer_id, listing_id, event_id, type, qty, subtotal_cents, fee_cents, total_cents, status, code, provider, provider_ref, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", oid, b.id, listing?.id ?? null, e.id, tt.n, qty, sub, fee, total, status, code, "mock", `mock_${oid}`, t);
  for (let k = 0; k < qty; k++) q.run("INSERT INTO tickets (id, order_id, owner_id, event_id, type, code, status, created_at) VALUES (?,?,?,?,?,?,?,?)", id(12), oid, b.id, e.id, tt.n, `${code}-${k + 1}`, status === "refunded" ? "void" : "valid", t);
  issueInvoice({ kind: "service", orderId: oid, party: b, partyId: b.id, grossCents: fee, concept: `Gastos de gestión · pedido ${code}`, at: t });
  if (listing) {
    const comm = sub - Math.round(sub * (1 - config.feeSeller)); issueInvoice({ kind: "commission", orderId: oid, party: listing.s, partyId: listing.s.id, grossCents: comm, concept: `Comisión de venta · pedido ${code}`, at: t });
    const age = (T - t) / DAY, st = status === "refunded" ? "cancelled" : age > 45 ? "paid" : age > 25 ? "released" : "held";
    q.run("INSERT INTO seller_payouts (id, seller_id, order_id, amount_cents, status, release_at) VALUES (?,?,?,?,?,?)", id(12), listing.s.id, oid, Math.round(sub * (1 - config.feeSeller)), st, t + (rnd() < 0.15 ? 30 : 20) * DAY);
  }
  if (status === "refunded") for (const i of q.all("SELECT * FROM invoices WHERE order_id=? AND kind!='credit'", oid)) creditNote(i, `Abono por reembolso del pedido ${code}`, t + int(1, 3) * DAY);
  orders.push(oid); return oid;
};
const hourW = [1, 1, 1, 0.5, 0.3, 0.3, 0.5, 1, 2, 3, 3.5, 4, 5, 5, 4, 4, 4.5, 5, 6, 7.5, 9, 10, 8, 4];
const when = (min) => { const dayIdx = weighted([...Array(120).keys()].filter((d) => START + d * DAY >= min), [...Array(120).keys()].filter((d) => START + d * DAY >= min).map((d) => dayWeight(d) * (1 + (new Date(START + d * DAY).getDay() % 6 === 5 ? 0.4 : 0)))); return START + dayIdx * DAY + weighted([...Array(24).keys()], hourW) * 36e5 + int(0, 59) * 6e4 + int(0, 59) * 1e3; };
const buyersPool = users.filter((u) => !sellers.includes(u) || rnd() < 0.4), heavy = users.slice(0, 40);
const buyer = (t) => { for (let i = 0; i < 20; i++) { const b = rnd() < 0.22 ? pick(heavy) : pick(buyersPool); if (b.t < t) return b; } return pick(users.filter((u) => u.t < t)) ?? users[0]; };
for (const l of listings) {
  if (rnd() > 0.62) continue;
  let left = l.qty;
  while (left > 0 && rnd() < 0.8) {
    const qy = Math.min(left, int(1, left)), t = Math.max(l.t + int(10, 3000) * 6e4, 0); if (t > T - 6e4) break;
    const b = buyer(t); if (b.id === l.s.id) continue;
    const refunded = rnd() < 0.032; mkOrder(b, l.e, l.tt, qy, l.price, l, t, refunded ? "refunded" : "paid");
    if (!refunded) left -= qy;
    if (refunded) l.left += 0;
  }
  q.run("UPDATE listings SET qty_left=?, status=? WHERE id=?", left, left === 0 ? "sold" : "active", l.id);
}
for (let i = 0; i < 480; i++) { // catálogo (anuncios de demostración sin vendedor)
  const e = weighted(events, evW), tt = pick(e.tickets.filter((x) => x.list)), t = when(START), b = buyer(t);
  mkOrder(b, e, tt, weighted([1, 2, 3, 4, 5, 6], [10, 9, 4, 3, 1, 0.5]), Math.round(tt.from * (0.9 + rnd() * 0.5)) * 100, null, t, rnd() < 0.028 ? "refunded" : "paid");
}
// Anuncios sospechosos y cuentas nuevas con muchos anuncios
const shady = users.filter((u) => u.t > T - 2 * DAY).slice(0, 1).concat(users.slice(-2, -1));
for (const s of shady) { q.run("INSERT OR IGNORE INTO payout_accounts (user_id, holder, iban_enc, last4, updated_at) VALUES (?,?,?,?,?)", s.id, s.name, ibanEnc, "4242", T); for (let i = 0; i < 4; i++) { const e = pick(events), tt = pick(e.tickets); q.run("INSERT INTO listings (id, seller_id, event_id, type, qty, qty_left, price_cents, orig_cents, status, created_at, pages) VALUES (?,?,?,?,?,?,?,?,?,?,?)", id(10).toUpperCase(), s.id, e.id, tt.n, 2, 2, Math.round(tt.from * 130), Math.round(tt.from * 100), "active", T - int(1, 30) * 36e5, "[]"); } }
for (let i = 0; i < 9; i++) q.run("INSERT INTO audit_log (user_id, action, meta, ip, at) VALUES (NULL,'login_failed',?,?,?)", JSON.stringify({ email: "victima@gmail.com" }), "185.220.101.7", T - int(1, 90) * 6e4);
// Soporte
const subjects = [["Mi entrada no funciona en la puerta", "pedido", "high"], ["¿Cuándo cobro mi venta?", "vendedor", "normal"], ["No me llega el email de confirmación", "cuenta", "normal"], ["Quiero cambiar el titular del IBAN", "vendedor", "normal"], ["Reembolso de un evento cancelado", "pago", "normal"], ["El comprador no responde al cambio de nombre", "vendedor", "normal"], ["Cargo duplicado en mi tarjeta", "pago", "high"], ["No puedo subir mi PDF", "vendedor", "normal"], ["Duda sobre las comisiones", "general", "normal"], ["El QR aparece como inválido", "pedido", "high"], ["Cómo borro mi cuenta", "cuenta", "normal"], ["Mi anuncio fue rechazado, ¿por qué?", "vendedor", "normal"]];
for (let i = 0; i < 26; i++) {
  const [subject, category, priority] = pick(subjects), u = pick(users), t = T - int(0, 20) * DAY - int(0, 20) * 36e5, status = i < 7 ? "open" : i < 12 ? "pending" : "solved", tid = id(8).toUpperCase();
  q.run("INSERT INTO support_tickets (id, user_id, email, subject, category, priority, status, order_code, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)", tid, u.id, q.get("SELECT email FROM users WHERE id=?", u.id).email, subject, category, priority, status, null, t, t + (status === "open" ? 0 : 36e5 * int(1, 20)));
  q.run("INSERT INTO support_messages (ticket_id, author, author_name, body, at) VALUES (?,?,?,?,?)", tid, "user", u.name, `Hola, ${subject.toLowerCase()}. Os escribo porque necesito ayuda cuanto antes, gracias.`, t);
  if (status !== "open") q.run("INSERT INTO support_messages (ticket_id, author, author_name, body, at) VALUES (?,?,?,?,?)", tid, "admin", "Daniel (admin)", "¡Hola! Lo estamos revisando y te respondemos en breve con la solución.", t + 36e5);
}
console.log(`✓ Demo: ${users.length + 1} usuarios · ${listings.length} anuncios · ${orders.length} pedidos · ${q.get("SELECT COUNT(*) n FROM invoices").n} facturas`);
console.log("  Admin → admin@handticket.es / admin1234");
