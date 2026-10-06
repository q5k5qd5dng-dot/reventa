import { animate } from "motion";
import { $, $$, esc, ico, get, post, avatar, debounce, reduced, ApiErr } from "./util";
import { toast, closeLayer } from "./ui";
import * as Overview from "./views/overview";
import * as Stats from "./views/stats";
import * as Ops from "./views/ops";
import * as Fin from "./views/finance";
import * as Trust from "./views/trust";

export interface Ctx { user: { id: string; name: string; email: string }; days: number; setDays(n: number): void; refreshBadges(): void }
const store = { get: (k: string) => { try { return localStorage.getItem("adm:" + k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem("adm:" + k, v); } catch {} } };

/* ═════ Navegación ═════ */
const NAV: [string, [string, string, string, string?][]][] = [
  ["Principal", [["/", "Resumen", "home"], ["/stats", "Estadísticas", "chart"]]],
  ["Operaciones", [["/orders", "Pedidos", "cart"], ["/listings", "Anuncios", "ticket"], ["/events", "Eventos", "cal"], ["/users", "Usuarios", "users"]]],
  ["Finanzas", [["/payouts", "Liquidaciones", "wallet", "payouts"], ["/invoices", "Facturación", "file"]]],
  ["Confianza", [["/risk", "Riesgo y fraude", "shield", "risk"], ["/support", "Soporte", "help", "tickets"]]],
  ["Sistema", [["/audit", "Auditoría", "log"], ["/settings", "Ajustes", "cog"]]],
];
const TITLES: Record<string, string> = { "/": "Resumen", "/stats": "Estadísticas", "/orders": "Pedidos", "/listings": "Anuncios", "/events": "Eventos", "/users": "Usuarios", "/payouts": "Liquidaciones", "/invoices": "Facturación", "/risk": "Riesgo y fraude", "/support": "Soporte", "/audit": "Auditoría", "/settings": "Ajustes" };

const app = $("#app")!;
let user: Ctx["user"] | null = null, days = +(store.get("days") ?? 30) || 30, badges: any = {};

function theme() {
  const t = store.get("theme"); if (t) document.documentElement.dataset.theme = t;
}
theme();
const isDark = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

/* ═════ Acceso ═════ */
function loginScreen(msg = "") {
  app.innerHTML = `<div class="login"><div class="card box"><div class="logo">handticket</div><p class="muted" style="margin-top:.2rem">Panel de administración</p><form id="lf" class="col gap-3 mt-4" novalidate><div class="field"><label for="le">Email</label><input class="input" id="le" type="email" autocomplete="username" required/></div><div class="field"><label for="lp">Contraseña</label><input class="input" id="lp" type="password" autocomplete="current-password" required/><span class="err" id="lerr">${esc(msg)}</span></div><button class="btn pri" style="height:2.8rem;margin-top:.4rem" id="lgo">Entrar</button></form><p class="muted xs" style="margin-top:1.2rem;text-align:center">Acceso restringido. Las acciones quedan registradas.</p></div></div>`;
  const f = $<HTMLFormElement>("#lf")!; $("#le")!.focus();
  f.addEventListener("submit", async (e) => {
    e.preventDefault(); const b = $("#lgo") as HTMLButtonElement, err = $("#lerr")!; err.textContent = ""; b.disabled = true; b.textContent = "Entrando…";
    try {
      const r = await post("/api/auth/login", { email: ($("#le") as HTMLInputElement).value, password: ($("#lp") as HTMLInputElement).value });
      if (r.user.role !== "admin") { await post("/api/auth/logout"); throw new ApiErr(403, "Esta cuenta no tiene permisos de administrador"); }
      start(r.user);
    } catch (er) { err.textContent = (er as Error).message; b.disabled = false; b.textContent = "Entrar"; }
  });
}

/* ═════ Estructura ═════ */
function shell() {
  const collapsed = store.get("collapsed") === "1";
  app.innerHTML = `<div class="app ${collapsed ? "collapsed" : ""}" id="shell"><aside class="side" id="side"><div class="brand"><span class="logo">handticket</span><span class="tag">Admin</span></div>
  <nav class="nav" aria-label="Principal">${NAV.map(([g, items]) => `<h6>${g}</h6>${items.map(([h, l, i, b]) => `<a href="#${h}" data-h="${h}" title="${l}">${ico(i)}<span>${l}</span>${b ? `<em class="pill hide" data-b="${b}"></em>` : ""}</a>`).join("")}`).join("")}</nav>
  <div class="me">${avatar(user!.name)}<div class="meta grow"><b class="trunc">${esc(user!.name)}</b><small class="trunc" style="display:block">${esc(user!.email)}</small></div><button class="icon-btn" id="logout" title="Cerrar sesión">${ico("out")}</button></div></aside>
  <div class="main"><header class="top"><button class="icon-btn menu-btn" id="menu" aria-label="Menú">${ico("menu")}</button><button class="icon-btn" id="collapse" aria-label="Contraer menú">${ico("menu")}</button><div class="crumb">Panel · <b id="crumb"></b></div>
  <div class="searchbox"><span>${ico("search")}</span><input id="gs" placeholder="Buscar usuarios, pedidos, facturas…" autocomplete="off" aria-label="Buscar"/><span class="kbd">⌘K</span></div><span class="grow"></span>
  <a class="btn sm" href="/" target="_blank" rel="noopener">${ico("ext")}Ver web</a><button class="icon-btn" id="theme" aria-label="Cambiar tema">${ico(isDark() ? "sun" : "moon")}</button>
  <div style="position:relative"><button class="icon-btn" id="bell" aria-label="Notificaciones">${ico("bell")}<i class="dot hide"></i></button><div class="pop" id="pop"></div></div></header>
  <main class="page" id="page" tabindex="-1"></main></div></div><div id="toasts" aria-live="polite"></div>`;
  $("#logout")!.addEventListener("click", async () => { await post("/api/auth/logout").catch(() => {}); user = null; loginScreen(); });
  $("#theme")!.addEventListener("click", () => { const d = !isDark(); document.documentElement.dataset.theme = d ? "dark" : "light"; store.set("theme", d ? "dark" : "light"); $("#theme")!.innerHTML = ico(d ? "sun" : "moon"); route(); });
  $("#collapse")!.addEventListener("click", () => { const s = $("#shell")!; s.classList.toggle("collapsed"); store.set("collapsed", s.classList.contains("collapsed") ? "1" : "0"); setTimeout(() => window.dispatchEvent(new Event("resize")), 300); });
  const side = $("#side")!, sc = document.createElement("div"); sc.className = "scrim"; sc.style.zIndex = "70"; sc.style.display = "none"; document.body.appendChild(sc);
  const toggle = (o: boolean) => { side.classList.toggle("open", o); sc.style.display = o ? "block" : "none"; requestAnimationFrame(() => sc.classList.toggle("on", o)); };
  $("#menu")!.addEventListener("click", () => toggle(!side.classList.contains("open"))); sc.addEventListener("click", () => toggle(false)); $$("a", side).forEach((a) => a.addEventListener("click", () => toggle(false)));
  const bell = $("#bell")!, pop = $("#pop")!;
  bell.addEventListener("click", (e) => { e.stopPropagation(); pop.classList.toggle("on"); });
  document.addEventListener("click", (e) => { if (!(e.target as HTMLElement).closest("#pop")) pop.classList.remove("on"); });
  palette();
}

/* ═════ Insignias y notificaciones ═════ */
async function refreshBadges() {
  try {
    badges = await get("/api/admin/badges");
    const m: Record<string, number> = { payouts: badges.payoutsDue, risk: badges.risk, tickets: badges.tickets };
    $$("[data-b]").forEach((e) => { const n = m[e.dataset.b!]; e.textContent = String(n); e.classList.toggle("hide", !n); e.classList.toggle("soft", e.dataset.b === "payouts"); });
    const items = [
      badges.highRisk ? [`${badges.highRisk} alertas de riesgo alto`, "Revisa vendedores y accesos sospechosos", "#/risk", "shield"] : null,
      badges.tickets ? [`${badges.tickets} tickets sin responder`, "Soporte pendiente", "#/support", "help"] : null,
      badges.payoutsDue ? [`${badges.payoutsDue} liquidaciones listas`, `${badges.payoutsDueAmount.toLocaleString("es-ES")} € por liberar`, "#/payouts", "wallet"] : null,
    ].filter(Boolean) as string[][];
    $("#pop")!.innerHTML = `<div class="ph2">Notificaciones</div>${items.map(([t, s, h, i]) => `<a href="${h}"><span class="avatar sm" style="background:var(--accent)">${ico(i).replace("<svg", '<svg style="width:1rem"')}</span><div><b class="sm">${t}</b><div class="muted xs">${s}</div></div></a>`).join("") || '<div class="empty" style="padding:2rem"><div>Todo al día ✨</div></div>'}`;
    $(".dot", $("#bell")!)!.classList.toggle("hide", !items.length);
  } catch { /* sin sesión */ }
}

/* ═════ Paleta de comandos ═════ */
function palette() {
  let el: HTMLElement | null = null, sc: HTMLElement | null = null, idx = 0, items: any[] = [];
  const close = () => { if (!el) return; el.classList.remove("on"); sc!.classList.remove("on"); const e = el, s = sc!; setTimeout(() => { e.remove(); s.remove(); }, 180); el = null; };
  const open = () => {
    if (el) return; closeLayer(); sc = document.createElement("div"); sc.className = "scrim"; el = document.createElement("div"); el.className = "cmdk"; el.setAttribute("role", "dialog");
    el.innerHTML = `<input placeholder="Ir a… o buscar usuario, pedido, evento, factura" aria-label="Buscar"/><div class="res"></div><div class="foot"><span><span class="kbd">↑↓</span> navegar</span><span><span class="kbd">↵</span> abrir</span><span><span class="kbd">esc</span> cerrar</span></div>`;
    document.body.append(sc, el); requestAnimationFrame(() => { sc!.classList.add("on"); el!.classList.add("on"); }); sc.addEventListener("click", close);
    const inp = $<HTMLInputElement>("input", el)!, res = $(".res", el)!; inp.focus();
    const pages = NAV.flatMap(([, it]) => it.map(([h, l, i]) => ({ type: "Ir a", title: l, sub: "", hash: "#" + h, icon: i })));
    const paint = () => { let last = ""; res.innerHTML = items.map((r, i) => { const h = r.type !== last ? `<h6>${r.type}</h6>` : ""; last = r.type; return `${h}<div class="it ${i === idx ? "on" : ""}" data-i="${i}">${ico(r.icon ?? "search")}<div class="t"><b class="sm">${esc(r.title)}</b> <small>${esc(r.sub)}</small></div></div>`; }).join("") || '<p class="muted" style="padding:1.2rem">Sin resultados</p>'; res.querySelector(".on")?.scrollIntoView({ block: "nearest" }); };
    const set = (q: string, remote: any[] = []) => { const t = q.toLowerCase(); items = [...pages.filter((p) => !t || p.title.toLowerCase().includes(t)), ...remote.map((r) => ({ ...r, icon: { Usuario: "users", Pedido: "cart", Evento: "cal", Factura: "file" }[r.type as string] }))]; idx = 0; paint(); };
    set(""); const remote = debounce(async (q: string) => { if (q.length < 2) return; try { const r = await get("/api/admin/search", { q }); if (inp.value === q) set(q, r.results); } catch {} }, 200);
    inp.addEventListener("input", () => { set(inp.value); remote(inp.value); });
    const go = () => { const it = items[idx]; if (it) { location.hash = it.hash; close(); } };
    inp.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { idx = Math.min(items.length - 1, idx + 1); paint(); e.preventDefault(); } else if (e.key === "ArrowUp") { idx = Math.max(0, idx - 1); paint(); e.preventDefault(); } else if (e.key === "Enter") go(); else if (e.key === "Escape") close(); });
    res.addEventListener("click", (e) => { const i = (e.target as HTMLElement).closest<HTMLElement>("[data-i]"); if (i) { idx = +i.dataset.i!; go(); } });
  };
  addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); el ? close() : open(); } else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) { e.preventDefault(); open(); } });
  $("#gs")!.addEventListener("focus", (e) => { (e.target as HTMLElement).blur(); open(); });
}

/* ═════ Enrutado ═════ */
const ctx = (): Ctx => ({ user: user!, days, setDays: (n) => { days = n; store.set("days", String(n)); route(); }, refreshBadges });
let seq = 0;
async function route() {
  if (!user) return; closeLayer();
  const [, base = "/", arg] = /^#?(\/[^/]*)(?:\/(.+))?$/.exec(location.hash || "#/") ?? [];
  const path = TITLES[base] ? base : "/";
  $$(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.h === path)); $("#crumb")!.textContent = TITLES[path]; document.title = `${TITLES[path]} · Handticket Admin`;
  const host = $("#page")!, my = ++seq, c = ctx();
  host.innerHTML = ""; window.scrollTo({ top: 0 });
  if (!reduced) animate(host, { opacity: [0, 1], y: [10, 0] }, { duration: 0.35 });
  try {
    const run: Record<string, () => Promise<void>> = {
      "/": () => Overview.render(host, c), "/stats": () => Stats.render(host, c), "/orders": () => Ops.orders(host, c, arg), "/listings": () => Ops.listings(host), "/events": () => Ops.events(host),
      "/users": () => Ops.users(host, c, arg), "/payouts": () => Fin.payouts(host, c), "/invoices": () => Fin.invoices(host), "/risk": () => Trust.risk(host, c), "/support": () => Trust.support(host, c, arg), "/audit": () => Trust.audit(host), "/settings": () => Trust.settings(host),
    };
    await run[path]();
  } catch (e) { if (my === seq) host.innerHTML = `<div class="card"><div class="empty"><div><div class="ico" style="margin-inline:auto">${ico("alert")}</div><b>No se ha podido cargar</b>${esc((e as Error).message)}</div></div></div>`; }
}

function start(u: Ctx["user"]) { user = u; shell(); refreshBadges(); route(); }
addEventListener("hashchange", route);
addEventListener("adm:401", () => { if (user) { user = null; loginScreen("Tu sesión ha caducado"); } });
setInterval(() => user && refreshBadges(), 60000);
(async () => {
  try { const r = await get("/api/auth/me"); if (r.user?.role === "admin") return start(r.user); loginScreen(r.user ? "Esta cuenta no tiene permisos de administrador" : ""); }
  catch { app.innerHTML = `<div class="login"><div class="card box"><div class="logo">handticket</div><p style="margin-top:1rem">No se puede conectar con el servidor.</p><p class="muted sm mt-1">El panel necesita la API: ejecuta <span class="mono">npm run api</span> y abre <span class="mono">/admin/</span>.</p></div></div>`; }
})();
void toast;
