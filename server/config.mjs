import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// .env mínimo (sin dependencias)
try {
  for (const l of fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const env = process.env;
export const dataDir = path.resolve(env.DATA_DIR ?? "data");
fs.mkdirSync(dataDir, { recursive: true });

// Clave de cifrado de datos sensibles (IBAN). En producción: DATA_KEY en el entorno.
function devKey() {
  const f = path.join(dataDir, ".devkey");
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  return fs.readFileSync(f, "utf8");
}
export const config = {
  port: +(env.PORT ?? 8787),
  publicUrl: (env.PUBLIC_URL ?? `http://localhost:${env.PORT ?? 8787}`).replace(/\/$/, ""),
  production: env.NODE_ENV === "production",
  dbFile: path.resolve(env.DB_FILE ?? path.join(dataDir, "handticket.db")),
  dataKey: crypto.createHash("sha256").update(env.DATA_KEY ?? devKey()).digest(),
  sessionDays: +(env.SESSION_DAYS ?? 30),
  staticDir: path.resolve(env.STATIC_DIR ?? "dist"),
  allowedOrigins: (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  feeBuyer: 0.08,        // gastos de gestión del comprador
  feeSeller: 0.10,       // comisión del vendedor
  maxMarkup: 1.3,        // precio máximo = 130 % del original
  stripeKey: env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
  resendKey: env.RESEND_API_KEY ?? "",
  mailFrom: env.MAIL_FROM ?? "Handticket <no-reply@handticket.es>",
};
if (config.production && !env.DATA_KEY) throw new Error("Falta DATA_KEY en producción");
