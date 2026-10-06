import { get, post, patch, ico, esc, eur, int, dt, ago, avatar, CAT, qs, $, $$ } from "../util";
import { dataTable, drawer, modal, confirmDialog, status, badge, toast, fail, seg, empty } from "../ui";
import type { Ctx } from "../main";

const head = (t: string, p: string, extra = "") => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div><div class="row gap-2 wrap">${extra}</div></div>`;

/* ═════ Pedidos ═════ */
export async function orders(host: HTMLElement, ctx: Ctx, openId?: string) {
  host.innerHTML = head("Pedidos", "Todas las compras, con estado, comprador y facturación") + `<div class="card" id="tb"></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, sort: "created_at",
    filters: [{ key: "q", type: "search", placeholder: "Buscar por código, comprador o evento…" }, { key: "status", type: "select", options: [["", "Todos los estados"], ["paid", "Pagados"], ["refunded", "Reembolsados"], ["pending", "Pendientes"], ["failed", "Fallidos"]] }, { key: "from", type: "date", placeholder: "Desde" }, { key: "to", type: "date", placeholder: "Hasta" }],
    load: (p) => get("/api/admin/orders", p), exportUrl: (p) => "/api/admin/orders.csv?" + qs({ ...p, page: "", size: "" }),
    summary: (r) => `<div class="sum"><span>Resultados<b>${int(r.total)}</b></span><span>Importe cobrado<b>${eur(r.sum)}</b></span></div>`,
    onRow: (r) => orderDrawer(r.id, () => t.reload()),
    cols: [
      { key: "code", label: "Pedido", sort: "created_at", render: (r) => `<span class="mono b">${esc(r.code)}</span><div class="muted xs">${dt(r.at)}</div>` },
      { key: "buyer", label: "Comprador", render: (r) => `<div class="who">${avatar(r.buyer, "sm")}<div class="trunc"><b>${esc(r.buyer)}</b><small>${esc(r.email)}</small></div></div>` },
      { key: "event", label: "Evento", render: (r) => `<div class="trunc" style="max-width:15rem"><b style="font-weight:500">${esc(r.event)}</b><div class="muted xs">${esc(r.type)} · ${r.qty}×</div></div>` },
      { key: "total", label: "Total", sort: "total", r: true, render: (r) => `<b>${eur(r.total)}</b><div class="muted xs">gestión ${eur(r.fee)}</div>` },
      { key: "origin", label: "Origen", render: (r) => (r.listingId ? badge("P2P", "info") : badge("Catálogo", "plain")) },
      { key: "status", label: "Estado", render: (r) => status(r.status) },
    ],
  });
  if (openId) orderDrawer(openId, () => t.reload());
}
async function orderDrawer(id: string, done: () => void) {
  const d = drawer({ title: "Pedido", body: `<div class="skel" style="height:12rem"></div>` });
  try {
    const x = await get(`/api/admin/orders/${id}`), o = x.order;
    d.el.querySelector(".drawer-h h2")!.textContent = o.code;
    d.el.querySelector(".drawer-h div")!.insertAdjacentHTML("beforeend", `<p class="muted sm">${dt(o.at)}</p>`);
    d.el.querySelector(".drawer-b")!.innerHTML = `<div class="row gap-2 wrap">${status(o.status)}${o.listingId ? badge("Venta entre usuarios", "info") : badge("Catálogo", "plain")}</div>
    <div class="sec"><h4>Resumen</h4><dl class="kv"><dt>Evento</dt><dd><b>${esc(o.event)}</b></dd><dt>Entradas</dt><dd>${esc(o.type)} · ${o.qty}×</dd><dt>Subtotal</dt><dd>${eur(o.subtotal)}</dd><dt>Gastos de gestión</dt><dd>${eur(o.fee)}</dd><dt>Total pagado</dt><dd><b style="font-size:1.1rem">${eur(o.total)}</b></dd><dt>Método</dt><dd>${esc(o.provider ?? "—")}</dd></dl></div>
    <div class="sec"><h4>Comprador</h4><a class="row gap-2" href="#/users/${o.buyerId}">${avatar(o.buyer)}<div><b>${esc(o.buyer)}</b><div class="muted sm">${esc(o.email)}</div></div></a></div>
    ${x.seller ? `<div class="sec"><h4>Vendedor</h4><a class="row gap-2" href="#/users/${x.seller.id}">${avatar(x.seller.name)}<div><b>${esc(x.seller.name)}</b><div class="muted sm">${esc(x.seller.email)} · ${eur(x.seller.unit)} por entrada (original ${eur(x.seller.orig)})</div></div></a>${x.payout ? `<div class="mt-2 sm muted">Cobro del vendedor: <b>${eur(x.payout.amount_cents / 100)}</b> · ${status(x.payout.status === "paid" ? "payout_paid" : x.payout.status)}</div>` : ""}</div>` : ""}
    <div class="sec"><h4>Entradas emitidas (${x.tickets.length})</h4>${x.tickets.map((t: any) => `<div class="row between" style="padding:.4rem 0"><span class="mono">${esc(t.code)}</span>${status(t.status)}</div>`).join("") || '<span class="muted">—</span>'}</div>
    <div class="sec"><h4>Facturas</h4>${x.invoices.map((i: any) => `<a class="invrow" href="/api/admin/invoices/${i.id}/html" target="_blank">${ico("file")}<span class="grow"><b class="mono">${esc(i.number)}</b><div class="mt-1">${status(i.kind)}</div></span><b>${eur(i.total)}</b></a>`).join("") || '<span class="muted">Sin facturas</span>'}</div>
    <div class="sec"><h4>Registro</h4><div class="tl">${x.audit.map((a: any) => `<div><b class="sm">${esc(a.action)}</b><div class="muted xs">${dt(a.at)}</div></div>`).join("") || '<span class="muted">Sin eventos</span>'}</div></div>`;
    if (o.status === "paid") {
      d.el.insertAdjacentHTML("beforeend", `<div class="drawer-f"><button class="btn bad" data-refund>${ico("ref")}Reembolsar pedido</button></div>`);
      d.el.querySelector("[data-refund]")!.addEventListener("click", async () => {
        const r = await confirmDialog({ title: `Reembolsar ${eur(o.total)}`, text: "Se devolverá el importe al comprador, se anularán las entradas, se emitirán facturas de abono y se cancelará el cobro del vendedor.", ok: "Reembolsar", danger: true, reason: "Motivo (se enviará al comprador)" });
        if (r === null) return;
        try { await post(`/api/admin/orders/${id}/refund`, { reason: r }); toast("Pedido reembolsado"); d.close(); done(); } catch (e) { fail(e); }
      });
    }
  } catch (e) { fail(e); d.close(); }
}

/* ═════ Anuncios ═════ */
export async function listings(host: HTMLElement) {
  host.innerHTML = head("Anuncios", "Moderación de las entradas puestas a la venta") + `<div class="card" id="tb"></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, sort: "created_at",
    filters: [{ key: "q", type: "search", placeholder: "Buscar por vendedor, evento o ID…" }, { key: "status", type: "select", options: [["", "Todos"], ["active", "Activos"], ["sold", "Vendidos"], ["removed", "Retirados"]] }, { key: "flag", type: "select", options: [["", "Cualquier precio"], ["markup", "Sobreprecio ≥ 120 %"]] }],
    load: (p) => get("/api/admin/listings", p),
    cols: [
      { key: "id", label: "Anuncio", render: (r) => `<span class="mono b">${esc(r.id)}</span><div class="muted xs">${ago(r.at)}</div>` },
      { key: "seller", label: "Vendedor", render: (r) => `<a class="who" href="#/users/${r.sellerId}">${avatar(r.seller, "sm")}<div class="trunc"><b>${esc(r.seller)}</b><small>${esc(r.email)}</small></div></a>` },
      { key: "event", label: "Evento", render: (r) => `<div class="trunc" style="max-width:15rem"><b style="font-weight:500">${esc(r.event)}</b><div class="muted xs">${esc(r.type)}</div></div>` },
      { key: "qty", label: "Cant.", r: true, render: (r) => `${r.left}/${r.qty}` },
      { key: "price", label: "Precio", sort: "price", r: true, render: (r) => `<b>${eur(r.price)}</b><div class="muted xs">orig. ${eur(r.orig)}</div>` },
      { key: "markup", label: "Sobreprecio", sort: "markup", r: true, render: (r) => badge(`${Math.round(r.markup * 100)} %`, r.markup >= 1.25 ? "bad" : r.markup >= 1.15 ? "warn" : r.markup <= 1 ? "ok" : "plain") },
      { key: "status", label: "Estado", render: (r) => status(r.status) },
    ],
    actions: (r) => `<div class="acts">${r.status === "removed" ? `<button class="btn sm" data-act="restore">Restaurar</button>` : `<button class="btn sm bad" data-act="remove" ${r.left < r.qty ? "disabled title=\"Tiene ventas\"" : ""}>Retirar</button>`}</div>`,
    onActions: async (a, r) => {
      if (a === "restore") { try { await post(`/api/admin/listings/${r.id}/restore`); toast("Anuncio restaurado"); t.reload(); } catch (e) { fail(e); } return; }
      const reason = await confirmDialog({ title: "Retirar anuncio", text: `Se avisará a ${esc(r.seller)} por email.`, ok: "Retirar", danger: true, reason: "Motivo (se enviará al vendedor)" });
      if (reason === null) return; try { await post(`/api/admin/listings/${r.id}/remove`, { reason }); toast("Anuncio retirado"); t.reload(); } catch (e) { fail(e); }
    },
  });
}

/* ═════ Eventos ═════ */
export async function events(host: HTMLElement) {
  host.innerHTML = head("Eventos", "Catálogo, ventas por evento y creación de nuevos eventos", `<button class="btn pri" id="new">${ico("plus")}Nuevo evento</button>`) + `<div class="card" id="tb"></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, size: 50,
    filters: [{ key: "q", type: "search", placeholder: "Buscar evento o ciudad…" }, { key: "status", type: "select", options: [["", "Todos"], ["active", "Activos"], ["cancelled", "Cancelados"]] }],
    load: async (p) => { const r = await get("/api/admin/events"), q = String(p.q ?? "").toLowerCase(); let rows = r.rows.filter((e: any) => (!q || (e.name + e.city + e.venue).toLowerCase().includes(q)) && (!p.status || e.status === p.status)); rows = rows.slice(0, 1000); return { rows, total: rows.length }; },
    onRow: (r) => eventForm(r, () => t.reload()),
    cols: [
      { key: "name", label: "Evento", render: (r) => `<div class="trunc" style="max-width:20rem"><b>${esc(r.name)}</b><div class="muted xs">${esc(r.venue)} · ${esc(r.city)}</div></div>` },
      { key: "cat", label: "Categoría", render: (r) => badge(CAT[r.cat] ?? r.cat, "plain") },
      { key: "date", label: "Fecha", render: (r) => dt(new Date(r.date).getTime()) },
      { key: "sold", label: "Vendidas", r: true, render: (r) => int(r.sold) },
      { key: "avail", label: "Disponibles", r: true, render: (r) => `${int(r.available)} <span class="muted xs">· ${r.listings} anuncios</span>` },
      { key: "gmv", label: "GMV", r: true, render: (r) => `<b>${eur(r.gmv, 0)}</b>` },
      { key: "status", label: "Estado", render: (r) => (r.status === "cancelled" ? status("cancelled") : new Date(r.date) < new Date() ? badge("Finalizado", "plain") : status("active")) },
    ],
  });
  host.querySelector("#new")!.addEventListener("click", () => eventForm(null, () => t.reload()));
}
function eventForm(e: any | null, done: () => void) {
  const v = (k: string, d = "") => esc(e?.[k] ?? d), tk = (e?.tickets ?? [{ n: "Entrada general", sub: "", from: 30, list: 0 }]) as any[];
  const row = (t: any) => `<div class="row gap-2 tkr"><input class="input" data-k="n" placeholder="Nombre (p. ej. Pista)" value="${esc(t.n)}"/><input class="input" data-k="sub" placeholder="Detalle / horario" value="${esc(t.sub)}"/><input class="input" data-k="from" type="number" min="1" placeholder="Desde €" style="max-width:6.5rem" value="${t.from}"/><button class="icon-btn" data-rm type="button" aria-label="Quitar">${ico("trash")}</button></div>`;
  const m = modal({
    wide: true,
    html: `<h3>${e ? "Editar evento" : "Nuevo evento"}</h3><p class="d">${e ? `ID: <span class="mono">${esc(e.id)}</span>` : "Aparecerá en el catálogo de la API al guardarlo."}</p>
    <form id="ef" class="grid g2 mt-3" style="gap:.9rem 1rem" novalidate>
      <div class="field" style="grid-column:1/-1"><label>Nombre</label><input class="input" name="name" value="${v("name")}"/><span class="err"></span></div>
      <div class="field"><label>Recinto</label><input class="input" name="v" value="${v("venue")}"/><span class="err"></span></div><div class="field"><label>Ciudad</label><input class="input" name="c" value="${v("city")}"/><span class="err"></span></div>
      <div class="field"><label>Categoría</label><select class="select" name="cat">${Object.entries(CAT).map(([k, l]) => `<option value="${k}" ${e?.cat === k ? "selected" : ""}>${l}</option>`).join("")}</select></div><div class="field"><label>Fecha y hora</label><input class="input" type="datetime-local" name="date" value="${e ? esc(e.date.slice(0, 16)) : ""}"/><span class="err"></span></div>
      <div class="field" style="grid-column:1/-1"><label>Descripción</label><textarea class="textarea" name="desc" rows="3">${v("desc")}</textarea></div>
      <div style="grid-column:1/-1"><div class="row between"><label class="muted sm b">Tipos de entrada</label><button class="btn sm" type="button" id="addt">${ico("plus")}Añadir</button></div><div class="grid mt-1" id="tks" style="gap:.5rem">${tk.map(row).join("")}</div><span class="err" style="color:var(--bad);font-size:12px" id="tke"></span></div>
      <label class="row gap-2" style="grid-column:1/-1"><input type="checkbox" class="chk" name="hot" ${e?.hot ? "checked" : ""}/> Destacado en portada</label></form>`,
    footer: `${e && e.status !== "cancelled" ? `<button class="btn bad" id="cx" style="margin-right:auto">Cancelar evento</button>` : ""}<button class="btn" data-c>Cerrar</button><button class="btn pri" id="sv">${e ? "Guardar cambios" : "Crear evento"}</button>`,
    mount: (el, close) => {
      $("[data-c]", el)!.addEventListener("click", close);
      $("#addt", el)!.addEventListener("click", () => $("#tks", el)!.insertAdjacentHTML("beforeend", row({ n: "", sub: "", from: 30 })));
      el.addEventListener("click", (ev) => { const b = (ev.target as HTMLElement).closest("[data-rm]"); if (b) b.closest(".tkr")!.remove(); });
      $("#sv", el)!.addEventListener("click", async () => {
        const f = $("#ef", el) as HTMLFormElement, fd = new FormData(f), body: any = Object.fromEntries(fd); body.hot = fd.has("hot");
        body.tickets = $$(".tkr", el).map((r) => ({ n: ($("[data-k=n]", r) as HTMLInputElement).value, sub: ($("[data-k=sub]", r) as HTMLInputElement).value, from: +($("[data-k=from]", r) as HTMLInputElement).value }));
        $$(".field", el).forEach((x) => { x.classList.remove("bad"); const s = $(".err", x); if (s) s.textContent = ""; });
        try { await (e ? patch(`/api/admin/events/${e.id}`, body) : post("/api/admin/events", body)); toast(e ? "Evento actualizado" : "Evento creado"); close(); done(); }
        catch (er: any) { const inp = er.field ? (f.elements.namedItem(er.field) as HTMLElement | null) : null; if (inp) { const fl = inp.closest(".field")!; fl.classList.add("bad"); $(".err", fl)!.textContent = er.message; } else if (er.field === "tickets") $("#tke", el)!.textContent = er.message; else fail(er); }
      });
      $("#cx", el)?.addEventListener("click", async () => {
        const r = await confirmDialog({ title: "Cancelar evento", text: "Se retirarán todos los anuncios activos. ¿Quieres además reembolsar automáticamente todos los pedidos pagados?", ok: "Cancelar y reembolsar", danger: true });
        if (r === null) return; try { const x = await post(`/api/admin/events/${e.id}/cancel`, { refund: true }); toast(`Evento cancelado · ${x.refunded} pedidos reembolsados`); close(); done(); } catch (er) { fail(er); }
      });
    },
  });
  void m;
}

/* ═════ Usuarios ═════ */
export async function users(host: HTMLElement, ctx: Ctx, openId?: string) {
  host.innerHTML = head("Usuarios", "Compradores y vendedores, actividad y control de cuentas", `<a class="btn" href="/api/admin/users.csv">${ico("dl")}Exportar</a>`) + `<div class="card" id="tb"></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, sort: "created_at",
    filters: [{ key: "q", type: "search", placeholder: "Buscar por nombre, email o ID…" }, { key: "role", type: "select", options: [["", "Todos los roles"], ["user", "Usuarios"], ["admin", "Administradores"]] }, { key: "status", type: "select", options: [["", "Cualquier estado"], ["active", "Activos"], ["banned", "Suspendidos"]] }],
    load: (p) => get("/api/admin/users", p), onRow: (r) => userDrawer(r.id, ctx, () => t.reload()),
    cols: [
      { key: "name", label: "Usuario", sort: "name", render: (r) => `<div class="who">${avatar(r.name)}<div class="trunc"><b>${esc(r.name)} ${r.role === "admin" ? badge("Admin", "violet") : ""}</b><small>${esc(r.email)}</small></div></div>` },
      { key: "orders", label: "Compras", sort: "spent", r: true, render: (r) => `<b>${eur(r.spent, 0)}</b><div class="muted xs">${r.orders} pedidos</div>` },
      { key: "sales", label: "Ventas", sort: "sales", r: true, render: (r) => `<b>${r.sold}</b><div class="muted xs">${r.listings} anuncios</div>` },
      { key: "iban", label: "Cobro", render: (r) => (r.hasIban ? badge("IBAN", "ok") : '<span class="faint">—</span>') },
      { key: "refunds", label: "Reemb.", r: true, render: (r) => (r.refunds ? badge(String(r.refunds), r.refunds >= 2 ? "bad" : "warn") : '<span class="faint">0</span>') },
      { key: "created", label: "Alta", sort: "created_at", render: (r) => `${dt(r.created_at, false)}<div class="muted xs">${r.last_login_at ? "visto " + ago(r.last_login_at) : "sin accesos"}</div>` },
      { key: "st", label: "Estado", render: (r) => (r.banned ? badge("Suspendido", "bad") : badge("Activo", "ok")) },
    ],
  });
  if (openId) userDrawer(openId, ctx, () => t.reload());
}
async function userDrawer(id: string, ctx: Ctx, done: () => void) {
  const d = drawer({ title: "Usuario", body: `<div class="skel" style="height:14rem"></div>` });
  try {
    const x = await get(`/api/admin/users/${id}`), u = x.user, me = u.id === ctx.user.id;
    d.el.querySelector(".drawer-h h2")!.textContent = u.name;
    d.el.querySelector(".drawer-b")!.innerHTML = `<div class="row gap-3">${avatar(u.name, "lg")}<div><div class="row gap-2 wrap"><b style="font-size:1.05rem">${esc(u.name)}</b>${u.role === "admin" ? badge("Admin", "violet") : ""}${u.banned ? badge("Suspendido", "bad") : badge("Activo", "ok")}</div><div class="muted">${esc(u.email)}</div><div class="muted xs">Alta ${dt(u.created_at)} · ${u.last_login_at ? "Último acceso " + ago(u.last_login_at) : "Sin accesos"}</div></div></div>
    <div class="sec"><h4>Cobro</h4>${x.payout ? `<div class="row gap-2">${badge("IBAN verificado", "ok")}<span>${esc(x.payout.holder)} · •••• ${esc(x.payout.last4)}</span></div>` : '<span class="muted">Sin cuenta de cobro</span>'}</div>
    <div class="sec"><h4>Pedidos (${x.orders.length})</h4>${x.orders.map((o: any) => `<a href="#/orders/${o.id}" class="row between" style="padding:.5rem 0;border-bottom:1px solid var(--line)"><span class="trunc"><b class="mono">${esc(o.code)}</b><div class="muted xs trunc">${esc(o.event)} · ${ago(o.created_at)}</div></span><span class="r"><b>${eur(o.total)}</b><div>${status(o.status)}</div></span></a>`).join("") || '<span class="muted">Sin compras</span>'}</div>
    <div class="sec"><h4>Anuncios (${x.listings.length})</h4>${x.listings.map((l: any) => `<div class="row between" style="padding:.5rem 0;border-bottom:1px solid var(--line)"><span class="trunc"><b>${esc(l.event)}</b><div class="muted xs">${l.qty_left}/${l.qty} · ${ago(l.created_at)}</div></span><span class="r"><b>${eur(l.price)}</b><div>${status(l.status)}</div></span></div>`).join("") || '<span class="muted">Sin anuncios</span>'}</div>
    ${x.tickets.length ? `<div class="sec"><h4>Soporte</h4>${x.tickets.map((t: any) => `<a href="#/support/${t.id}" class="row between" style="padding:.4rem 0"><span>${esc(t.subject)}</span>${status(t.status)}</a>`).join("")}</div>` : ""}
    <div class="sec"><h4>Sesiones recientes</h4>${x.sessions.map((s: any) => `<div class="sm" style="padding:.3rem 0"><span class="mono">${esc(s.ip ?? "—")}</span> <span class="muted">· ${ago(s.created_at)} · ${esc((s.ua ?? "").slice(0, 38))}</span></div>`).join("") || '<span class="muted">—</span>'}</div>
    <div class="sec"><h4>Actividad</h4><div class="tl">${x.audit.map((a: any) => `<div><b class="sm">${esc(a.action)}</b><div class="muted xs">${dt(a.at)}${a.ip ? " · " + esc(a.ip) : ""}</div></div>`).join("") || '<span class="muted">—</span>'}</div></div>`;
    if (!me) {
      d.el.insertAdjacentHTML("beforeend", `<div class="drawer-f"><button class="btn" data-role>${ico("shield")}${u.role === "admin" ? "Quitar admin" : "Hacer admin"}</button><button class="btn ${u.banned ? "" : "bad"}" data-ban>${ico("ban")}${u.banned ? "Reactivar cuenta" : "Suspender cuenta"}</button></div>`);
      d.el.querySelector("[data-ban]")!.addEventListener("click", async () => {
        const r = u.banned ? "" : await confirmDialog({ title: "Suspender cuenta", text: `${esc(u.name)} no podrá iniciar sesión y se retirarán sus anuncios sin ventas.`, ok: "Suspender", danger: true, reason: true });
        if (r === null) return; try { await post(`/api/admin/users/${id}/ban`, { ban: !u.banned, reason: r }); toast(u.banned ? "Cuenta reactivada" : "Cuenta suspendida"); d.close(); done(); } catch (e) { fail(e); }
      });
      d.el.querySelector("[data-role]")!.addEventListener("click", async () => {
        const r = await confirmDialog({ title: u.role === "admin" ? "Quitar permisos de administrador" : "Dar permisos de administrador", text: "Los administradores acceden a todos los datos del panel, incluidos pagos y facturas.", ok: "Confirmar" });
        if (r === null) return; try { await post(`/api/admin/users/${id}/role`, { role: u.role === "admin" ? "user" : "admin" }); toast("Rol actualizado"); d.close(); done(); } catch (e) { fail(e); }
      });
    }
  } catch (e) { fail(e); d.close(); }
}
void seg; void empty;
