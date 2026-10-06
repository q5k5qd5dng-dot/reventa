// Empaqueta el script de cada página y lo mete dentro del HTML (un solo archivo que funciona con file://)
import { build } from "esbuild";
import fs from "node:fs";

const pages = [
  ["dist/index.html", "src/scripts/replica.ts"],
  ["dist/pro/index.html", "src/scripts/main.ts"],
];
for (const [html, entry] of pages) {
  if (!fs.existsSync(html)) continue;
  const r = await build({ entryPoints: [entry], bundle: true, minify: true, format: "iife", write: false, target: "es2020", legalComments: "none" });
  const code = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  let h = fs.readFileSync(html, "utf8");
  const before = h.length;
  h = h.replace(/<script type="module" src="[^"]*"><\/script>/, () => `<script>${code}</script>`);
  fs.writeFileSync(html, h);
  console.log(`${html}: ${before} → ${h.length} bytes`);
}
