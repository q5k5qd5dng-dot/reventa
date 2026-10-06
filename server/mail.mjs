import { config } from "./config.mjs";
/** Envía un email con Resend si hay RESEND_API_KEY; si no, lo imprime en consola (desarrollo). */
export async function sendMail({ to, subject, text }) {
  if (!config.resendKey) return console.log(`\n[mail → ${to}] ${subject}\n${text}\n`);
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${config.resendKey}`, "content-type": "application/json" }, body: JSON.stringify({ from: config.mailFrom, to, subject, text }) });
  if (!r.ok) console.error("[mail] error", r.status, await r.text());
}
