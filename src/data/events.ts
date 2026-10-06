export type Kind = "rings" | "sun" | "waves" | "grid" | "blob" | "stripes" | "orbit" | "peaks";

export interface Ev {
  id: string;
  t: string;
  a: string;
  d: string;
  day: string;
  mon: string;
  time: string;
  v: string;
  c: string;
  p: number;
  cat: "musica" | "festival" | "deporte" | "teatro" | "club";
  kind: Kind;
  col: [string, string, string];
  hot?: boolean;
  left: number;
  date: string; // ISO para la cuenta atrás
  desc: string;
}

export const events: Ev[] = [
  { id: "gira-verano", t: "Gira Verano 2027", a: "Karol Vega", d: "24 jun 2027", day: "24", mon: "JUN", time: "20:00", v: "Estadio Metropolitano", c: "Madrid", p: 68, cat: "musica", kind: "sun", col: ["#ff2d95", "#ff8a3d", "#2b0a4f"], hot: true, left: 14, date: "2027-06-24T20:00:00", desc: "La gira del año aterriza en Madrid con un directo de dos horas, escenario 360° y un show de luces que no vas a olvidar." },
  { id: "duro-festival", t: "Duro Festival XXI", a: "Line-up completo", d: "10–11 oct", day: "10", mon: "OCT", time: "18:00", v: "Can Guitet", c: "Barcelona", p: 54, cat: "festival", kind: "grid", col: ["#e5e7eb", "#6b7280", "#050505"], hot: true, left: 9, date: "2026-10-10T18:00:00", desc: "Dos días, cuatro escenarios y lo mejor del techno y el house europeo. Pulsera de acceso para los dos días." },
  { id: "viva-noche", t: "Viva Noche", a: "Banda Norte", d: "17 oct", day: "17", mon: "OCT", time: "21:00", v: "Espacio Norte", c: "Madrid", p: 31, cat: "musica", kind: "rings", col: ["#ffe14d", "#ff9f1c", "#7a2e00"], left: 41, date: "2026-10-17T21:00:00", desc: "Una noche de rock con las mejores bandas del circuito nacional. Aforo de pie, barra y zona chill." },
  { id: "jornada-12", t: "Jornada 12 de Liga", a: "Local vs Visitante", d: "8 nov", day: "08", mon: "NOV", time: "16:00", v: "Estadio Municipal", c: "Sevilla", p: 42, cat: "deporte", kind: "stripes", col: ["#38bdf8", "#2563eb", "#0b1d5c"], left: 120, date: "2026-11-08T16:00:00", desc: "El derbi de la jornada. Entradas de grada y tribuna con acceso verificado en puerta." },
  { id: "noche-techno", t: "Noche Techno", a: "Resident DJs", d: "25 oct", day: "25", mon: "OCT", time: "00:00", v: "Sala Apolo", c: "Barcelona", p: 18, cat: "club", kind: "waves", col: ["#a78bfa", "#6d28d9", "#12002b"], left: 33, date: "2026-10-25T23:59:00", desc: "Sesión de madrugada con residentes y artistas invitados. Sonido de primera y cabina a pie de pista." },
  { id: "rey-escena", t: "El Rey de la Escena", a: "Musical", d: "3 dic", day: "03", mon: "DIC", time: "20:30", v: "Teatro Principal", c: "Zaragoza", p: 39, cat: "teatro", kind: "peaks", col: ["#fb7185", "#be123c", "#2b0410"], left: 56, date: "2026-12-03T20:30:00", desc: "El musical que ha llenado teatros de toda Europa llega por fin a Zaragoza. Butaca numerada." },
  { id: "copa-europa", t: "Copa de Europa", a: "Semifinal", d: "29 abr 2027", day: "29", mon: "ABR", time: "21:00", v: "Estadio Central", c: "Bilbao", p: 120, cat: "deporte", kind: "orbit", col: ["#34d399", "#0d9488", "#04201c"], hot: true, left: 6, date: "2027-04-29T21:00:00", desc: "La noche grande del fútbol europeo. Entradas muy limitadas, entrega garantizada y asiento verificado." },
  { id: "sunset-sessions", t: "Sunset Sessions", a: "Chill & House", d: "1 nov", day: "01", mon: "NOV", time: "18:00", v: "Terraza Ebro", c: "Zaragoza", p: 22, cat: "festival", kind: "blob", col: ["#fdba74", "#f43f5e", "#4c1d95"], left: 77, date: "2026-11-01T18:00:00", desc: "Atardecer, buena música y vistas al río. La sesión chill más bonita de la ciudad." },
];

export const byId = (id: string) => events.find((e) => e.id === id);

/** Arte procedural de póster. Devuelve un <svg> como string. */
export function poster(e: Pick<Ev, "kind" | "col" | "id">, seed = 0): string {
  const [a, b, c] = e.col;
  const id = `${e.id}-${seed}`;
  const defs = `<defs>
    <linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <radialGradient id="r-${id}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs><rect width="400" height="500" fill="url(#g-${id})"/>`;
  let art = "";
  switch (e.kind) {
    case "sun": {
      const rays = Array.from({ length: 24 }, (_, i) => `<path d="M200 230 L${200 + Math.cos((i / 24) * 6.283) * 520} ${230 + Math.sin((i / 24) * 6.283) * 520} L${200 + Math.cos(((i + 0.5) / 24) * 6.283) * 520} ${230 + Math.sin(((i + 0.5) / 24) * 6.283) * 520}Z" fill="#fff" opacity="${i % 2 ? 0.12 : 0.04}"/>`).join("");
      art = `<g class="spin-slow" style="transform-origin:200px 230px">${rays}</g><circle cx="200" cy="230" r="90" fill="${a}" opacity=".95"/><circle cx="200" cy="230" r="90" fill="url(#r-${id})"/><circle cx="200" cy="230" r="130" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
      break;
    }
    case "rings":
      art = Array.from({ length: 9 }, (_, i) => `<circle cx="${130 + i * 14}" cy="${210 + i * 6}" r="${34 + i * 26}" fill="none" stroke="#fff" stroke-opacity="${0.6 - i * 0.05}" stroke-width="${i % 2 ? 2 : 10}"/>`).join("") + `<circle cx="200" cy="230" r="40" fill="#fff" opacity=".9"/>`;
      break;
    case "waves":
      art = Array.from({ length: 12 }, (_, i) => `<path d="M-20 ${120 + i * 26} C 60 ${60 + i * 26}, 120 ${200 + i * 26}, 200 ${130 + i * 26} S 340 ${60 + i * 26}, 420 ${130 + i * 26}" fill="none" stroke="#fff" stroke-opacity="${0.15 + (i % 4) * 0.12}" stroke-width="${2 + (i % 3) * 3}"/>`).join("");
      break;
    case "grid":
      art = Array.from({ length: 12 }, (_, i) => `<line x1="${i * 36}" y1="0" x2="${200 + (i - 5.5) * 80}" y2="500" stroke="#fff" stroke-opacity=".35"/>`).join("") + Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * i * 4 + 150}" x2="400" y2="${i * i * 4 + 150}" stroke="#fff" stroke-opacity=".35"/>`).join("") + `<circle cx="200" cy="170" r="70" fill="#fff" opacity=".92"/>`;
      break;
    case "blob":
      art = `<path d="M70 330 C20 230 120 90 230 120 C340 150 380 270 300 350 C230 420 110 430 70 330Z" fill="#fff" opacity=".28"/><path d="M110 320 C80 250 150 160 230 180 C310 200 330 280 270 335 C220 380 140 380 110 320Z" fill="#fff" opacity=".5"/><circle cx="215" cy="255" r="48" fill="#fff"/>`;
      break;
    case "stripes":
      art = Array.from({ length: 14 }, (_, i) => `<rect x="${-100 + i * 48}" y="-20" width="22" height="560" fill="#fff" opacity="${i % 2 ? 0.2 : 0.07}" transform="rotate(18 200 250)"/>`).join("") + `<circle cx="200" cy="230" r="78" fill="none" stroke="#fff" stroke-width="6"/><path d="M200 152 L200 308 M122 230 L278 230" stroke="#fff" stroke-width="3"/><circle cx="200" cy="230" r="14" fill="#fff"/>`;
      break;
    case "orbit":
      art = `<g class="spin-slow" style="transform-origin:200px 230px">${Array.from({ length: 4 }, (_, i) => `<ellipse cx="200" cy="230" rx="${70 + i * 38}" ry="${30 + i * 16}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" transform="rotate(${i * 38 - 40} 200 230)"/>`).join("")}</g><circle cx="200" cy="230" r="46" fill="#fff"/><circle cx="200" cy="230" r="46" fill="url(#r-${id})"/>`;
      break;
    case "peaks":
      art = `<path d="M-10 420 L90 220 L160 330 L240 160 L330 340 L410 240 L410 520 L-10 520Z" fill="#fff" opacity=".22"/><path d="M-10 460 L70 320 L150 410 L250 270 L340 420 L410 340 L410 520 L-10 520Z" fill="#fff" opacity=".38"/><circle cx="290" cy="120" r="44" fill="#fff" opacity=".95"/>`;
      break;
  }
  return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}${art}<rect width="400" height="500" fill="url(#r-${id})" opacity=".35"/></svg>`;
}

export const places = [
  { n: "Sala Apolo", c: "Barcelona", e: 14 },
  { n: "Palau Sant Jordi", c: "Barcelona", e: 9 },
  { n: "WiZink Center", c: "Madrid", e: 17 },
  { n: "Auditorio de Zaragoza", c: "Zaragoza", e: 6 },
  { n: "Estadio de La Cartuja", c: "Sevilla", e: 8 },
];

export const cats = [
  { id: "all", n: "Todo" },
  { id: "musica", n: "Conciertos" },
  { id: "festival", n: "Festivales" },
  { id: "deporte", n: "Deportes" },
  { id: "teatro", n: "Teatro" },
  { id: "club", n: "Discotecas" },
];

const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const fechaLarga = (iso: string) => {
  const d = new Date(iso);
  const h = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} de ${MES[d.getMonth()]}${d.getFullYear() !== 2026 ? ` de ${d.getFullYear()}` : ""}, ${h}`;
};
