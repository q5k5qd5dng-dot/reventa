import type { Ev } from "./events";

export interface TicketType { n: string; sub: string; list: number; from: number }
export interface Extra {
  name: string;
  area: string;
  address: string;
  people: string[];
  tickets: TicketType[];
  demand: string;
  wanted: number;
  kind: string;
}

export const extra: Record<string, Extra> = {
  "gira-verano": {
    name: "Karol Vega - Gira Verano 2027", area: "Madrid", address: "Av. de Luis Aragonés, 4, 28022, Madrid", kind: "Estadio",
    people: ["Karol Vega", "Zoe Ferrán", "Max Aldea", "Nico Brava"],
    tickets: [
      { n: "Pista General", sub: "24 de junio de 2027, 20:00", list: 9, from: 68 },
      { n: "Grada Lateral", sub: "24 de junio de 2027, 20:00", list: 4, from: 82 },
      { n: "Tribuna Preferente", sub: "24 de junio de 2027, 20:00", list: 1, from: 140 },
    ],
    demand: "Alta demanda", wanted: 412,
  },
  "duro-festival": {
    name: "Duro Festival XXI", area: "Montmeló", address: "Camí Mas Moreneta, 08160, Montmeló, Barcelona", kind: "Recinto",
    people: ["Nora Vex", "Kilo Ray", "Lumen", "Marea Alta", "DJ Cobalto", "Irina Kos", "Fantasma", "Novah", "Fátima H."],
    tickets: [
      { n: "Abono 2 días", sub: "10 de octubre - 11 de octubre", list: 12, from: 54 },
      { n: "Entrada Viernes", sub: "10 de octubre, 11:00", list: 6, from: 38 },
      { n: "Entrada Sábado", sub: "11 de octubre, 11:00", list: 0, from: 38 },
      { n: "Camping", sub: "10 de octubre - 11 de octubre", list: 0, from: 25 },
    ],
    demand: "Alta demanda", wanted: 284,
  },
  "viva-noche": {
    name: "Banda Norte - Viva Noche", area: "Madrid", address: "C/ de la Princesa, 25, 28008, Madrid", kind: "Sala",
    people: ["Banda Norte", "Los Faroles", "Calle Sur"],
    tickets: [
      { n: "Entrada anticipada", sub: "17 de octubre, 21:00", list: 7, from: 31 },
      { n: "Entrada en puerta", sub: "17 de octubre, 21:00", list: 3, from: 36 },
    ],
    demand: "Demanda media", wanted: 96,
  },
  "jornada-12": {
    name: "Local FC vs Visitante CF - Jornada 12", area: "Sevilla", address: "Av. de la Cartuja, s/n, 41092, Sevilla", kind: "Estadio",
    people: ["Local FC", "Visitante CF"],
    tickets: [
      { n: "Tribuna Sur", sub: "8 de noviembre, 16:00", list: 22, from: 42 },
      { n: "Gol Norte", sub: "8 de noviembre, 16:00", list: 31, from: 38 },
      { n: "Fondo Este", sub: "8 de noviembre, 16:00", list: 9, from: 35 },
      { n: "Palco", sub: "8 de noviembre, 16:00", list: 2, from: 260 },
    ],
    demand: "Demanda media", wanted: 180,
  },
  "noche-techno": {
    name: "Noche Techno - Sala Apolo", area: "Barcelona", address: "C/ Nou de la Rambla, 113, 08004, Barcelona", kind: "Sala",
    people: ["Resident DJs", "Kilo Ray", "Irina Kos", "Lumen"],
    tickets: [
      { n: "Entrada anticipada", sub: "25 de octubre, 00:00", list: 14, from: 18 },
      { n: "Entrada en puerta", sub: "25 de octubre, 00:00", list: 5, from: 25 },
      { n: "Mesa reservado VIP", sub: "25 de octubre, 00:00", list: 1, from: 180 },
    ],
    demand: "Alta demanda", wanted: 203,
  },
  "rey-escena": {
    name: "El Rey de la Escena - El Musical", area: "Zaragoza", address: "C/ Cinco de Marzo, 14, 50003, Zaragoza", kind: "Teatro",
    people: ["Elenco original", "Orquesta del Principal"],
    tickets: [
      { n: "Platea", sub: "3 de diciembre, 20:30", list: 12, from: 39 },
      { n: "Anfiteatro", sub: "3 de diciembre, 20:30", list: 18, from: 28 },
      { n: "Palco", sub: "3 de diciembre, 20:30", list: 3, from: 65 },
    ],
    demand: "Demanda media", wanted: 120,
  },
  "copa-europa": {
    name: "Copa de Europa - Semifinal", area: "Bilbao", address: "Alameda de Mazarredo, 1, 48009, Bilbao", kind: "Estadio",
    people: ["Club Local", "Club Visitante"],
    tickets: [
      { n: "Tribuna Lateral", sub: "29 de abril de 2027, 21:00", list: 2, from: 120 },
      { n: "Fondo", sub: "29 de abril de 2027, 21:00", list: 3, from: 95 },
      { n: "Palco VIP", sub: "29 de abril de 2027, 21:00", list: 1, from: 480 },
    ],
    demand: "Muy alta demanda", wanted: 1340,
  },
  "sunset-sessions": {
    name: "Sunset Sessions - Chill & House", area: "Zaragoza", address: "Paseo del Ebro, 12, 50008, Zaragoza", kind: "Terraza",
    people: ["Marea Alta", "DJ Cobalto", "Lumen"],
    tickets: [
      { n: "Entrada general", sub: "1 de noviembre, 18:00", list: 28, from: 22 },
      { n: "Mesa en terraza", sub: "1 de noviembre, 18:00", list: 4, from: 60 },
    ],
    demand: "Demanda media", wanted: 75,
  },
};

export const available = (id: string) => extra[id].tickets.reduce((a, t) => a + t.list, 0);

/** Texto SEO del evento (propio, genérico). */
export function seoText(e: Ev, x: Extra): { h: string; p: string[] } {
  const mes = new Date(e.date).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return {
    h: `Compra y vende entradas para ${e.t}`,
    p: [
      `🎟️ ${e.t} (${e.a}) llega a ${x.area} en ${mes}. En Handticket puedes comprar entradas de otros aficionados o vender las tuyas si finalmente no puedes ir, siempre con pago protegido y entrega garantizada.`,
      `📅 **¿Cuándo es ${e.t}?** El evento está programado para el ${new Date(e.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} a las ${e.time}. Te recomendamos consultar la web oficial del organizador por si hubiera cambios de horario.`,
      `📍 **¿Dónde es?** Tendrá lugar en ${e.v} (${x.address}). Recuerda llegar con tiempo: los accesos suelen abrir antes del comienzo.`,
      `🔒 **¿Es seguro comprar aquí?** Sí. Cada entrada se verifica antes de salir a la venta, tú pagas a Handticket y el vendedor cobra cuando has entrado al evento. Si algo falla, te devolvemos el importe.`,
      `💬 **¿Qué pasa si no puedo asistir?** Puedes poner tu entrada a la venta en un par de minutos desde “Vender entrada”. Cuando se venda recibirás el dinero de forma automática tras el evento.`,
    ],
  };
}
