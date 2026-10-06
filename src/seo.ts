import { events, fechaLarga, type Ev } from "./data/events";
import { extra } from "./data/extra";
import { help, allArticles } from "./data/help";
import { legal } from "./data/legal";
import { brand } from "./brand";

/** Dominio público. Cámbialo con SITE_URL al desplegar. */
export const SITE = (import.meta.env.SITE_URL ?? "https://handticket.es").replace(/\/$/, "");
export const abs = (p: string) => `${SITE}${p}`;
export const DESC = "Compra y vende entradas de conciertos, festivales, discotecas, teatro y deporte con pago protegido, entrega al instante y vendedores verificados. Reventa de entradas segura y legal en España.";

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const cities = ["Madrid", "Barcelona", "Bilbao", "Ibiza", "Valencia", "Sevilla", "Málaga", "A Coruña", "Donostia", "Zaragoza", "Tenerife", "Murcia"];
export const categories = [
  { slug: "conciertos", n: "conciertos", cats: ["musica"], h: "Entradas de conciertos" },
  { slug: "festivales", n: "festivales", cats: ["festival"], h: "Entradas de festivales" },
  { slug: "discotecas", n: "discotecas y clubs", cats: ["club"], h: "Entradas de discotecas y clubs" },
  { slug: "futbol-y-deporte", n: "fútbol y deporte", cats: ["deporte"], h: "Entradas de fútbol y deporte" },
  { slug: "teatro-y-musicales", n: "teatro y musicales", cats: ["teatro"], h: "Entradas de teatro y musicales" },
];
export const landings = [
  ...cities.map((c) => ({ slug: `reventa-entradas-${slugify(c)}`, kind: "city" as const, name: c })),
  ...categories.map((c) => ({ slug: slugify(c.h), kind: "cat" as const, name: c.n, cat: c })),
];

export const eventsIn = (city: string) => events.filter((e) => slugify(e.c) === slugify(city) || slugify(extra[e.id].area) === slugify(city));
export const eventsCat = (cats: string[]) => events.filter((e) => cats.includes(e.cat));

const orgId = abs("/#organization");
export const organization = () => ({
  "@type": "Organization", "@id": orgId, name: brand.name, url: abs("/"), logo: abs("/favicon.svg"),
  description: DESC, areaServed: { "@type": "Country", name: "España" }, foundingLocation: { "@type": "Place", name: "Zaragoza, España" },
  slogan: "Reventa de entradas segura y legal",
});
export const website = () => ({
  "@type": "WebSite", "@id": abs("/#website"), url: abs("/"), name: brand.name, inLanguage: "es-ES", publisher: { "@id": orgId },
  potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: abs("/#/buscar/{search_term_string}") }, "query-input": "required name=search_term_string" },
});
const iso = (d: string) => d.length === 19 ? `${d}+02:00` : d;
export const eventLd = (e: Ev) => {
  const x = extra[e.id];
  return {
    "@type": "Event", "@id": abs(`/evento/${e.id}/#event`), name: x.name, description: e.desc, startDate: iso(e.date), eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", image: [abs(`/og/${e.id}.webp`)],
    location: { "@type": "Place", name: e.v, address: { "@type": "PostalAddress", streetAddress: x.address, addressLocality: e.c, addressCountry: "ES" } },
    performer: x.people.map((p) => ({ "@type": "PerformingGroup", name: p })),
    offers: x.tickets.map((t) => ({ "@type": "Offer", name: t.n, price: t.from, priceCurrency: "EUR", availability: t.list ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: abs(`/evento/${e.id}/`), seller: { "@id": orgId }, validFrom: "2026-01-01" })),
  };
};
export const faqLd = (qa: { q: string; a: string }[]) => ({ "@type": "FAQPage", mainEntity: qa.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) });
export const crumbs = (items: [string, string][]) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([n, u], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: abs(u) })) });
export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });

/** Preguntas frecuentes para la portada (también visibles en la página). */
export const homeFaq = [
  { q: "¿Qué es Handticket?", a: "Handticket es una plataforma de reventa de entradas segura y legal en España. Permite comprar entradas de conciertos, festivales, discotecas, teatro y deporte a otros usuarios, y vender las que no puedes usar, con pago protegido y entrega al instante." },
  { q: "¿Es legal revender entradas en Handticket?", a: "Sí. Handticket actúa como intermediario entre particulares y limita el precio de venta al 130 % del precio original de la entrada, respetando las condiciones de cada organizador." },
  { q: "¿Cómo sé que mi entrada es auténtica?", a: "Cada entrada pasa por un protocolo antifraude: verificamos el código QR, comprobamos que no esté duplicada y que el vendedor tenga verificados su teléfono y su cuenta bancaria. Si algo falla, devolvemos el dinero." },
  { q: "¿Cuánto cuesta vender una entrada?", a: "Publicar un anuncio es gratis. Handticket cobra una comisión del 10 % solo cuando la entrada se vende." },
  { q: "¿Cuándo cobro si vendo una entrada?", a: "El pago se transfiere por SEPA a tu cuenta después de celebrarse el evento. Mientras tanto el importe queda retenido de forma segura para proteger al comprador." },
  { q: "¿Cuándo recibo mi entrada?", a: "Normalmente al instante: en cuanto se confirma el pago, la entrada con su código QR aparece en «Mis entradas»." },
];
export const helpFaq = () => allArticles().map((a) => ({ q: a.t, a: a.body.join(" ") }));
export { events, extra, help, allArticles, legal, fechaLarga, brand };
