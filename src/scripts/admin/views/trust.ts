import { get, post, patch, put, ico, esc, eur, int, dt, ago, avatar, $ } from "../util";
import { dataTable, drawer, status, badge, toast, fail, confirmDialog, empty, seg, bindSeg, stagger } from "../ui";
import type { Ctx } from "../main";

const head = (t: string, p: string, extra = "") => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div><div class="row gap-2 wrap">${extra}</div></div>`;

/* ═════ Riesgo y fraude ═════ */
export async function risk(host: HTMLElement, ctx: Ctx) {
  host.innerHTML = head("Riesgo y fraude", "Señales automáticas que merecen una revisión") + `<div id="rk"><div class="card" style="height:14rem"></div></div>`;
  const load = async () => {
    try {
      const d = await get("/api/admin/risk"), by = (s: string) => d.alerts.filter((a: any) => a.severity === s);
      const TYPE: Record<string, string> = { markup: "Sobreprecio", new_seller: "Vendedor nuevo", refunds: "Reembolsos", login: "Accesos", ticket: "Soporte" };
      host.querySelector("#rk")!.innerHTML = `<div class="grid g4"><div class="card kpi"><div class="lbl">Alertas abiertas<span class="ico">${ico("shield")}</span></div><div class="val">${d.alerts.length}</div><div class="foot"><span>Pendientes de revisar</span></div></div><div class="card kpi"><div class="lbl">Gravedad alta<span class="ico" style="background:var(--bad-soft);color:var(--bad)">${ico("alert")}</span></div><div class="val" style="color:var(--bad)">${by("high").length}</div><div class="foot"><span>Revisar hoy</span></div></div><div class="card kpi"><div class="lbl">Gravedad media<span class="ico" style="background:var(--warn-soft);color:var(--warn)">${ico("alert")}</span></div><div class="val">${by("medium").length}</div><div class="foot"><span>Esta semana</span></div></div><div class="card kpi"><div class="lbl">Resueltas<span class="ico" style="background:var(--ok-soft);color:var(--ok)">${ico("check")}</span></div><div class="val">${d.resolved.length}</div><div class="foot"><span>Últimas gestionadas</span></div></div></div>
      <div class="card mt-3"><div class="card-h"><div><h3>Alertas</h3><small>Ordenadas por gravedad</small></div></div><div class="card-b">${d.alerts.length ? `<div class="list">${d.alerts.map((a: any) => `<div data-key="${esc(a.key)}"><span class="avatar sm" style="background:${a.severity === "high" ? "var(--bad)" : "var(--warn)"}">${ico("alert").replace("<svg", '<svg style="width:1rem"')}</span><div class="grow"><div class="row gap-2 wrap"><b>${esc(a.title)}</b>${badge(TYPE[a.kind] ?? a.kind, "plain")}${status(a.severity)}</div><div class="muted sm">${esc(a.detail)} · ${ago(a.at)}</div></div><div class="row gap-2">${a.ref ? `<a class="btn sm" href="${a.ref.type === "user" ? "#/users/" + a.ref.id : a.ref.type === "listing" ? "#/listings" : "#/support/" + a.ref.id}">Revisar</a>` : ""}<button class="btn sm" data-r="dismiss">Descartar</button><button class="btn sm pri" data-r="resolved">Resolver</button></div></div>`).join("")}</div>` : empty("Todo en orden", "No hay alertas pendientes", "check")}</div></div>
      ${d.resolved.length ? `<div class="card mt-3"><div class="card-h"><h3>Historial</h3></div><div class="card-b"><div class="list">${d.resolved.map((r: any) => `<div><span class="muted mono grow trunc">${esc(r.key)}</span>${badge(r.action === "dismiss" ? "Descartada" : "Resuelta", r.action === "dismiss" ? "plain" : "ok")}<span class="muted xs">${ago(r.at)}</span></div>`).join("")}</div></div></div>` : ""}`;
      stagger(".kpi", host);
    } catch (e) { fail(e); }
  };
  host.addEventListener("click", async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-r]"); if (!b) return; const key = b.closest<HTMLElement>("[data-key]")!.dataset.key!;
    const note = await confirmDialog({ title: b.dataset.r === "dismiss" ? "Descartar alerta" : "Marcar como resuelta", text: "Se guardará en el historial.", ok: "Confirmar", reason: "Nota interna (opcional)" }); if (note === null) return;
    try { await post("/api/admin/risk/resolve", { key, action: b.dataset.r, note }); toast("Alerta gestionada"); ctx.refreshBadges(); load(); } catch (er) { fail(er); }
  });
  load();
}

/* ═════ Soporte ═════ */
export async function support(host: HTMLElement, ctx: Ctx, openId?: string) {
  host.innerHTML = head("Soporte", "Tickets abiertos por compradores y vendedores") + `<div class="grid g4" id="sc"></div><div class="card mt-3" id="tb"></div>`;
  const t = dataTable<any>({
    host: host.querySelector("#tb")!, size: 20,
    filters: [{ key: "q", type: "search", placeholder: "Asunto, email o pedido…" }, { key: "status", type: "select", options: [["", "Todos"], ["open", "Abiertos"], ["pending", "Esperando al usuario"], ["solved", "Resueltos"]] }],
    load: async (p) => { const r = await get("/api/admin/support", p); host.querySelector("#sc")!.innerHTML = [["Abiertos", r.counts.open ?? 0, "mail", "warn"], ["En espera", r.counts.pending ?? 0, "clock", "info"], ["Resueltos", r.counts.solved ?? 0, "check", "ok"], ["Total", (r.counts.open ?? 0) + (r.counts.pending ?? 0) + (r.counts.solved ?? 0), "help", ""]].map(([l, v, i]: any) => `<div class="card kpi"><div class="lbl">${l}<span class="ico">${ico(i)}</span></div><div class="val">${v}</div></div>`).join(""); return r; },
    onRow: (r) => ticket(r.id, ctx, () => t.reload()),
    cols: [
      { key: "subject", label: "Asunto", render: (r) => `<div class="trunc" style="max-width:24rem"><b>${esc(r.subject)}</b><div class="muted xs">#${esc(r.id)} · ${esc(r.category)}${r.order_code ? " · " + esc(r.order_code) : ""}</div></div>` },
      { key: "user", label: "Usuario", render: (r) => `<div class="who">${avatar(r.user ?? r.email ?? "?", "sm")}<div class="trunc"><b style="font-weight:500">${esc(r.user ?? "Invitado")}</b><small>${esc(r.email ?? "")}</small></div></div>` },
      { key: "priority", label: "Prioridad", render: (r) => status(r.priority) },
      { key: "msgs", label: "Mensajes", r: true, render: (r) => r.msgs },
      { key: "upd", label: "Actualizado", render: (r) => ago(r.updated_at) },
      { key: "status", label: "Estado", render: (r) => status(r.status) },
    ],
  });
  if (openId) ticket(openId, ctx, () => t.reload());
}
async function ticket(id: string, ctx: Ctx, done: () => void) {
  const d = drawer({ title: "Ticket", body: `<div class="skel" style="height:12rem"></div>` });
  const load = async () => {
    try {
      const x = await get(`/api/admin/support/${id}`), t = x.ticket;
      d.el.querySelector(".drawer-h h2")!.textContent = t.subject;
      d.el.querySelector(".drawer-b")!.innerHTML = `<div class="row gap-2 wrap">${status(t.status)}${status(t.priority)}${badge(t.category, "plain")}${t.order_code ? badge(t.order_code, "info") : ""}</div><div class="muted sm mt-1">${esc(t.user ?? "Invitado")} · ${esc(t.email ?? "")} · abierto ${ago(t.created_at)}</div>
      <div class="col gap-2 mt-3">${x.messages.map((m: any) => `<div class="msg ${m.author}"><small>${esc(m.author_name ?? m.author)} · ${dt(m.at)}</small><p>${esc(m.body)}</p></div>`).join("")}</div>`;
      d.el.querySelector(".drawer-f")?.remove();
      d.el.insertAdjacentHTML("beforeend", `<div class="drawer-f" style="flex-direction:column;align-items:stretch"><textarea class="textarea" id="rp" placeholder="Escribe una respuesta… (se envía por email al usuario)" ${t.status === "solved" ? "" : ""}></textarea><div class="row between"><div class="row gap-2"><select class="select" id="pr" style="width:auto;height:2.05rem"><option value="normal" ${t.priority === "normal" ? "selected" : ""}>Prioridad normal</option><option value="high" ${t.priority === "high" ? "selected" : ""}>Prioridad alta</option></select></div><div class="row gap-2"><button class="btn" id="rs">${ico("check")}Responder y resolver</button><button class="btn pri" id="rb">${ico("send")}Responder</button></div></div></div>`);
      const send = async (solve: boolean) => { const body = ($("#rp", d.el) as HTMLTextAreaElement).value.trim(); if (!body) { toast("Escribe una respuesta", "bad"); return; } try { await post(`/api/admin/support/${id}/reply`, { body, solve }); toast(solve ? "Respondido y resuelto" : "Respuesta enviada"); ctx.refreshBadges(); done(); load(); } catch (e) { fail(e); } };
      $("#rb", d.el)!.addEventListener("click", () => send(false)); $("#rs", d.el)!.addEventListener("click", () => send(true));
      $("#pr", d.el)!.addEventListener("change", async (e) => { await patch(`/api/admin/support/${id}`, { priority: (e.target as HTMLSelectElement).value }); toast("Prioridad actualizada"); done(); });
      const b = d.el.querySelector<HTMLElement>(".drawer-b")!; b.scrollTop = b.scrollHeight;
    } catch (e) { fail(e); d.close(); }
  };
  load();
}

/* ═════ Auditoría ═════ */
export async function audit(host: HTMLElement) {
  host.innerHTML = head("Registro de auditoría", "Quién hizo qué y cuándo: accesos, cambios y operaciones sensibles") + `<div class="card" id="tb"></div>`;
  const acts = await get("/api/admin/audit", { size: 1 }).then((r) => r.actions as string[]).catch(() => []);
  const LBL: Record<string, string> = { login: "Inicio de sesión", login_failed: "Acceso fallido", register: "Registro", order_paid: "Pedido pagado", order_refunded: "Pedido reembolsado", listing_created: "Anuncio creado", listing_removed: "Anuncio retirado", user_banned: "Cuenta suspendida", settings_changed: "Ajustes modificados", payouts_exported: "Remesa exportada", payout_updated: "IBAN actualizado" };
  dataTable<any>({
    host: host.querySelector("#tb")!, size: 40,
    filters: [{ key: "q", type: "search", placeholder: "Usuario, IP o dato…" }, { key: "action", type: "select", options: [["", "Todas las acciones"], ...acts.map((a) => [a, LBL[a] ?? a] as [string, string])] }],
    load: (p) => get("/api/admin/audit", p),
    cols: [
      { key: "at", label: "Cuándo", render: (r) => `${dt(r.at)}<div class="muted xs">${ago(r.at)}</div>` },
      { key: "user", label: "Usuario", render: (r) => (r.user ? `<div class="who">${avatar(r.user, "sm")}<div class="trunc"><b style="font-weight:500">${esc(r.user)}</b><small>${esc(r.email)}</small></div></div>` : '<span class="muted">Sistema / anónimo</span>') },
      { key: "action", label: "Acción", render: (r) => badge(LBL[r.action] ?? r.action, /fail|ban|refund|removed/.test(r.action) ? "bad" : /export|settings|payout/.test(r.action) ? "warn" : "plain") },
      { key: "meta", label: "Detalle", render: (r) => `<span class="mono muted trunc" style="display:block;max-width:22rem">${esc(r.meta ?? "")}</span>` },
      { key: "ip", label: "IP", render: (r) => `<span class="mono">${esc(r.ip ?? "—")}</span>` },
    ],
  });
}

/* ═════ Ajustes ═════ */
export async function settings(host: HTMLElement) {
  host.innerHTML = head("Ajustes", "Comisiones y reglas del marketplace · se aplican a las operaciones nuevas") + `<div id="se"><div class="card" style="height:20rem"></div></div>`;
  try {
    const s = await get("/api/admin/settings"), v: Record<string, number> = { ...s.values };
    host.querySelector("#se")!.innerHTML = `<div class="grid g-main"><div class="card"><div class="card-h"><div><h3>Comisiones y reglas</h3><small>Los cambios quedan registrados en la auditoría</small></div></div><div class="card-b">${Object.entries(s.schema).map(([k, d]: any) => `<div class="setting"><div><b>${esc(d.label)}</b><div class="muted xs">${k === "payoutDelayDays" ? "Margen para posibles reclamaciones tras el evento" : k === "maxMarkup" ? "Tope legal de reventa" : k === "vat" ? "Aplicado sobre gastos de gestión y comisiones" : "Se cobra en cada operación"}</div></div><div class="in"><input class="input" type="number" data-k="${k}" min="${d.pct ? d.min * 100 : d.min}" max="${d.pct ? d.max * 100 : d.max}" step="${d.pct ? d.step * 100 : d.step}" value="${d.pct ? +(v[k] * 100).toFixed(2) : v[k]}"/><span class="muted">${d.pct ? "%" : "días"}</span></div></div>`).join("")}<div class="row" style="justify-content:flex-end;margin-top:1.2rem"><button class="btn pri" id="sv">Guardar cambios</button></div></div></div>
    <div class="card"><div class="card-h"><div><h3>Simulador</h3><small>Una venta de 100 € entre usuarios</small></div></div><div class="card-b" id="sim"></div></div></div>
    <div class="card pad mt-3"><div class="row between"><div><b>Pasarela de pagos</b><div class="muted sm">${s.payments === "stripe" ? "Stripe Checkout activo" : "Modo de pruebas: los pagos se aprueban al instante. Configura STRIPE_SECRET_KEY para cobrar de verdad."}</div></div>${badge(s.payments === "stripe" ? "Stripe" : "Pruebas", s.payments === "stripe" ? "ok" : "warn")}</div></div>`;
    const sim = () => { const fb = v.feeBuyer, fs = v.feeSeller, ven = 100, comprador = ven * (1 + fb), vendedor = ven * (1 - fs), ing = ven * (fb + fs); host.querySelector("#sim")!.innerHTML = [["Paga el comprador", eur(comprador), "var(--text)"], ["Cobra el vendedor", eur(vendedor), "var(--ok)"], ["Ingreso bruto Handticket", eur(ing), "var(--accent)"], [`IVA incluido (${Math.round(v.vat * 100)} %)`, eur(ing - ing / (1 + v.vat)), "var(--muted)"], ["Ingreso neto", eur(ing / (1 + v.vat)), "var(--text)"]].map(([l, x, c]) => `<div class="setting" style="padding:.7rem 0"><span class="muted">${l}</span><b style="color:${c};font-size:1.05rem">${x}</b></div>`).join("") + `<div class="progress mt-2"><i style="width:${Math.min(100, (v.feeBuyer + v.feeSeller) * 100 * 2.5)}%"></i></div><div class="muted xs mt-1">Take rate: ${((v.feeBuyer + v.feeSeller) * 100).toFixed(1).replace(".", ",")} % del GMV</div>`; };
    sim();
    host.querySelectorAll<HTMLInputElement>("input[data-k]").forEach((i) => i.addEventListener("input", () => { const d = (s.schema as any)[i.dataset.k!]; v[i.dataset.k!] = d.pct ? +i.value / 100 : +i.value; sim(); }));
    $("#sv", host)!.addEventListener("click", async () => { try { await put("/api/admin/settings", v); toast("Ajustes guardados"); } catch (e) { fail(e); } });
  } catch (e) { fail(e); }
  void seg; void bindSeg; void int;
}
