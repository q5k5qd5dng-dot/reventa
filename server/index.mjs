import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.mjs";
import { seedEvents, q, now } from "./db.mjs";
import { sessionUser, HttpError } from "./auth.mjs";
import "./routes.mjs";
import "./admin.mjs";
import { match, allowed } from "./router.mjs";
import { loadSettings } from "./settings.mjs";

loadSettings();
seedEvents();
setInterval(() => { q.run("DELETE FROM sessions WHERE expires_at < ?", now()); q.run("DELETE FROM tokens WHERE expires_at < ?", now()); }, 3600e3).unref();

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".woff2": "font/woff2" };
const SEC = { "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "x-frame-options": "SAMEORIGIN", "permissions-policy": "camera=(), microphone=(), geolocation=()" };
const send = (res, status, body, headers = {}) => { res.writeHead(status, { ...SEC, ...headers }); res.end(body); };
const json = (res, status, obj, headers = {}) => send(res, status, JSON.stringify(obj), { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });

function readBody(req, max = 1e6) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on("data", (c) => { n += c.length; if (n > max) { reject(new HttpError(413, "Petición demasiado grande")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function api(req, res, url) {
  const m = match(req.method, url.pathname);
  if (!m) return json(res, allowed(url.pathname) ? 405 : 404, { error: allowed(url.pathname) ? "Método no permitido" : "No encontrado" });
  const headers = {};
  try {
    const mutating = !["GET", "HEAD"].includes(req.method), isHook = url.pathname.startsWith("/api/webhooks/");
    if (mutating && !isHook) { // protección CSRF: mismo origen + JSON
      const origin = req.headers.origin;
      if (origin && origin !== config.publicUrl && !config.allowedOrigins.includes(origin) && new URL(origin).host !== req.headers.host) throw new HttpError(403, "Origen no permitido");
      if (!/application\/json/.test(req.headers["content-type"] ?? "") && req.headers["content-length"] !== "0" && req.headers["content-length"]) throw new HttpError(415, "Se esperaba JSON");
    }
    const raw = mutating ? await readBody(req) : "";
    let body = {};
    if (raw && !isHook) { try { body = JSON.parse(raw); } catch { throw new HttpError(400, "JSON no válido"); } }
    const out = await m.h({ req, res, params: m.params, body, raw, headers, user: sessionUser(req), query: url.searchParams });
    if (out?.__raw) return send(res, 200, out.body, { "content-type": out.type, "cache-control": "no-store", ...(out.type.startsWith("text/csv") ? { "content-disposition": `attachment; filename="handticket-${url.pathname.split("/").pop()}"` } : {}), ...headers });
    json(res, 200, out, headers);
  } catch (e) {
    if (e instanceof HttpError) return json(res, e.status, { error: e.message, field: e.field }, headers);
    console.error("[api]", req.method, url.pathname, e);
    json(res, 500, { error: "Error interno" });
  }
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  let file = path.join(config.staticDir, p);
  if (!file.startsWith(config.staticDir)) return send(res, 403, "Forbidden");
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { // 404 real para rutas estáticas, la app para el resto
    const nf = path.join(config.staticDir, "404.html");
    return send(res, 404, fs.existsSync(nf) ? fs.readFileSync(nf) : "No encontrado", { "content-type": "text/html; charset=utf-8" });
  }
  const ext = path.extname(file), immutable = file.includes(`${path.sep}_astro${path.sep}`) || ext === ".webp";
  send(res, 200, fs.readFileSync(file), { "content-type": MIME[ext] ?? "application/octet-stream", "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=300" });
}

http.createServer((req, res) => {
  req.ip = (config.production ? req.headers["x-forwarded-for"]?.split(",")[0].trim() : null) || req.socket.remoteAddress;
  const url = new URL(req.url, config.publicUrl);
  if (url.pathname.startsWith("/api/")) return api(req, res, url);
  if (!["GET", "HEAD"].includes(req.method)) return send(res, 405, "Method not allowed");
  serveStatic(req, res, url);
}).listen(config.port, () => console.log(`Handticket API + web en ${config.publicUrl}  (pagos: ${process.env.STRIPE_SECRET_KEY ? "stripe" : "mock"})`));
