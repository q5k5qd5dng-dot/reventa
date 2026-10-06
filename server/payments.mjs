import crypto from "node:crypto";
import { config } from "./config.mjs";

/**
 * Pasarela de pago.
 *  · Sin STRIPE_SECRET_KEY → "mock": el pago se aprueba al instante (solo desarrollo).
 *  · Con STRIPE_SECRET_KEY → Stripe Checkout: el pedido queda `pending` hasta que llega el webhook.
 */
export const mode = () => (config.stripeKey ? "stripe" : "mock");

export async function charge({ orderId, totalCents, description, email }) {
  if (mode() === "mock") return { status: "paid", provider: "mock", ref: `mock_${orderId}` };
  const body = new URLSearchParams({
    mode: "payment", customer_email: email, client_reference_id: orderId,
    success_url: `${config.publicUrl}/#/mis-entradas`, cancel_url: `${config.publicUrl}/#/`,
    "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(totalCents), "line_items[0][price_data][product_data][name]": description,
    "payment_intent_data[metadata][order_id]": orderId, "metadata[order_id]": orderId,
  });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${config.stripeKey}`, "content-type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json();
  if (!r.ok) throw new Error(`Stripe: ${j.error?.message ?? r.status}`);
  return { status: "pending", provider: "stripe", ref: j.id, url: j.url };
}

/** Verifica la firma `Stripe-Signature` de un webhook (HMAC-SHA256, tolerancia 5 min). */
export function verifyStripe(raw, header) {
  if (!config.stripeWebhookSecret || !header) return false;
  const p = Object.fromEntries(header.split(",").map((x) => x.split("=")));
  if (!p.t || !p.v1 || Math.abs(Date.now() / 1000 - +p.t) > 300) return false;
  const exp = crypto.createHmac("sha256", config.stripeWebhookSecret).update(`${p.t}.${raw}`).digest("hex");
  return exp.length === p.v1.length && crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(p.v1));
}
export async function refund(ref) {
  if (mode() === "mock") return true;
  const r = await fetch("https://api.stripe.com/v1/refunds", { method: "POST", headers: { authorization: `Bearer ${config.stripeKey}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ payment_intent: ref }) });
  return r.ok;
}
