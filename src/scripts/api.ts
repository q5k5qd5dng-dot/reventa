/**
 * Cliente de la API de Handticket (server/).
 * Si el servidor responde en /api/health usamos la base de datos ("modo servidor").
 * Si no (p. ej. abriendo el HTML suelto), la web sigue funcionando en modo demostración con localStorage.
 */
import { store } from "./util";

export let serverMode = false;
export class ApiError extends Error { constructor(public status: number, message: string, public field?: string) { super(message); } }

async function req<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, j.error ?? "Error de conexión", j.field);
  return j as T;
}
export const get = <T = any>(u: string) => req<T>("GET", u);
export const post = <T = any>(u: string, b?: unknown) => req<T>("POST", u, b ?? {});
export const put = <T = any>(u: string, b?: unknown) => req<T>("PUT", u, b ?? {});
export const patch = <T = any>(u: string, b?: unknown) => req<T>("PATCH", u, b ?? {});
export const del = <T = any>(u: string) => req<T>("DELETE", u);

/** Trae de la BD lo que la interfaz guarda en local: entradas, anuncios y datos de cobro. */
export async function hydrate() {
  if (!serverMode) return;
  const [o, l, p] = await Promise.all([get("/api/me/orders"), get("/api/me/listings"), get("/api/me/payout")]);
  store.set("tickets", o.orders.map((x: any) => ({ id: x.id, ev: x.ev, type: x.type, qty: x.qty, total: x.total, code: x.code, at: x.at })));
  store.set("selling", l.listings.map((x: any) => ({ id: x.id, ev: x.ev, type: x.type, qty: x.qty, price: x.price, at: x.at })));
  store.set("pay", p.payout);
}

/** Detecta el servidor y sincroniza la sesión. Devuelve true si hay servidor. */
export async function init(): Promise<boolean> {
  if (!/^https?:$/.test(location.protocol)) return false;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 1500);
    const h = await fetch("/api/health", { signal: ctl.signal }); clearTimeout(t);
    if (!h.ok || !(await h.json()).ok) return false;
  } catch { return false; }
  serverMode = true;
  try {
    const { user } = await get("/api/auth/me");
    store.set("user", user ? { name: user.name, email: user.email } : null);
    if (user) await hydrate();
    else { store.set("tickets", []); store.set("selling", []); store.set("pay", null); }
  } catch { /* sin sesión */ }
  return true;
}
