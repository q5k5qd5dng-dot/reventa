# Wave · promo 16:9 (15,1 s · 1920×1080 · 30 fps · sin audio)

Referencia de estilo: promo de producto "Spotify – Single Click" (grabación de pantalla del preview en DaVinci).
Mismo ritmo y lenguaje, adaptado a Wave: ticketera + red social de ocio nocturno (Zaragoza).
Fondo azul-noche con un glow turquesa que viaja entre escenas (lo anima `index.html`), UI "glass" semitransparente,
blur de entrada/salida, un destello violeta de glitch y texto cinético con una palabra acentuada.

**Regla de oro: nada inventado de Wave.** Logos y pantallas de la app son los REALES que ha pasado el equipo
(`assets/brand/*`, `assets/app/*`). No dibujes iconos, logos, carteles ni pantallas de la app "a mano"; no inventes
eventos, precios ni textos de producto. El único contenido propio permitido es el de la escena de texto, el fondo/glow y el
mockup genérico del móvil (marco, pantalla de bloqueo, iconos genéricos del sistema).

## Marca / tokens

| token | valor |
| --- | --- |
| turquesa Wave | `#21AEC0` (brillo `#5CE8F6`; el logo real usa degradado cian claro `#D8F8FC` → `#00FFFF`) |
| violeta de la app / glitch | `#8878F5` (botones de la app), `#7C3AED`, magenta `#D946EF`, blanco |
| fondo de la app | `#0A0B10` (casi negro azulado); en el vídeo el fondo es `#060B11` + glow turquesa |
| texto | blanco, secundario `rgba(255,255,255,.62)` |
| glass | fondo `rgba(214,222,228,.20)`, borde `rgba(255,255,255,.14)`, radio 22 px, sombra `0 24px 60px rgba(0,0,0,.35)` |
| tipografía del vídeo | **Inter Tight** (variable 100–900). **Cada escena declara su propio `@font-face`** dentro del `<style>` de su `<template>`: `src: url("assets/fonts/inter-tight-latin.woff2") format("woff2"); font-weight: 100 900;` (la app real usa una geométrica tipo Poppins, pero eso va dentro de las capturas) |

### Assets reales (rutas relativas a la raíz del proyecto)

| archivo | qué es |
| --- | --- |
| `assets/brand/wave-lockup.png` | logo completo REAL (icono + "WAVE" en cursiva degradado cian), PNG con alfa, 1240×321, recortado al borde |
| `assets/brand/wave-icon-lockup.png` | solo el icono, tal cual está en el lockup (322×321) |
| `assets/brand/wave-wordmark.png` | solo "WAVE" (849×249), extraído del mismo lockup (dentro de la caja del lockup 1240×321, `wave-icon-lockup.png` va en (0,0) y `wave-wordmark.png` en left=391, top=32 (verificado: icono+wordmark así colocados reproducen `wave-lockup.png` exactamente)) |
| `assets/brand/wave-icon.png` | icono de app en alta (379×384): squircle cian claro con degradado a `#00FFFF` y glifo de ola azul-violeta oscuro |
| `assets/app/ciudad.jpg` | "Busca tu ciudad" (Wave, Mi plan, Mapa, ¿Quieres crear tu evento?, Zaragoza…) — 1206×2179 |
| `assets/app/disco.jpg` | Zaragoza › Discotecas (Bbsesh 09 OCT, Pulse) — 1206×2176 |
| `assets/app/entradas.jpg` | Ficha de evento: mapa y "Entradas" (tema rojo del organizador) — 1206×2136 |
| `assets/app/feed.jpg` | "Para ti": historias y publicación — 1206×2162 |
| `assets/app/mensajes.jpg` | Mensajes — 1206×2176 |
| `assets/app/actividad.jpg` | Actividad (seguidores, match) — 1206×2130 |
| `assets/app/clip-match.mp4` | grabación real, 588×1036, 3.8 s, sin audio: Match (deslizar: "Me gusta", "No es para mí", "Flechazo") |
| `assets/app/clip-music.mp4` | grabación real, 588×1036, 3.0 s: Experiencias → Party Music "Vota tus canciones favoritas" (Top 10) |
| `assets/app/clip-snap.mp4` | grabación real, 588×1070, 3.0 s: Instantáneas, "Nueva instantánea" (cámara) |

Todas las capturas ya vienen recortadas sin la barra de estado del iPhone ni la barra de Safari. Proporción ≈ 1 : 1.8.
Mantén SIEMPRE la relación de aspecto original (usa `object-fit: cover` con un marco de proporción ≈ 1206×2160 y `object-position` que
muestre lo importante, o encaja sin deformar). No retoques colores ni contenido de las capturas. Úsalas a ≥ resolución nativa cuando se vean
grandes (hay 1206 px de ancho disponibles).

Hay datos de usuarios reales en las capturas (nombres, fotos de perfil). Mantenlos tal cual (son material del equipo); no los edites.

## Línea de tiempo global (s)

| escena | archivo | start | dur | fin | contenido |
| --- | --- | --- | --- | --- | --- |
| 1 | `compositions/scene-logo.html` | 0.0 | 2.2 | 2.2 | logo REAL de Wave aparece desde blur, se mantiene, se encoge/desenfoca al llegar el móvil |
| 2 | `compositions/scene-phone.html` | 1.2 | 3.1 | 4.3 | móvil 3D vuela → bloqueo 9:41 → inicio con icono REAL de Wave → se abre la app (pantalla real) → push-in → glitch violeta |
| 3 | `compositions/scene-app.html` | 4.0 | 5.8 | 9.8 | tablero de pantallas y clips reales de la app: Entradas → Social → Experiencias |
| 4 | `compositions/scene-text.html` | 9.5 | 3.8 | 13.3 | "Descubre dónde salir" / "con un solo toque" (YA HECHA; no tocar) |
| 5 | `compositions/scene-outro.html` | 12.9 | 2.2 | 15.1 | orbe turquesa → logo REAL + `siemprewave.es` |

Las escenas se solapan en las transiciones; cada raíz es **transparente** (el fondo/glow lo pone `index.html`). Cada escena anima solo lo suyo
y debe dejar **todo su contenido invisible al final de su ventana** (sal con blur+fade, nunca un corte seco).
Los tiempos de abajo son **locales** a cada escena (= global − start).

### Fondo (ya hecho en index.html, no tocar)
`#bg-glow` (radial turquesa 2000 px) viaja: centro (0–1 s) → crece y baja (logo→móvil) → abajo-izquierda en la app (4–9.5 s) → centro-izquierda en el texto (9.5–13) → se recoge a un orbe en el centro (12.7–13.6) y respira detrás del logo final. `#bg-glow2` = glow tenue arriba-derecha en 11–12.4 (global).

---

## Escena 1 · logo (0 → 2.2, local)
- `assets/brand/wave-lockup.png` centrado en (960, 540), ancho ≈ 900 px (escala ≈ .73; nítido). Es la `<img>` real, sin redibujar nada.
- 0.25–0.95: aparece desde blur 24 px → 0, opacity 0 → 1, y +30 → 0, scale .92 → 1 (power3.out). El icono puede entrar ≈ 0.1 s antes que la palabra: recorta el lockup en dos capas con `clip-path`/dos `<img>` de `wave-icon-lockup.png` + `wave-wordmark.png` colocadas EXACTAMENTE como en el lockup (verifica con superposición de snapshots que coinciden pixel a pixel con `wave-lockup.png`).
- 1.45–2.1: sale encogiéndose (scale 1 → .55), blur 0 → 18 px, opacity → 0, y −40 (power2.in) mientras el móvil llega (escena 2 empieza en global 1.2).
- Contraste: el wordmark es cian brillante; sobre el glow turquesa pierde contraste. Resuélvelo con un scrim oscuro suave detrás (elipse grande radial `rgba(4,10,16,.4)`) y/o sombra oscura sutil; el logo debe leerse claramente.

## Escena 2 · móvil 3D (1.2 → 4.3, local 0 → 3.1)
Ya existe una primera versión (`compositions/scene-phone.html`, generada con un script; su carpeta de trabajo anterior está en `.../scratchpad/work/phone`). **Mantén**: el vuelo 3D del móvil, el bloqueo 9:41 con fondo de ola turquesa, el swipe a inicio, el push-in, y el destello violeta (todo eso es mockup genérico del sistema). **Cambia**:
- **Icono de Wave en el inicio y en la notificación = `assets/brand/wave-icon.png` real** (no el squircle dibujado).
- **Notificación del bloqueo**: usa un texto REAL de la app: "Wave · Match confirmado. Ya podéis hablar." (aparece en Mensajes), "ahora".
- **Sin widget inventado de evento** (era "Esta noche · Sala Neón"): sustitúyelo por un widget genérico de sistema tipo clima ("Zaragoza · 21° · Despejado · Máx 24° Mín 14°") o por nada. Los iconos genéricos de apps y la etiqueta "Wave" bajo el icono se mantienen.
- **Apertura de la app**: tras el "tap" en el icono, el icono se expande al estilo iOS (zoom del icono a pantalla completa, radio de esquina decreciente) y la pantalla del móvil muestra `assets/app/ciudad.jpg` (Busca tu ciudad). Colócala con el ancho exacto de la pantalla del móvil, alineada arriba con un margen para la isla dinámica, y rellena el resto con `#0A0B10` (la captura ya tiene ese fondo; no la estires ni recortes lados). Superpón tu barra de estado propia (9:41, señal, batería) sobre esa zona. El push-in continúa sobre ese contenido y la pantalla debe verse nítida a su máxima ampliación (hay 1206 px de ancho nativo).
- Orden de eventos (local): 0.00–1.00 vuelo; 1.00–1.45 bloqueo + notificación; 1.40–1.95 swipe a inicio; 1.90–2.15 tap + apertura de la app; 2.05–2.55 push-in sobre la pantalla de la app; 2.3–3.1 glitch violeta que crece y se disuelve (como la versión actual: lleno ≈ 2.5, disuelto a transparente en 2.7–3.1). La escena termina **vacía** (transparente) en local 3.1.

## Escena 3 · app real (4.0 → 9.8, local 0 → 5.8) — NUEVA
Tablero flotante con ligera inclinación 3D (rotateY ≈ −6°, rotateX ≈ 3°, perspectiva ~1800 px) y movimiento de cámara tipo scroll hacia arriba, en el lenguaje de la referencia (psheet_1.png: pills arriba, filas de elementos entrando con blur/3D, scroll a la segunda fila, blur-out). Los elementos son **pantallas reales** de la app dentro de marcos "pantalla de móvil" (radio ≈ 44 px, borde fino 1.5 px `rgba(255,255,255,.18)`, sombra grande, sin biseles de hardware), tamaño ≈ 360×645 px cada una, 3 por fila con 40 px de separación (fila ≈ 1160 px de ancho), centradas sobre x ≈ 960. Altura de fila ≈ 645 px, paso entre filas ≈ 700 px; en cada momento se ve una fila entera y, en los cambios, un asomo de la siguiente.
- **Pills** arriba (alto 52, radio 26, Inter Tight 600 22 px, glass; la seleccionada va rellena turquesa `#21AEC0` con texto casi negro): "Todo", "Entradas", "Social", "Experiencias". La selección se desliza de una a otra (el relleno viaja y las etiquetas cambian de color justo bajo el relleno).
- **Fila A** (selección "Entradas"): `ciudad.jpg`, `disco.jpg`, `entradas.jpg` (buscar ciudad → locales → comprar entrada).
- **Fila B** (selección "Social"): `feed.jpg`, `mensajes.jpg`, `actividad.jpg`.
- **Fila C** (selección "Experiencias"): tres `<video>` reales: `clip-match.mp4`, `clip-music.mp4`, `clip-snap.mp4`, reproduciéndose a velocidad normal dentro de sus marcos (muted, playsinline; usa `data-start`/`data-duration`/`data-media-start` locales a la escena; nunca anides un `<video data-start>` dentro de un elemento con `data-start`). Elige la ventana de cada clip que más lucza (match: ≈ 0.9–2.7 s del clip tiene "Me gusta/No es para mí/Flechazo"; music: la transición de la lista de Experiencias a Party Music "Top 10"; snap: cámara).
- Línea de tiempo local: 0.20–0.70 pills entran (blur+y, stagger .07) · 0.45–1.20 fila A entra (z-profundo/derecha, rotateY −22° → 0, blur 14 → 0, stagger .1) y la selección pasa de "Todo" a "Entradas" en 0.9 · hold hasta 1.9 con micro-deriva · 1.90–2.50 scroll a la fila B (selección → "Social" en 2.0) · hold hasta 3.2 · 3.20–3.80 scroll a la fila C (selección → "Experiencias" en 3.3; los vídeos arrancan antes de entrar en pantalla para que no haya hueco) · hold con los vídeos en marcha hasta 5.1 · 5.10–5.80 salida: todo se desenfoca (blur 0 → 20 px), baja la opacidad y se aleja en z; vacío al final.
- Las capturas deben verse nítidas y legibles (al menos los titulares), sin deformar, con esquinas redondeadas limpias (usa `overflow:hidden` + `border-radius` en el marco, no en la imagen escalada con transform pesado).

## Escena 4 · texto cinético (9.5 → 13.3, local 0 → 3.8) — YA HECHA, NO TOCAR
"Descubre dónde salir" / "con un solo toque" (acento turquesa claro en "salir" y "solo").

## Escena 5 · cierre (12.9 → 15.1, local 0 → 2.2)
- 0.00–0.55: orbe turquesa brillante (círculo 110 px, degradado radial blanco-cian → `#21AEC0`, halo) en (960, 540), que "late" (scale 1 → 1.18 → 1) — recoge el glow del fondo (el fondo se recoge a un orbe entre global 12.7–13.6, así que el orbe debe aparecer exactamente ahí y sentirse el mismo objeto).
- 0.55–1.15: el orbe se transforma en el **icono real** (`wave-icon-lockup.png`/`wave-icon.png`; 110 → 160 px aprox. con back.out suave; crossfade orbe → icono con un destello breve; el glifo de ola oscuro aparece con una revelación de máscara circular o con un barrido; NO redibujes el glifo).
- 1.0–1.55: el lockup se centra: el icono se desplaza a la izquierda y el wordmark real (`wave-wordmark.png`) se revela saliendo desde detrás del icono (clip/mask + x), terminando EXACTAMENTE como el lockup de la escena 1 (misma posición (960,540), mismo tamaño, mismo espaciado).
- 1.45–1.95: debajo, `siemprewave.es` (Inter Tight 500, 34 px, tracking .08em, `rgba(255,255,255,.85)`) aparece con fade + y +14 → 0 y una línea turquesa fina que se expande.
- 1.95–2.2: mantiene (frame final limpio y legible; sin fundido a negro). Scrim oscuro suave tras el lockup para el contraste (como en la escena 1).

---

## Contrato técnico (resumen; todo está en `/hyperframes-core`)
- Cada escena es un archivo con `<template>` que contiene `<style>`, el nodo raíz y `<script>`. Raíz: `<div id="<prefijo>-root" data-composition-id="scene-xxx" data-width="1920" data-height="1080">`, **estilado por `#<prefijo>-root`** (`position:absolute; inset:0; overflow:hidden`, sin fondo). Prefijos de ids: `lg-`, `ph-`, `ap-`, `tx-`, `ou-` (todos los ids únicos en la página ensamblada).
- Exactamente un `gsap.timeline({ paused: true })` registrado como `window.__timelines["scene-xxx"] = tl` (clave = `data-composition-id`), registrado al final y construido de forma síncrona.
- Determinista: nada de `Date.now`, `Math.random`, `performance.now`, timers, `repeat:-1`, ni medir con `getBoundingClientRect` en tiempo de tween (precalcula constantes).
- `fromTo` en vez de `from` para las entradas; no mezcles `transform` CSS inicial con GSAP sobre la misma propiedad; centra con flex/`inset`, no con `translate(-50%,-50%)` sobre algo que GSAP mueve.
- No `<br>`. No `autoAlpha`/`visibility`/`display` sobre `.clip`. Los hijos sí se pueden animar.
- Imágenes/vídeos con rutas relativas a la raíz del proyecto (`assets/app/ciudad.jpg`), no a la carpeta `compositions/`.
- 3D: `perspective` en un padre estable + `transform-style: preserve-3d` + z/rotación. Evita `backdrop-filter`: simula el glass con fondos semitransparentes.
- Blur animado (`filter: blur()`) permitido pero limítalo a pocos elementos grandes por frame (coste de render).
- Cada escena vacía/transparente al terminar su ventana.

## Flujo de trabajo y QA por escena
1. Trabaja en una copia aislada (ver prompt de tu agente), nunca en el directorio del proyecto compartido hasta el final.
2. Bucle: editar → `hf check` (0 errores) → `hf snapshot --at <tiempos globales>` → **mirar los PNG con Read** → corregir.
3. Verifica como mínimo: primer frame de la escena, 3–5 poses intermedias, pico de la animación, frame final, y el solape con la escena vecina.
4. Cuando esté bien, copia SOLO tu archivo `compositions/scene-xxx.html` al proyecto compartido.
