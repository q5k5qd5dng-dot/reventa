import { config } from "./config.mjs";
import { q, id, now } from "./db.mjs";

const split = (gross, rate) => { const base = Math.round(gross / (1 + rate)); return { base, vat: gross - base }; };
const nextSeq = (series, year) => (q.get("SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM invoices WHERE series = ? AND year = ?", series, year).n);

/** Emite una factura (importe bruto con IVA incluido). Debe llamarse dentro de una transacción. */
export function issueInvoice({ kind, orderId, party, partyId, grossCents, concept, rectifies = null, series = "HT", at = now() }) {
  const year = new Date().getFullYear(), seq = nextSeq(series, year), { base, vat } = split(grossCents, config.vat);
  const number = `${series}-${year}-${String(seq).padStart(6, "0")}`, iid = id(12);
  q.run("INSERT INTO invoices (id, number, year, seq, series, kind, order_id, party_id, party_name, party_email, concept, base_cents, vat_rate, vat_cents, total_cents, rectifies, issued_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    iid, number, year, seq, series, kind, orderId, partyId ?? null, party?.name ?? "Cliente", party?.email ?? null, concept, base, config.vat, vat, grossCents, rectifies, at);
  return { id: iid, number };
}
/** Factura de abono (rectificativa) por un reembolso: importes en negativo, serie HT-R. */
export function creditNote(inv, concept, at = now()) {
  return issueInvoice({ kind: "credit", orderId: inv.order_id, party: { name: inv.party_name, email: inv.party_email }, partyId: inv.party_id, grossCents: -inv.total_cents, concept, rectifies: inv.number, series: "HT-R", at });
}
export const eur = (c) => (c / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

/** Factura imprimible (HTML autónomo). */
export function invoiceHtml(i) {
  const f = (n) => eur(n), d = new Date(i.issued_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>${esc(i.number)}</title><style>
  body{font:14px/1.5 system-ui,sans-serif;color:#17171c;max-width:760px;margin:40px auto;padding:0 24px}h1{font-size:28px;margin:0}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e8590c;padding-bottom:20px}
  .logo{font-weight:800;font-size:28px;color:#e8590c;letter-spacing:-.04em}small,.muted{color:#6b6c75}table{width:100%;border-collapse:collapse;margin-top:28px}th{text-align:left;font-size:12px;color:#6b6c75;border-bottom:1px solid #e5e5ea;padding:8px 0}td{padding:12px 0;border-bottom:1px solid #f0f0f3}.r{text-align:right}
  .tot{margin-left:auto;width:280px;margin-top:20px}.tot div{display:flex;justify-content:space-between;padding:5px 0}.tot .g{font-size:18px;font-weight:700;border-top:2px solid #17171c;margin-top:6px;padding-top:10px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:28px}
  @media print{body{margin:0}.noprint{display:none}}</style>
  <div class="top"><div><div class="logo">handticket</div><small>Handticket · Zaragoza, España<br>NIF: pendiente de constitución</small></div><div class="r"><h1>${i.kind === "credit" ? "Factura rectificativa" : "Factura"}</h1><div>${esc(i.number)}</div><small>${d}</small>${i.rectifies ? `<br><small>Rectifica: ${esc(i.rectifies)}</small>` : ""}</div></div>
  <div class="cols"><div><small>FACTURADO A</small><br><b>${esc(i.party_name)}</b><br>${esc(i.party_email ?? "")}</div><div><small>REFERENCIA</small><br>Pedido ${esc(i.order_id ?? "—")}</div></div>
  <table><tr><th>Concepto</th><th class="r">Base imponible</th></tr><tr><td>${esc(i.concept)}</td><td class="r">${f(i.base_cents)}</td></tr></table>
  <div class="tot"><div><span>Base imponible</span><span>${f(i.base_cents)}</span></div><div><span>IVA ${Math.round(i.vat_rate * 100)} %</span><span>${f(i.vat_cents)}</span></div><div class="g"><span>Total</span><span>${f(i.total_cents)}</span></div></div>
  <p class="muted" style="margin-top:48px;font-size:12px">Documento de demostración. Los datos fiscales del emisor deben completarse antes de su uso real.</p>
  <p class="noprint"><button onclick="print()">Imprimir / guardar PDF</button></p></html>`;
}
