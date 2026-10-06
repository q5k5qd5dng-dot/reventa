export type Link = [label: string, href: string];

export const menus: [string, [string, string, string][]][] = [
  ["Soluciones", [
    ["Venta de entradas", "Tienda online y QR", "/#solucion"],
    ["Taquilla", "Vende en puerta", "/#solucion"],
    ["Reservas y VIP", "Mesas y botellas", "/#solucion"],
    ["Pases de temporada", "Fideliza a tu público", "/#solucion"],
    ["Gestión de RRPP", "Listas y comisiones", "/promotores"],
    ["Control de accesos", "Aforo en directo", "/#solucion"],
  ]],
  ["Servicios", [
    ["Marca blanca y API", "Tu marca, tu dominio", "/#diferencia"],
    ["Integraciones", "Conecta tus canales", "/#integraciones"],
    ["Soporte 24/7", "Backstage del éxito", "/#soporte"],
    ["Formación", "Para todo tu equipo", "/#faq"],
  ]],
  ["Recursos", [
    ["Blog", "Ideas para tu local", "#"],
    ["Lanzamientos", "Lo último de Wave", "#"],
    ["Casos de éxito", "Locales que ya venden", "/#casos"],
    ["Academy", "Aprende con nosotros", "#"],
  ]],
  ["Nosotros", [
    ["Quiénes somos", "Nacidos en Zaragoza", "/#creamos"],
    ["Trabaja con nosotros", "Únete al equipo", "#"],
    ["Wave Business Days", "Eventos para locales", "#"],
    ["Contacto", "Hablemos", "/#cta"],
  ]],
];

export const sectorLinks: Link[] = [
  ["Discotecas", "/discotecas"],
  ["Promotores", "/promotores"],
  ["Beach Clubs", "/beach-clubs"],
  ["Festivales", "/festivales"],
];

export const footer = {
  a: ["Venta de entradas", "Venta en taquilla", "Reservas y VIP", "Pases de temporada", "Cajas de bolsillo", "Gestión de RRPP", "Buses y paquetes"],
  b: ["Control de accesos", "Entrega digital", "CRM y base de datos", "Marketing digital", "Informes en directo", "Software TPV", "Zona Fiesta y Match"],
  n: ["Trabaja con nosotros", "Wave Business Days"],
  r: ["Blog", "Lanzamientos", "Casos de éxito", "Academy"],
};

export interface Sector {
  slug: string;
  name: string;
  eyebrow: string;
  h1: [string, string];
  lead: string;
  features: [string, string][];
  steps: [string, string][];
  checks: string[];
  faqs: [string, string][];
  variant: number;
}

export const sectors: Sector[] = [
  {
    slug: "discotecas", name: "Discotecas", eyebrow: "Wave para discotecas",
    h1: ["Haz que tu operativa sea", "poderosa en cada detalle"],
    lead: "Entradas, listas, mesas, taquilla y barra en un único panel. Sabes quién entra, cuánto vendes y cómo va la noche mientras ocurre.",
    features: [
      ["Entradas con QR", "Venta online con tu marca y acceso rápido desde el móvil. Sin papel ni colas largas."],
      ["Reservas VIP con mapa", "Tus clientes eligen mesa en un plano de la sala. Tú controlas depósitos y consumiciones."],
      ["Taquilla y puerta", "Vende en puerta y escanea accesos con la misma información que la tienda online."],
      ["Aforo en directo", "Cada QR escaneado se refleja al instante. Sabes cuánta gente hay dentro y cuánta falta."],
      ["CRM propio", "Cada cliente queda en tu base de datos privada: historial, gasto y frecuencia de visita."],
      ["TPV de barra y guardarropa", "Cobra en barra y guardarropa y cruza las ventas con las entradas de cada noche."],
    ],
    steps: [["Crea la noche", "Define entradas, precios, aforos y mesas en minutos."], ["Vende y reparte", "Tienda online, taquilla y tu equipo de RRPP vendiendo a la vez."], ["Controla y analiza", "Accesos en directo y un informe al cerrar."]],
    checks: ["Centraliza toda la información en tiempo real", "Reduce las colas en la puerta del evento", "Conoce a tus clientes y haz que vuelvan", "Cierra la noche con cifras claras"],
    faqs: [["¿Puedo vender entradas y mesas a la vez?", "Sí. Entradas, listas y reservas de mesa comparten aforo y datos desde el mismo panel."], ["¿Cómo controlo los accesos?", "Con la app de acceso escaneas los QR desde cualquier móvil y el aforo se actualiza al instante."], ["¿Los datos de clientes son míos?", "Sí. Tu base de datos es privada y Wave no la usa con otros fines."]],
    variant: 0,
  },
  {
    slug: "promotores", name: "Promotores", eyebrow: "Wave para promotoras",
    h1: ["Controla ventas, listas y", "comisiones de tu equipo"],
    lead: "Cada RRPP con su enlace, sus ventas y sus comisiones calculadas solas. Tú ves el rendimiento de todo el equipo en una pantalla.",
    features: [
      ["Enlace por RRPP", "Cada miembro del equipo vende con su propio enlace y su propio código."],
      ["Comisiones automáticas", "Se calculan por entrada vendida, sin hojas de cálculo ni discusiones el lunes."],
      ["Listas y cupos", "Reparte cupos de lista por RRPP y ve quién los llena y quién no."],
      ["Ranking de equipo", "Compara ventas, asistentes y conversión de cada RRPP noche a noche."],
      ["Liquidaciones claras", "Resumen por evento y por persona para pagar a tu equipo sin errores."],
      ["Comunicación con tu público", "Avisa a tus clientes de la siguiente fiesta con tu propia base de datos."],
    ],
    steps: [["Da de alta a tu equipo", "Crea a cada RRPP y asígnale comisión y cupo."], ["Vendedlo juntos", "Cada uno comparte su enlace y vende desde el móvil."], ["Liquida sin líos", "Informe final con ventas y comisiones por persona."]],
    checks: ["Colabora con locales y otros promotores de forma controlada", "Ajusta las campañas a tu público", "Mide el rendimiento real de cada RRPP", "Paga las comisiones sin errores"],
    faqs: [["¿Cómo se calculan las comisiones?", "Las defines tú por RRPP o por evento y Wave las suma automáticamente con cada venta."], ["¿Puedo trabajar con varios locales?", "Sí. Gestionas eventos de distintos locales desde la misma cuenta."], ["¿Qué ve cada RRPP?", "Solo sus propias ventas, su cupo y su comisión."]],
    variant: 2,
  },
  {
    slug: "beach-clubs", name: "Beach Clubs", eyebrow: "Wave para beach clubs",
    h1: ["Reservas y mesas para", "el día y la noche"],
    lead: "Camas, tumbonas, mesas y entradas con una sola herramienta. Tus clientes reservan desde el móvil y tú controlas la ocupación de cada zona.",
    features: [
      ["Mapa de zonas", "Camas balinesas, tumbonas y mesas en un plano que el cliente puede elegir."],
      ["Reservas con depósito", "Cobra una señal al reservar y reduce los plantones."],
      ["Consumo mínimo", "Define el mínimo por zona y por día, con precios distintos entre semana y fin de semana."],
      ["Pases de día y de noche", "Vende entrada al día, a la tarde o a la fiesta nocturna desde el mismo evento."],
      ["TPV en mesa", "Los pedidos se asocian a la reserva y se cobran al final sin sorpresas."],
      ["Datos de clientes", "Sabes quién repite, cuánto consume y cuándo vuelve."],
    ],
    steps: [["Dibuja tus zonas", "Sube tu plano y define precios y mínimos."], ["Abre las reservas", "Tus clientes reservan y pagan desde el móvil."], ["Gestiona el servicio", "Ocupación, pedidos y cobros en una sola pantalla."]],
    checks: ["Digitaliza y mejora la operativa de tus reservas", "Cobra depósito para evitar plantones", "Gestiona el día y la noche en la misma herramienta", "Conoce a tus clientes habituales"],
    faqs: [["¿Puedo vender por días o por franjas?", "Sí. Puedes crear pases de día, de tarde y de noche con precios y aforos propios."], ["¿Cómo cobro el depósito?", "Se cobra online al reservar y se descuenta del consumo."], ["¿Funciona con mi plano?", "Sí. Montamos el plano de tu local con tus zonas y numeración."]],
    variant: 1,
  },
  {
    slug: "festivales", name: "Festivales", eyebrow: "Wave para festivales",
    h1: ["Aforos grandes, accesos", "ágiles y pagos seguros"],
    lead: "Abonos, entradas por día, varias zonas y varios accesos con control en tiempo real. Pensado para miles de personas entrando a la vez.",
    features: [
      ["Abonos y entradas por día", "Vende abono completo, entrada diaria y packs con precios por fases."],
      ["Varias zonas y accesos", "Controla escáneres en cada puerta y reparte el flujo de entrada."],
      ["Aforo por zona", "Seguimiento de aforo global y de cada recinto o escenario."],
      ["Buses y paquetes", "Añade transporte, alojamiento o extras a la compra de la entrada."],
      ["Pagos seguros", "Todos los métodos de pago, con comisiones claras y reembolsos sencillos."],
      ["Informes en directo", "Ventas, accesos y recaudación al minuto, para decidir sobre la marcha."],
    ],
    steps: [["Configura el recinto", "Zonas, accesos, tipos de entrada y fases de precio."], ["Vende con antelación", "Tienda online, packs y venta por canales."], ["Controla el día del evento", "Accesos y aforo en directo en cada puerta."]],
    checks: ["Digitaliza los accesos de todo el recinto", "Reduce las colas en las puertas", "Controla el aforo por zonas", "Recibe el informe final al terminar"],
    faqs: [["¿Aguanta muchas entradas a la vez?", "La venta y el acceso están pensados para picos de demanda y cientos de escaneos por minuto."], ["¿Puedo vender abonos y entradas por día?", "Sí, con precios por fases y límites por tipo de entrada."], ["¿Puedo incluir bus o alojamiento?", "Sí. Los extras se añaden como productos a la compra."]],
    variant: 1,
  },
];
