import { config } from "./config.mjs";
import { q, now } from "./db.mjs";

/** Ajustes editables desde el panel de administración (se guardan en BD y se aplican en caliente). */
export const SCHEMA = {
  feeBuyer: { label: "Gastos de gestión al comprador", min: 0, max: 0.3, step: 0.005, pct: true },
  feeSeller: { label: "Comisión al vendedor", min: 0, max: 0.4, step: 0.005, pct: true },
  maxMarkup: { label: "Precio máximo sobre el original", min: 1, max: 3, step: 0.05, pct: true },
  vat: { label: "IVA aplicado a comisiones", min: 0, max: 0.3, step: 0.01, pct: true },
  payoutDelayDays: { label: "Días tras el evento para liberar cobros", min: 0, max: 30, step: 1 },
};
export const current = () => Object.fromEntries(Object.keys(SCHEMA).map((k) => [k, config[k]]));
export function loadSettings() {
  for (const r of q.all("SELECT key, value FROM settings")) if (r.key in SCHEMA) config[r.key] = JSON.parse(r.value);
}
export function saveSettings(patch) {
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    const d = SCHEMA[k]; if (!d) continue;
    const n = Number(v); if (!Number.isFinite(n) || n < d.min || n > d.max) throw new Error(`${d.label}: valor fuera de rango`);
    config[k] = n; out[k] = n;
    q.run("INSERT INTO settings (key, value, updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at", k, JSON.stringify(n), now());
  }
  return out;
}
