import { SITE, help, legal, events, extra, fechaLarga } from "../seo";
export const GET = () => {
  const out = [`# Handticket — documentación completa\n\nSitio: ${SITE}\n`];
  out.push("## Eventos\n" + events.map((e) => `### ${extra[e.id].name}\n${fechaLarga(e.date)} · ${e.v}, ${e.c}\n${e.desc}\nEntradas: ${extra[e.id].tickets.map((t) => `${t.n} desde ${t.from} €`).join("; ")}\n${SITE}/evento/${e.id}/`).join("\n\n"));
  out.push("## Centro de ayuda\n" + help.map((c) => `### ${c.n}\n${c.items.map((a) => `#### ${a.t}\n${a.body.join("\n")}\n${SITE}/ayuda/${c.id}/${a.slug}/`).join("\n\n")}`).join("\n\n"));
  out.push("## Legal\n" + legal.map((d) => `### ${d.n}\n${d.intro}\n${d.secs.map((s) => `#### ${s.h}\n${s.p.join("\n")}`).join("\n")}`).join("\n\n"));
  return new Response(out.join("\n\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
};
