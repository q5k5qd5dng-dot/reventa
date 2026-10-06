import { SITE, events, allArticles, legal, landings, help } from "../seo";
export const GET = () => {
  const day = new Date().toISOString().slice(0, 10);
  const urls: [string, string, string][] = [
    ["/", "1.0", "daily"], ["/ayuda/", "0.7", "weekly"],
    ...events.map((e) => [`/evento/${e.id}/`, "0.9", "daily"] as [string, string, string]),
    ...landings.map((l) => [`/${l.slug}/`, "0.8", "weekly"] as [string, string, string]),
    ...allArticles().map((a) => [`/ayuda/${a.cat.id}/${a.slug}/`, "0.6", "monthly"] as [string, string, string]),
    ...legal.map((d) => [`/legal/${d.slug}/`, "0.3", "yearly"] as [string, string, string]),
  ];
  void help;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p, f]) => `  <url><loc>${SITE}${u}</loc><lastmod>${day}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
};
