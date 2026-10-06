import fs from "node:fs";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.mjs";

export const db = new DatabaseSync(config.dbFile);
db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

export const id = (n = 12) => crypto.randomBytes(n).toString("base64url").slice(0, n);
export const now = () => Date.now();
export const q = {
  get: (sql, ...a) => db.prepare(sql).get(...a),
  all: (sql, ...a) => db.prepare(sql).all(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};
export function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; }
}
export const audit = (userId, action, meta, ip) => q.run("INSERT INTO audit_log (user_id, action, meta, ip, at) VALUES (?,?,?,?,?)", userId ?? null, action, meta ? JSON.stringify(meta) : null, ip ?? null, now());

/** Carga/actualiza los eventos desde server/seed-events.json (generado con `npm run seed:export`). */
export function seedEvents() {
  const f = new URL("./seed-events.json", import.meta.url);
  if (!fs.existsSync(f)) return console.warn("[db] falta server/seed-events.json: ejecuta `npm run seed:export`");
  const list = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const e of list) q.run("INSERT INTO events (id, data, starts_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, starts_at=excluded.starts_at", e.id, JSON.stringify(e), new Date(e.date).getTime());
  console.log(`[db] ${list.length} eventos cargados`);
}
