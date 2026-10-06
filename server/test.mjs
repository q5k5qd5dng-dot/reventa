// Prueba de humo de la API: arranca el servidor con una BD temporal y recorre registro → venta → compra.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ht-"));
const port = 8900 + Math.floor(Math.random() * 90), base = `http://localhost:${port}`;
const srv = spawn("node", ["server/index.mjs"], { env: { ...process.env, PORT: String(port), DATA_DIR: dir, PUBLIC_URL: base, STRIPE_SECRET_KEY: "" }, stdio: ["ignore", "pipe", "inherit"] });
await new Promise((r) => srv.stdout.on("data", (d) => String(d).includes("en http") && r()));

const jar = {};
const call = async (who, method, url, body) => {
  const r = await fetch(base + url, { method, headers: { "content-type": "application/json", cookie: jar[who] ?? "" }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get("set-cookie"); if (sc) jar[who] = sc.split(";")[0];
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
let n = 0; const ok = (m) => console.log(`✓ ${++n}. ${m}`);
try {
  assert.equal((await call("a", "GET", "/api/health")).ok, true); ok("health");
  assert.equal((await call("a", "POST", "/api/auth/register", { name: "Ana Vendedora", email: "ana@test.es", password: "corta" })).status, 400); ok("registro rechaza contraseña corta");
  assert.equal((await call("a", "POST", "/api/auth/register", { name: "Ana Vendedora", email: "ana@test.es", password: "contraseña-segura" })).status, 200); ok("registro");
  assert.equal((await call("x", "POST", "/api/auth/register", { name: "Ana", email: "ANA@test.es", password: "contraseña-segura" })).status, 409); ok("email duplicado");
  assert.equal((await call("a", "GET", "/api/auth/me")).user.email, "ana@test.es"); ok("sesión por cookie");
  assert.equal((await call("b", "POST", "/api/auth/login", { email: "ana@test.es", password: "mala-clave-1" })).status, 401); ok("login con clave incorrecta");
  assert.equal((await call("b", "POST", "/api/auth/login", { email: "ana@test.es", password: "contraseña-segura" })).status, 200); ok("login");
  const ev = (await call("a", "GET", "/api/events")).events; assert.ok(ev.length >= 8); ok(`${ev.length} eventos`);
  const e = ev.find((x) => x.id === "duro-festival"), type = e.tickets[0].n;
  assert.equal((await call("a", "POST", "/api/listings", { event: e.id, type, qty: 2, orig: 50, price: 60 })).status, 400); ok("sin IBAN no se publica");
  assert.equal((await call("a", "PUT", "/api/me/payout", { holder: "Ana Vendedora", iban: "ES0000000000000000000000" })).status, 400); ok("IBAN inválido");
  assert.equal((await call("a", "PUT", "/api/me/payout", { holder: "Ana Vendedora", iban: "ES91 2100 0418 4502 0005 1332" })).payout.last4, "1332"); ok("IBAN guardado cifrado");
  assert.equal((await call("a", "POST", "/api/listings", { event: e.id, type, qty: 2, orig: 50, price: 70 })).status, 400); ok("límite 130 %");
  const l = (await call("a", "POST", "/api/listings", { event: e.id, type, qty: 2, orig: 50, price: 60 })).listing; assert.equal(l.qty, 2); ok("anuncio publicado");
  await call("c", "POST", "/api/auth/register", { name: "Carlos Comprador", email: "carlos@test.es", password: "otra-contraseña-1" });
  assert.equal((await call("a", "POST", "/api/orders", { event: e.id, qty: 1, listingId: l.id })).status, 400); ok("no puedes comprar lo tuyo");
  const o = await call("c", "POST", "/api/orders", { event: e.id, qty: 2, listingId: l.id }); assert.equal(o.order.status, "paid"); assert.equal(o.order.total, 129.6); ok("compra pagada (120 + 8 % = 129,60 €)");
  assert.equal((await call("c", "POST", "/api/orders", { event: e.id, qty: 1, listingId: l.id })).status, 404); ok("anuncio agotado");
  assert.equal((await call("c", "GET", "/api/me/tickets")).tickets.length, 2); ok("2 entradas con QR");
  assert.equal((await call("a", "GET", "/api/me/payouts")).payouts[0].amount, 108); ok("cobro retenido (120 − 10 % = 108 €)");
  assert.equal((await call("x", "GET", "/api/me/tickets")).status, 401); ok("rutas privadas protegidas");
  await call("a", "POST", "/api/auth/logout"); assert.equal((await call("a", "GET", "/api/auth/me")).user, null); ok("logout");
  // ── Panel de administración ──
  assert.equal((await call("c", "GET", "/api/admin/overview")).status, 403); ok("el panel rechaza a usuarios normales");
  assert.equal((await call("x", "GET", "/api/admin/overview")).status, 401); ok("el panel exige sesión");
  execFileSync("node", ["server/admin-cli.mjs", "root@test.es", "administrador-1"], { env: { ...process.env, DATA_DIR: dir }, stdio: "ignore" });
  assert.equal((await call("r", "POST", "/api/auth/login", { email: "root@test.es", password: "administrador-1" })).user.role, "admin"); ok("login de administrador");
  const ov = await call("r", "GET", "/api/admin/overview?days=30"); assert.equal(ov.cur.orders, 1); assert.equal(ov.cur.gmv, 120); assert.equal(ov.cur.revenue, 21.6 + 0); ok(`overview: GMV 120 €, ingresos ${ov.cur.revenue} € (8 % + 10 %)`);
  const inv = await call("r", "GET", "/api/admin/invoices"); assert.equal(inv.total, 2); assert.equal(inv.totals.total, 21.6); assert.match(inv.rows[0].number, /^HT-\d{4}-000002$/); ok("2 facturas emitidas y numeradas (gestión + comisión)");
  const ord = (await call("r", "GET", "/api/admin/orders")).rows[0];
  assert.equal((await call("r", "POST", `/api/admin/orders/${ord.id}/refund`, { reason: "prueba" })).ok, true); ok("reembolso desde el panel");
  assert.equal((await call("r", "GET", "/api/admin/invoices")).total, 4); ok("facturas de abono generadas");
  assert.equal((await call("c", "GET", "/api/me/tickets")).tickets.every((t) => t.status === "void"), true); ok("entradas anuladas tras el reembolso");
  assert.equal((await call("r", "GET", "/api/admin/payouts?status=cancelled")).rows.length, 1); ok("cobro del vendedor cancelado");
  const ps = (await call("r", "PUT", "/api/admin/settings", { feeBuyer: 0.05 })).values; assert.equal(ps.feeBuyer, 0.05); ok("ajustes editables en caliente");
  const tk = await call("c", "POST", "/api/support", { subject: "Mi entrada no funciona", message: "Me han rechazado el QR en la puerta" }); assert.ok(tk.id); ok("ticket de soporte creado por el usuario");
  assert.equal((await call("r", "GET", "/api/admin/support")).rows[0].priority, "high"); ok("ticket marcado como prioritario");
  assert.equal((await call("r", "POST", `/api/admin/support/${tk.id}/reply`, { body: "Lo revisamos ahora mismo", solve: true })).ok, true); ok("respuesta de soporte");
  const cu = (await call("c", "GET", "/api/auth/me")).user;
  assert.equal((await call("r", "POST", `/api/admin/users/${cu.id}/ban`, { ban: true })).ok, true); assert.equal((await call("c", "GET", "/api/auth/me")).user, null); ok("suspensión cierra sesiones");
  assert.equal((await call("c", "POST", "/api/auth/login", { email: "carlos@test.es", password: "otra-contraseña-1" })).status, 403); ok("cuenta suspendida no puede entrar");
  assert.ok((await call("r", "GET", "/api/admin/audit")).total > 5); ok("auditoría registra las acciones");
  console.log(`\n${n} pruebas OK`);
} catch (e) { console.error("\n✗ FALLO:", e.message, e.actual ?? "", e.expected ?? ""); process.exitCode = 1; }
finally { srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
