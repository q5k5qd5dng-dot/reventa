export const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const debounce = <A extends unknown[]>(f: (...a: A) => void, ms = 250) => { let t: number; return (...a: A) => { clearTimeout(t); t = window.setTimeout(() => f(...a), ms); }; };

const nf = new Intl.NumberFormat("es-ES", { useGrouping: "always" } as Intl.NumberFormatOptions);
export const int = (n: number) => nf.format(Math.round(n));
export const eur = (n: number, dec = 2) => n.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: "always" } as Intl.NumberFormatOptions) + " €";
export const eurK = (n: number) => (Math.abs(n) >= 10000 ? (n / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " k€" : eur(n, 0));
export const pct = (n: number, d = 1) => (n * 100).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }) + " %";
export const dt = (t: number, time = true) => new Date(t).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }).replace(".", "");
export const dshort = (d: string) => { const [, m, day] = d.split("-"); return `${+day} ${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][+m - 1]}`; };
export function ago(t: number) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "ahora"; if (s < 3600) return `hace ${Math.floor(s / 60)} min`; if (s < 86400) return `hace ${Math.floor(s / 3600)} h`; if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
  return dt(t, false);
}
const PAL = ["#e8590c", "#2563eb", "#12a05c", "#7c4dff", "#f5a524", "#0ea5b7", "#e0392d", "#6b7280", "#d946ef", "#84cc16"];
export const colorOf = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PAL[h % PAL.length]; };
export const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
export const avatar = (n: string, cls = "") => `<span class="avatar ${cls}" style="background:${colorOf(n)}">${esc(initials(n))}</span>`;
export const CAT: Record<string, string> = { musica: "Música", festival: "Festival", deporte: "Deporte", teatro: "Teatro", club: "Club" };

/* iconos (trazo, 24×24) */
const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2z", chart: "M4 20V10M10 20V4M16 20v-7M22 20H2", cart: "M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z",
  ticket: "M3 9a2 2 0 002-2V6h14v1a2 2 0 002 2v2a2 2 0 00-2 2v1H5v-1a2 2 0 00-2-2zM13 6v12", cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.1a3.5 3.5 0 010 6.8",
  wallet: "M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14.5h.01", file: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4", shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", help: "M12 22a10 10 0 100-20 10 10 0 000 20zM9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4M12 17.5h.01",
  log: "M4 6h16M4 12h16M4 18h10", cog: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3", bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0", sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4", moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  menu: "M3 6h18M3 12h18M3 18h18", x: "M6 6l12 12M18 6L6 18", dl: "M12 3v12M7 11l5 5 5-5M5 21h14", up: "M7 17L17 7M8 7h9v9", down: "M7 7l10 10M17 8v9H8", plus: "M12 5v14M5 12h14", check: "M5 12l5 5 9-10", chev: "M9 6l6 6-6 6", left: "M15 6l-6 6 6 6", out: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9", alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  money: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6", ref: "M3 12a9 9 0 019-9 9.75 9.75 0 016.7 2.7L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.7-2.7L3 16M3 21v-5h5", eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z", ban: "M12 22a10 10 0 100-20 10 10 0 000 20zM4.9 4.9l14.2 14.2", mail: "M3 5h18v14H3zM3 7l9 6 9-6", pulse: "M22 12h-4l-3 9L9 3l-3 9H2", pkg: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8", percent: "M19 5L5 19M7 9a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z", target: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z", clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2", ext: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3", edit: "M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z", trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
};
export const ico = (n: string, cls = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="${cls}"><path d="${P[n] ?? P.help}"/></svg>`;

/* API */
export class ApiErr extends Error { constructor(public status: number, m: string, public field?: string) { super(m); } }
export async function api<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, { method, credentials: "same-origin", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const j = await r.json().catch(() => ({})); if (r.status === 401) window.dispatchEvent(new Event("adm:401")); throw new ApiErr(r.status, j.error ?? "Error de conexión", j.field); }
  return (r.headers.get("content-type")?.includes("json") ? r.json() : r.text()) as Promise<T>;
}
export const get = <T = any>(u: string, params?: Record<string, unknown>) => api<T>("GET", u + (params ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null).map(([k, v]) => [k, String(v)])) : ""));
export const post = <T = any>(u: string, b?: unknown) => api<T>("POST", u, b ?? {});
export const patch = <T = any>(u: string, b?: unknown) => api<T>("PATCH", u, b ?? {});
export const put = <T = any>(u: string, b?: unknown) => api<T>("PUT", u, b ?? {});
export const qs = (o: Record<string, unknown>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null).map(([k, v]) => [k, String(v)])).toString();
