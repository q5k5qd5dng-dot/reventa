// Renderiza tools/seats.html con Chromium y guarda el PNG con alfa.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
(async () => {
  const q = process.argv[2] || "";
  const out = process.argv[3] || "/tmp/claude-0/-home-user-reventa/602bfa5a-9fc8-5e14-bfdf-6db1492a434b/scratchpad/seats.png";
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 1300, height: 500 } });
  p.on("console", m => { if (m.type()==="error") console.log("C:", m.text().slice(0,200)); });
  p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto("http://localhost:8765/tools/seats.html" + q);
  await p.waitForFunction(() => window.__done, null, { timeout: 120000 });
  const d = await p.evaluate(() => window.__png);
  fs.writeFileSync(out, Buffer.from(d.split(",")[1], "base64"));
  console.log("SEAT", JSON.stringify(await p.evaluate(() => window.__seat)));
  await b.close();
  console.log("ok", out);
})();
