import crypto from "node:crypto";
import { config } from "./config.mjs";
import { q, id, now, tx, audit } from "./db.mjs";

/* ── contraseñas: scrypt con sal por usuario ── */
const N = 16384, KEYLEN = 64;
const scrypt = (pw, salt, n = N) => new Promise((res, rej) => crypto.scrypt(pw.normalize("NFKC"), salt, KEYLEN, { N: n, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${N}$${salt.toString("base64")}$${(await scrypt(pw, salt)).toString("base64")}`;
}
export async function verifyPassword(pw, stored) {
  const [alg, n, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const k = await scrypt(pw, Buffer.from(salt, "base64"), +n), h = Buffer.from(hash, "base64");
  return k.length === h.length && crypto.timingSafeEqual(k, h);
}
const DUMMY = await hashPassword("dummy-password"); // evita revelar si el email existe por tiempo de respuesta

/* ── sesiones: token aleatorio en cookie HttpOnly; en BD solo su hash ── */
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
export const COOKIE = "ht_session";
export function createSession(userId, req) {
  const token = crypto.randomBytes(32).toString("base64url");
  const exp = now() + config.sessionDays * 864e5;
  q.run("INSERT INTO sessions (id, user_id, expires_at, ip, ua, created_at) VALUES (?,?,?,?,?,?)", sha(token), userId, exp, req.ip, (req.headers["user-agent"] ?? "").slice(0, 200), now());
  return { token, exp };
}
export const cookie = (token, exp) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(exp).toUTCString()}${config.publicUrl.startsWith("https") ? "; Secure" : ""}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
export function sessionUser(req) {
  const t = /(?:^|;\s*)ht_session=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
  if (!t) return null;
  const s = q.get("SELECT s.id sid, s.expires_at, u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?", sha(t));
  if (!s) return null;
  if (s.expires_at < now()) { q.run("DELETE FROM sessions WHERE id = ?", s.sid); return null; }
  return { id: s.id, name: s.name, email: s.email, role: s.role, sid: s.sid };
}
export const destroySession = (req) => { const u = sessionUser(req); if (u) q.run("DELETE FROM sessions WHERE id = ?", u.sid); };

/* ── limitador sencillo en memoria (ventana deslizante) ── */
const hits = new Map();
export function limited(key, max, windowMs) {
  const t = now(), arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
  arr.push(t); hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((x) => t - x < windowMs)) hits.delete(k);
  return arr.length > max;
}

/* ── registro / login ── */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export class HttpError extends Error { constructor(status, message, field) { super(message); this.status = status; this.field = field; } }

export async function register({ name, email, password }, req) {
  name = String(name ?? "").trim().replace(/\s+/g, " "); email = String(email ?? "").trim().toLowerCase(); password = String(password ?? "");
  if (name.length < 2 || name.length > 80) throw new HttpError(400, "Dinos tu nombre", "name");
  if (!EMAIL_RE.test(email) || email.length > 120) throw new HttpError(400, "Introduce un email válido", "email");
  if (password.length < 8 || password.length > 200) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres", "password");
  if (q.get("SELECT 1 FROM users WHERE email = ?", email)) throw new HttpError(409, "Ya existe una cuenta con ese email", "email");
  const uid = id(14), hash = await hashPassword(password);
  try { q.run("INSERT INTO users (id, name, email, pass_hash, created_at) VALUES (?,?,?,?,?)", uid, name, email, hash, now()); }
  catch { throw new HttpError(409, "Ya existe una cuenta con ese email", "email"); }
  audit(uid, "register", null, req.ip);
  return { user: { id: uid, name, email, role: "user" }, session: createSession(uid, req) };
}
export async function login({ email, password }, req) {
  email = String(email ?? "").trim().toLowerCase(); password = String(password ?? "");
  if (limited(`login:${req.ip}`, 20, 15 * 60e3) || limited(`login:${email}`, 8, 15 * 60e3)) throw new HttpError(429, "Demasiados intentos. Espera unos minutos.");
  const u = q.get("SELECT id, name, email, role, pass_hash FROM users WHERE email = ?", email);
  const ok = await verifyPassword(password, u?.pass_hash ?? DUMMY);
  if (!u || !ok) { audit(u?.id, "login_failed", { email }, req.ip); throw new HttpError(401, "Email o contraseña incorrectos"); }
  audit(u.id, "login", null, req.ip);
  return { user: { id: u.id, name: u.name, email: u.email, role: u.role }, session: createSession(u.id, req) };
}

/* ── recuperar contraseña ── */
export function createToken(userId, kind, ttlMs) {
  const token = crypto.randomBytes(32).toString("base64url");
  q.run("INSERT INTO tokens (id, user_id, kind, expires_at) VALUES (?,?,?,?)", sha(token), userId, kind, now() + ttlMs);
  return token;
}
export async function resetPassword(token, password) {
  if (String(password ?? "").length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres", "password");
  const t = q.get("SELECT id, user_id FROM tokens WHERE id = ? AND kind = 'reset' AND used_at IS NULL AND expires_at > ?", sha(String(token ?? "")), now());
  if (!t) throw new HttpError(400, "El enlace no es válido o ha caducado");
  const hash = await hashPassword(password);
  tx(() => { q.run("UPDATE users SET pass_hash = ? WHERE id = ?", hash, t.user_id); q.run("UPDATE tokens SET used_at = ? WHERE id = ?", now(), t.id); q.run("DELETE FROM sessions WHERE user_id = ?", t.user_id); });
  audit(t.user_id, "password_reset");
}
export async function changePassword(user, { current, password }) {
  const u = q.get("SELECT pass_hash FROM users WHERE id = ?", user.id);
  if (!(await verifyPassword(String(current ?? ""), u.pass_hash))) throw new HttpError(403, "La contraseña actual no es correcta", "current");
  if (String(password ?? "").length < 8) throw new HttpError(400, "La contraseña debe tener al menos 8 caracteres", "password");
  q.run("UPDATE users SET pass_hash = ? WHERE id = ?", await hashPassword(password), user.id);
  q.run("DELETE FROM sessions WHERE user_id = ? AND id != ?", user.id, user.sid);
  audit(user.id, "password_change");
}
