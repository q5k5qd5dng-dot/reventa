// Pantallas y clips REALES de la app de Wave (public/app). No se editan: contienen usuarios reales.
export type AppScreenName = "ciudad" | "disco" | "entradas" | "feed" | "mensajes" | "actividad";

export const appScreens: Record<AppScreenName, { w: number; h: number; w640: number; h640: number; alt: string; bg: string; fg: string }> = {
  ciudad: { w: 1206, h: 2179, w640: 640, h640: 1156, bg: "#0a0c10", fg: "#fff", alt: "App de Wave, pantalla «Busca tu ciudad», con Zaragoza y Madrid" },
  disco: { w: 1206, h: 2176, w640: 640, h640: 1154, bg: "#0f131b", fg: "#fff", alt: "App de Wave, discotecas de Zaragoza con Bbsesh y Pulse" },
  entradas: { w: 1206, h: 2136, w640: 640, h640: 1133, bg: "#ffffff", fg: "#1a1a1a", alt: "Tienda de entradas de un evento en la app, con el tema rojo del organizador" },
  feed: { w: 1206, h: 2162, w640: 640, h640: 1147, bg: "#0a0c10", fg: "#fff", alt: "App de Wave, pantalla «Para ti», con historias y una publicación" },
  mensajes: { w: 1206, h: 2176, w640: 640, h640: 1154, bg: "#4e4f53", fg: "#fff", alt: "App de Wave, pantalla de Mensajes" },
  actividad: { w: 1206, h: 2130, w640: 640, h640: 1130, bg: "#0a0c10", fg: "#fff", alt: "App de Wave, pantalla de Actividad con seguidores y matches" },
};

export const experiences = [
  {
    key: "musica",
    title: "Party Music",
    badge: "DJ en directo",
    text: "Vota tus canciones favoritas y mira el Top 10.",
    tags: ["DJ en directo", "Top 10"],
    video: "/app/clip-music.mp4",
    poster: "/app/exp-musica.jpg",
    w: 588, h: 1036,
    alt: "Party Music en la app: «Vota tus canciones favoritas», con el Top 10",
  },
  {
    key: "snap",
    title: "Instantáneas",
    badge: "Solo evento",
    text: "Comparte fotos con la gente del evento.",
    tags: ["Solo evento"],
    video: "/app/clip-snap.mp4",
    poster: "/app/exp-instantanea.jpg",
    w: 588, h: 1070,
    alt: "Instantáneas en la app: pantalla «Nueva instantánea» con la cámara",
  },
  {
    key: "match",
    title: "Match",
    badge: "Conecta esta noche",
    text: "Disponible 12 h antes del evento con entrada comprada.",
    tags: ["Conecta esta noche", "Conexiones en vivo"],
    video: "/app/clip-match.mp4",
    poster: "/app/exp-match.jpg",
    w: 588, h: 1036,
    alt: "Match en la app: perfiles para deslizar con «Me gusta» o «Flechazo»",
  },
];
