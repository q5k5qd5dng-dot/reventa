// Pinta los carteles de eventos en canvas, los guarda como WebP y calcula el color dominante.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const { execFileSync } = require("child_process");
(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 } });
  p.on("console", m => { if (m.type()==="error") console.log("C:", m.text().slice(0,200)); });
  p.on("pageerror", e => console.log("PAGEERR", e.message));
  await p.goto("http://localhost:8765/tools/art.html");
  await p.waitForFunction(() => window.paint && window.ids);
  const ids = await p.evaluate(() => window.ids);
  const outJson = fs.existsSync("src/data/art.json") ? JSON.parse(fs.readFileSync("src/data/art.json","utf8")) : {};
  for (const id of ids) {
    if (only.length && !only.includes(id)) continue;
    const r = await p.evaluate((id) => window.paint(id), id);
    const png = "/tmp/claude-0/-home-user-reventa/602bfa5a-9fc8-5e14-bfdf-6db1492a434b/scratchpad/art-" + id + ".png";
    fs.writeFileSync(png, Buffer.from(r.png.split(",")[1], "base64"));
    execFileSync("ffmpeg", ["-v","error","-y","-i",png,"-vf","scale=820:820","-c:v","libwebp","-quality","72","-compression_level","6","src/assets/art/"+id+".webp"]);
    const hex = "#" + r.tint.map(v => v.toString(16).padStart(2,"0")).join("");
    outJson[id] = { tint: hex, sat: +r.sat.toFixed(3) };
    console.log(id, hex, r.sat.toFixed(2), fs.statSync("src/assets/art/"+id+".webp").size);
  }
  fs.writeFileSync("src/data/art.json", JSON.stringify(outJson, null, 2));
  await b.close();
})();
