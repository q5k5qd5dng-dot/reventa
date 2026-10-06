// Exporta los eventos del front (src/data) a server/seed-events.json para sembrar la base de datos.
import { build } from "esbuild";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = path.join(os.tmpdir(), `seed-${Date.now()}.mjs`);
fs.writeFileSync(tmp + ".entry.ts", `import { events } from "${path.resolve("src/data/events.ts")}"; import { extra } from "${path.resolve("src/data/extra.ts")}"; export default events.map((e) => ({ ...extra[e.id], ...e, venueKind: extra[e.id].kind }));`);
await build({ entryPoints: [tmp + ".entry.ts"], bundle: true, format: "esm", outfile: tmp, platform: "node", logLevel: "error" });
const list = (await import(tmp)).default;
fs.writeFileSync("server/seed-events.json", JSON.stringify(list, null, 2));
console.log(`${list.length} eventos → server/seed-events.json`);
