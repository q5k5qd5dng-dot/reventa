// Prueba de humo de la API: arranca el servidor con una BD temporal y recorre registro → venta → compra.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";

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
  console.log(`\n${n} pruebas OK`);
} catch (e) { console.error("\n✗ FALLO:", e.message, e.actual ?? "", e.expected ?? ""); process.exitCode = 1; }
finally { srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
