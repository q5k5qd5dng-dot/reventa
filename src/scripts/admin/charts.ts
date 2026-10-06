import { esc } from "./util";

const NS = "http://www.w3.org/2000/svg";
type Pt = { x: number; y: number };
const smooth = (p: Pt[]) => {
  if (p.length < 3) return p.map((q, i) => `${i ? "L" : "M"}${q.x},${q.y}`).join("");
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c, k = 0.18; d += `C${b.x + (c.x - a.x) * k},${b.y + (c.y - a.y) * k} ${c.x - (e.x - b.x) * k},${c.y - (e.y - b.y) * k} ${c.x},${c.y}`; }
  return d;
};
const nice = (max: number) => { if (max <= 0) return 1; const p = 10 ** Math.floor(Math.log10(max)), n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
const compact = (n: number) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "") + "M" : Math.abs(n) >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(".0", "") + "k" : String(Math.round(n * 10) / 10));
const cssv = (v: string) => `var(${v})`;

export interface Serie { name: string; color: string; data: number[]; fmt?: (n: number) => string; area?: boolean; dashed?: boolean }
export interface LineOpts { height?: number; labels: string[]; series: Serie[]; yFmt?: (n: number) => string; xEvery?: number; mode?: "line" | "bars" }

/** Gráfico de líneas/áreas o barras con ejes, rejilla, tooltip y cruz de seguimiento. */
export function lineChart(host: HTMLElement, o: LineOpts) {
  const W = host.clientWidth || 640, H = o.height ?? 260, m = { t: 14, r: 12, b: 26, l: 46 }, iw = W - m.l - m.r, ih = H - m.t - m.b, n = o.labels.length;
  const max = nice(Math.max(...o.series.flatMap((s) => s.data), 1) * 1.05), yFmt = o.yFmt ?? compact;
  const x = (i: number) => m.l + (o.mode === "bars" ? (i + 0.5) * (iw / n) : n === 1 ? iw / 2 : (i / (n - 1)) * iw), y = (v: number) => m.t + ih - (v / max) * ih;
  const uid = "g" + Math.random().toString(36).slice(2, 7);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><defs>${o.series.map((q, i) => `<linearGradient id="${uid}${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${q.color}" stop-opacity=".28"/><stop offset="1" stop-color="${q.color}" stop-opacity="0"/></linearGradient>`).join("")}</defs><g class="axis">`;
  for (let i = 0; i <= 4; i++) { const v = (max / 4) * i, yy = y(v); s += `<line class="grid-l" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/><text x="${m.l - 8}" y="${yy + 4}" text-anchor="end">${yFmt(v)}</text>`; }
  const every = o.xEvery ?? Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 78))));
  o.labels.forEach((l, i) => { if (i % every === 0 || i === n - 1 && n - 1 - (i - (i % every)) > every / 2) s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(l)}</text>`; });
  s += "</g>";
  if (o.mode === "bars") {
    const bw = Math.min(26, (iw / n) * 0.62), k = o.series.length, w1 = bw / k;
    o.series.forEach((q, si) => q.data.forEach((v, i) => { const hh = Math.max(0, ih - (y(v) - m.t)); s += `<rect class="bar" data-i="${i}" x="${x(i) - bw / 2 + si * w1}" y="${y(v)}" width="${Math.max(2, w1 - 2)}" height="${hh}" rx="${Math.min(5, w1 / 2)}" fill="${q.color}" style="transform-origin:0 ${m.t + ih}px"/>`; }));
  } else o.series.forEach((q, si) => {
    const pts = q.data.map((v, i) => ({ x: x(i), y: y(v) })), d = smooth(pts);
    if (q.area !== false) s += `<path class="area" d="${d}L${pts.at(-1)!.x},${m.t + ih}L${pts[0].x},${m.t + ih}Z" fill="url(#${uid}${si})"/>`;
    s += `<path class="ln" d="${d}" fill="none" stroke="${q.color}" stroke-width="2.4" stroke-linecap="round" ${q.dashed ? 'stroke-dasharray="5 5"' : ""} pathLength="1"/>`;
  });
  s += `<line class="cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" stroke="${cssv("--line-2")}" stroke-width="1.5" style="opacity:0"/>`;
  o.series.forEach((q, si) => (s += `<circle class="dot" data-s="${si}" r="4.5" fill="${cssv("--surface")}" stroke="${q.color}" stroke-width="2.5" style="opacity:0"/>`));
  s += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/></svg><div class="tip"></div>`;
  host.innerHTML = s; host.classList.add("chart");
  const svg = host.querySelector("svg")!, tip = host.querySelector<HTMLElement>(".tip")!, cross = svg.querySelector<SVGElement>(".cross")!, dots = [...svg.querySelectorAll<SVGElement>(".dot")];
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    svg.querySelectorAll<SVGPathElement>(".ln").forEach((p, i) => { p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1"; p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: i * 90, easing: "cubic-bezier(.3,.8,.3,1)", fill: "forwards" }).onfinish = () => { p.style.strokeDasharray = q0(o.series[i]?.dashed); p.style.strokeDashoffset = "0"; }; });
    svg.querySelectorAll<SVGElement>(".area").forEach((p, i) => p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300 + i * 90, fill: "backwards" }));
    svg.querySelectorAll<SVGElement>(".bar").forEach((r, i) => r.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 650, delay: (i % n) * 14, easing: "cubic-bezier(.3,.8,.3,1)", fill: "backwards" }));
  }
  const move = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, o.mode === "bars" ? Math.floor((px - m.l) / (iw / n)) : Math.round(((px - m.l) / iw) * (n - 1))));
    cross.style.opacity = o.mode === "bars" ? "0" : "1"; cross.setAttribute("x1", String(x(i))); cross.setAttribute("x2", String(x(i)));
    dots.forEach((d, si) => { d.style.opacity = o.mode === "bars" ? "0" : "1"; d.setAttribute("cx", String(x(i))); d.setAttribute("cy", String(y(o.series[si].data[i]))); });
    tip.innerHTML = `<b>${esc(o.labels[i])}</b>${o.series.map((q) => `<div><span><i style="background:${q.color}"></i>${esc(q.name)}</span><span>${(q.fmt ?? yFmt)(q.data[i])}</span></div>`).join("")}`;
    const tw = tip.offsetWidth, left = (x(i) / W) * r.width; tip.style.left = Math.max(4, Math.min(r.width - tw - 4, left + 14 + tw > r.width ? left - tw - 14 : left + 14)) + "px"; tip.style.top = "8px"; tip.classList.add("on");
  };
  svg.addEventListener("pointermove", move); svg.addEventListener("pointerleave", () => { tip.classList.remove("on"); cross.style.opacity = "0"; dots.forEach((d) => (d.style.opacity = "0")); });
  let w0 = W; const ro = new ResizeObserver(() => { const w = host.clientWidth; if (Math.abs(w - w0) > 24 && host.isConnected) { w0 = w; lineChart(host, o); } }); ro.observe(host);
}
const q0 = (d?: boolean) => (d ? "5 5" : "none");

/** Mini línea para tarjetas KPI. */
export function sparkline(data: number[], color = "var(--accent)") {
  const W = 200, H = 44, max = Math.max(...data, 1), min = Math.min(...data, 0), pts = data.map((v, i) => ({ x: (i / Math.max(1, data.length - 1)) * W, y: H - 6 - ((v - min) / (max - min || 1)) * (H - 14) })), d = smooth(pts), id = "s" + Math.random().toString(36).slice(2, 7);
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${W},${H}L0,${H}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>`;
}

/** Donut con leyenda. */
export function donut(host: HTMLElement, items: { k: string; v: number; color?: string }[], fmt: (n: number) => string, center?: { top: string; bottom: string }) {
  const cols = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)", "var(--c7)", "var(--c8)"], tot = items.reduce((a, b) => a + b.v, 0) || 1, R = 62, C = 2 * Math.PI * R;
  let off = 0, arcs = "";
  items.forEach((it, i) => { const len = (it.v / tot) * C; arcs += `<circle class="arc" r="${R}" cx="80" cy="80" fill="none" stroke="${it.color ?? cols[i % cols.length]}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${esc(it.k)}: ${fmt(it.v)}</title></circle>`; off += len; });
  host.innerHTML = `<div class="donut-wrap"><svg width="160" height="160" viewBox="0 0 160 160"><circle r="${R}" cx="80" cy="80" fill="none" stroke="var(--surface-3)" stroke-width="20"/>${arcs}${center ? `<text x="80" y="78" text-anchor="middle" font-size="19" font-weight="600" fill="var(--text)">${esc(center.top)}</text><text x="80" y="96" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(center.bottom)}</text>` : ""}</svg><div class="lg">${items.map((it, i) => `<div><span><i style="background:${it.color ?? cols[i % cols.length]}"></i>${esc(it.k)}</span><b>${fmt(it.v)} <span class="faint" style="font-weight:400">· ${Math.round((it.v / tot) * 100)}%</span></b></div>`).join("")}</div></div>`;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) host.querySelectorAll<SVGElement>(".arc").forEach((a, i) => a.animate([{ opacity: 0, strokeWidth: 8 }, { opacity: 1, strokeWidth: 20 }], { duration: 700, delay: i * 80, easing: "cubic-bezier(.3,.8,.3,1)", fill: "backwards" }));
}

/** Barras horizontales con valor. */
export function hbars(items: { k: string; v: number; sub?: string }[], fmt: (n: number) => string, color = "var(--c1)") {
  const max = Math.max(...items.map((i) => i.v), 1);
  return `<div class="hbars">${items.map((it) => `<div class="hbar"><div class="top2"><span class="trunc">${esc(it.k)}</span><b>${fmt(it.v)}${it.sub ? ` <span class="faint" style="font-weight:400">${esc(it.sub)}</span>` : ""}</b></div><div class="tr"><i style="width:${(it.v / max) * 100}%;background:${color}"></i></div></div>`).join("")}</div>`;
}

/** Mapa de calor día × hora. */
export function heatmap(host: HTMLElement, data: number[][]) {
  const max = Math.max(...data.flat(), 1), days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let s = `<div class="heat"><span></span>${Array.from({ length: 24 }, (_, h) => `<span class="hl">${h % 3 === 0 ? h : ""}</span>`).join("")}`;
  data.forEach((row, d) => { s += `<span class="dl">${days[d]}</span>`; row.forEach((v, h) => (s += `<span class="c" title="${days[d]} ${h}:00 · ${v} pedidos" style="opacity:${v ? 0.14 + (v / max) * 0.86 : 0.06}"></span>`)); });
  host.innerHTML = s + "</div>";
}
