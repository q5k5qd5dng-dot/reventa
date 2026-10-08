# Wave · promo 16:9 (15,9 s · 1920×1080 · 30 fps · con sonido)

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
| 2 | `compositions/scene-phone.html` | 1.2 | 4.0 | 5.2 | móvil 3D vuela → bloqueo 9:41 → inicio con icono REAL de Wave → toque y APERTURA de la app (pantalla real, bien visible) → push-in → transición violeta de entrada a la app |
| 3 | `compositions/scene-app.html` | 4.8 | 5.8 | 10.6 | tablero de pantallas y clips reales de la app: Entradas → Social → Experiencias |
| 4 | `compositions/scene-text.html` | 10.3 | 3.8 | 14.1 | texto cinético (copia nueva, ver escena 4) |
| 5 | `compositions/scene-outro.html` | 13.7 | 2.2 | 15.9 | orbe turquesa → logo REAL + `siemprewave.es` |

Las escenas se solapan en las transiciones; cada raíz es **transparente** (el fondo/glow lo pone `index.html`). Cada escena anima solo lo suyo
y debe dejar **todo su contenido invisible al final de su ventana** (sal con blur+fade, nunca un corte seco).
Los tiempos de abajo son **locales** a cada escena (= global − start).

### Fondo (en `index.html`; v2 = más natural)
`#bg-glow` / `#bg-glow2` viajan con el timeline raíz: centro (0–1 s) → crece y baja (logo→móvil) → abajo-izquierda durante la app (4.8–10.6) → centro-izquierda en el texto (10.3–14) → se recoge a un orbe en el centro (13.5–14.4) y respira detrás del logo final.
**Petición del equipo: el degradado/fondo tiene que quedar más natural** (ahora se lee como un disco radial perfecto con borde duro y "platos" oscuros detrás de los logos). Ver sección "Fondo natural" más abajo.

---

## Escena 1 · logo (0 → 2.2, local)
- `assets/brand/wave-lockup.png` centrado en (960, 540), ancho ≈ 900 px (escala ≈ .73; nítido). Es la `<img>` real, sin redibujar nada.
- 0.25–0.95: aparece desde blur 24 px → 0, opacity 0 → 1, y +30 → 0, scale .92 → 1 (power3.out). El icono puede entrar ≈ 0.1 s antes que la palabra: recorta el lockup en dos capas con `clip-path`/dos `<img>` de `wave-icon-lockup.png` + `wave-wordmark.png` colocadas EXACTAMENTE como en el lockup (verifica con superposición de snapshots que coinciden pixel a pixel con `wave-lockup.png`).
- 1.45–2.1: sale encogiéndose (scale 1 → .55), blur 0 → 18 px, opacity → 0, y −40 (power2.in) mientras el móvil llega (escena 2 empieza en global 1.2).
- Contraste: el wordmark es cian brillante; sobre el glow turquesa pierde contraste. Resuélvelo con un scrim oscuro suave detrás (elipse grande radial `rgba(4,10,16,.4)`) y/o sombra oscura sutil; el logo debe leerse claramente.

## Escena 2 · móvil 3D + entrada a la app (1.2 → 5.2, local 0 → 4.0)
Existe una versión (`compositions/scene-phone.html`). **Mantén** el vuelo 3D del móvil, el bloqueo 9:41 con fondo de ola turquesa, la notificación REAL ("Wave · Match confirmado. Ya podéis hablar."), el swipe a inicio, el icono REAL de Wave (`assets/brand/wave-icon.png`), el widget del tiempo y los iconos genéricos. **Petición del equipo: "la zona en la que entras a la app no me termina, mejóralo".** La entrada a la app (toque → apertura → pantalla de la app → transición a la escena 3) debe sentirse natural, clara y satisfactoria; hoy la pantalla real solo se ve ~0.3 s antes de que un destello violeta la tape, el zoom del icono a pantalla se ve forzado y el push-in recorta mal el móvil. Rediseña esa parte:
- 0.00–1.00 vuelo · 1.00–1.45 bloqueo + notificación · 1.40–1.95 swipe a inicio (sin cambios de fondo).
- 1.95–2.35 **inicio en reposo y bien encuadrado** (móvil completo, centrado, sin recortes): los iconos ya están en su sitio; aparece un indicador de toque sutil (círculo translúcido tipo iOS) sobre el icono de Wave y el icono hace el "press" (scale .92 + brillo suave).
- 2.30–2.95 **apertura de la app estilo iOS, creíble**: el icono crece con un muelle (spring/back) hasta ocupar la pantalla, el radio de esquina pasa de icono a radio de pantalla, el resto de la pantalla de inicio se aleja/desenfoca ligeramente, y el contenido de la app (`assets/app/ciudad.jpg`: ancho exacto de la pantalla del móvil, arriba con margen para la isla, relleno `#0A0B10`, barra de estado propia 9:41) aparece de forma limpia (sin "fantasma" del icono grande). Sin saltos ni huecos.
- 2.95–3.60 **la app a la vista (mínimo 0.6 s nítido y sin tapar)**: pantalla "Busca tu ciudad" legible, ligera cámara hacia dentro (escala del conjunto ≈ 1.0 → 1.3, nunca recortando la isla/estado de forma fea) y un pequeño scroll vivo del contenido (≈ 120 px hacia arriba) para que no quede muerta.
- 3.45–4.00 **transición de entrada a la escena 3**: más cuidada y menos "caótica" que la actual; luz/energía en violeta de la app (`#8878F5`) y blanco que nace de la pantalla, 2–3 barras de glitch cortas y un breve RGB-split, la cámara atraviesa la pantalla y todo se disuelve a transparente en local 4.0 (global 5.2); la escena 3 empieza en global 4.8, así que sus pills/paneles entran mientras la luz se desvanece. Que la primera pantalla de la escena 3 (ciudad.jpg) se sienta continuación de esta pantalla.
- La escena termina **vacía** (transparente) en local 4.0. Mantén el coste de render razonable (nada de feTurbulence a pantalla completa durante mucho tiempo).

## Escena 3 · app real (4.8 → 10.6, local 0 → 5.8)
Tablero flotante con ligera inclinación 3D (rotateY ≈ −6°, rotateX ≈ 3°, perspectiva ~1800 px) y movimiento de cámara tipo scroll hacia arriba, en el lenguaje de la referencia (psheet_1.png: pills arriba, filas de elementos entrando con blur/3D, scroll a la segunda fila, blur-out). Los elementos son **pantallas reales** de la app dentro de marcos "pantalla de móvil" (radio ≈ 44 px, borde fino 1.5 px `rgba(255,255,255,.18)`, sombra grande, sin biseles de hardware), tamaño ≈ 360×645 px cada una, 3 por fila con 40 px de separación (fila ≈ 1160 px de ancho), centradas sobre x ≈ 960. Altura de fila ≈ 645 px, paso entre filas ≈ 700 px; en cada momento se ve una fila entera y, en los cambios, un asomo de la siguiente.
- **Pills** arriba (alto 52, radio 26, Inter Tight 600 22 px, glass; la seleccionada va rellena turquesa `#21AEC0` con texto casi negro): "Todo", "Entradas", "Social", "Experiencias". La selección se desliza de una a otra (el relleno viaja y las etiquetas cambian de color justo bajo el relleno).
- **Fila A** (selección "Entradas"): `ciudad.jpg`, `disco.jpg`, `entradas.jpg` (buscar ciudad → locales → comprar entrada).
- **Fila B** (selección "Social"): `feed.jpg`, `mensajes.jpg`, `actividad.jpg`.
- **Fila C** (selección "Experiencias"): tres `<video>` reales: `clip-match.mp4`, `clip-music.mp4`, `clip-snap.mp4`, reproduciéndose a velocidad normal dentro de sus marcos (muted, playsinline; usa `data-start`/`data-duration`/`data-media-start` locales a la escena; nunca anides un `<video data-start>` dentro de un elemento con `data-start`). Elige la ventana de cada clip que más lucza (match: ≈ 0.9–2.7 s del clip tiene "Me gusta/No es para mí/Flechazo"; music: la transición de la lista de Experiencias a Party Music "Top 10"; snap: cámara).
- Línea de tiempo local: 0.20–0.70 pills entran (blur+y, stagger .07) · 0.45–1.20 fila A entra (z-profundo/derecha, rotateY −22° → 0, blur 14 → 0, stagger .1) y la selección pasa de "Todo" a "Entradas" en 0.9 · hold hasta 1.9 con micro-deriva · 1.90–2.50 scroll a la fila B (selección → "Social" en 2.0) · hold hasta 3.2 · 3.20–3.80 scroll a la fila C (selección → "Experiencias" en 3.3; los vídeos arrancan antes de entrar en pantalla para que no haya hueco) · hold con los vídeos en marcha hasta 5.1 · 5.10–5.80 salida: todo se desenfoca (blur 0 → 20 px), baja la opacidad y se aleja en z; vacío al final.
- Las capturas deben verse nítidas y legibles (al menos los titulares), sin deformar, con esquinas redondeadas limpias (usa `overflow:hidden` + `border-radius` en el marco, no en la imagen escalada con transform pesado).

## Escena 4 · texto cinético (10.3 → 14.1, local 0 → 3.8)
Misma coreografía que la versión anterior (ver `compositions/scene-text.html`), pero con **copia nueva**: al equipo no le convencía "con un solo toque" (frase calcada del original de Spotify, suena publicitaria).
- Línea 1 (sin cambios): **"Descubre dónde salir"** — acento turquesa claro en "salir".
- Línea 2 (NUEVA): **"y compra tu entrada"** — acento turquesa claro en "entrada". Sencilla, concreta y entendible; sin tono de anuncio.
- Hay que **re-medir** las cajas de las palabras (están medidas/hardcodeadas offline; no mides en tiempo de tween) y recolocar con los mismos tiempos, estilos, blur y tracking de antes. Todo centrado, legible, contraste OK.

## Escena 5 · cierre (13.7 → 15.9, local 0 → 2.2)
- 0.00–0.55: orbe turquesa brillante (círculo 110 px, degradado radial blanco-cian → `#21AEC0`, halo) en (960, 540), que "late" (scale 1 → 1.18 → 1) — recoge el glow del fondo (el fondo se recoge a un orbe entre global 13.5–14.4, así que el orbe debe aparecer exactamente ahí y sentirse el mismo objeto).
- 0.55–1.15: el orbe se transforma en el **icono real** (`wave-icon-lockup.png`/`wave-icon.png`; 110 → 160 px aprox. con back.out suave; crossfade orbe → icono con un destello breve; el glifo de ola oscuro aparece con una revelación de máscara circular o con un barrido; NO redibujes el glifo).
- 1.0–1.55: el lockup se centra: el icono se desplaza a la izquierda y el wordmark real (`wave-wordmark.png`) se revela saliendo desde detrás del icono (clip/mask + x), terminando EXACTAMENTE como el lockup de la escena 1 (misma posición (960,540), mismo tamaño, mismo espaciado).
- 1.45–1.95: debajo, `siemprewave.es` (Inter Tight 500, 34 px, tracking .08em, `rgba(255,255,255,.85)`) aparece con fade + y +14 → 0 y una línea turquesa fina que se expande.
- 1.95–2.2: mantiene (frame final limpio y legible; sin fundido a negro). Scrim oscuro suave tras el lockup para el contraste (como en la escena 1).

---

## Fondo natural (petición del equipo)
Objetivo: que el fondo parezca luz real y no un disco con borde. Trabajo en `index.html` (`#bg-glow`, `#bg-glow2`, `#bg-vig`, `#fx-grain`, tweens del timeline raíz) y, si hace falta, quitar los "platos" oscuros (`#lg-scrim`, `#ou-scrim`, etc.) de `scene-logo.html`/`scene-outro.html` sustituyéndolos por un oscurecimiento integrado en el propio fondo.
- Caída de luz **gaussiana/suave**: usa muchos stops que sigan una curva suave (no 3–4 stops lineales) para evitar el borde y el banding; sin plateau plano.
- Dos o tres fuentes de luz de tamaños distintos con tonos ligeramente distintos (núcleo turquesa `#21AEC0`/brillo `#5CE8F6`, halo más profundo azul-verdoso `#0B4F63`, y un toque muy sutil de violeta de la app `#8878F5` en los bordes/lejos del núcleo) con movimiento orgánico muy lento (deriva/respiración) además de los traslados entre escenas.
- Viñeta asimétrica y muy suave; nada de elipse perfectamente centrada con borde marcado.
- Grano/dither más fino y algo más fuerte para eliminar el banding tras la compresión H.264 (verifica en el MP4 renderizado, no solo en snapshots).
- Los logos (cian brillante) deben seguir leyéndose con claridad sobre el fondo en las escenas 1 y 5 SIN platos visibles: atenúa la luz justo detrás del lockup dentro del propio degradado (p. ej. núcleo desplazado/reducido en esos momentos).
- No cambies los tiempos de las escenas (los fija este guion), solo la apariencia y las curvas del fondo; mantén que el glow se recoja a un orbe en el centro entre global 13.5–14.4 (el orbe de la escena 5 depende de eso).

## Sonido (petición del equipo: "falta sonido para las animaciones")
El vídeo ahora lleva audio: SFX sincronizados con cada animación + una cama musical suave. Siguiendo el original (su proyecto tenía pistas de música y de SFX: Whooshes, UI & Foley, Hits & Impacts, Glitch & Light).
- **Todo sintetizado de forma determinista** (Python + numpy, semilla fija) con un script versionado `scripts/make-audio.py` que genera `assets/audio/sfx.wav` y `assets/audio/music.wav` (stereo, 48 kHz, 16-bit, longitud 15.9 s exactos). Sin samples externos ni licencias. Se cargan en `index.html` con `<audio id=… src=… data-start="0" data-duration="15.9" data-track-index=…>` (las `<audio>` necesitan `id`; `muted` NO).
- **Cada SFX cae sobre su evento visual** (extrae los tiempos exactos de los timelines de cada escena y del `index.html`; el tiempo global = start de la escena + tiempo local). Categorías y eventos mínimos:
  - *Whooshes*: vuelo del móvil (barrido filtrado con paneo/Doppler), swipe a inicio, entrada y salida de cada fila de la escena 3 y cada scroll, llegada de la estela de texto, salida de cada línea, transición glitch.
  - *UI & Foley*: aparece la notificación (ding cristalino suave), toque en el icono (tap seco), "pop" de la apertura de la app, ticks de cada pill que cambia de selección, microclicks al entrar cada panel.
  - *Hits & Impacts*: golpe suave cuando el logo se asienta (escena 1), impacto sub-grave en la transición de entrada a la app, golpe de logo en el cierre.
  - *Glitch & Light*: ráfaga digital (ruido con bitcrush/stutter) de la transición violeta, "destello de luz" (shimmer ascendente) al nacer el orbe y al formarse el icono del cierre.
  - Música: cama ambiente cálida (pad de síntesis + sub suave + pulso muy discreto) en una tonalidad coherente, que arranca baja con el logo, crece con el móvil/la app, se aligera durante el texto y resuelve en un acorde limpio con cola en el logo final (termina en silencio antes de 15.9 s, sin corte seco).
- **Mezcla**: SFX picos ≈ −6 dBFS, música ≈ 10–14 dB por debajo de los SFX, sidechain/ducking suave de la música bajo los impactos grandes; master ≈ −16 LUFS integrado (±1.5) con true-peak ≤ −1 dBTP; sin clipping; fade-in 0.15 s y fade-out final 0.8 s. Verifica con `ffmpeg -af ebur128`/`astats` y con un espectrograma (`showspectrumpic`) que cada evento está en su sitio.

## Locución (voz de chica en la escena 4)
La escena del texto lleva una voz femenina en español que lee lo que sale escrito: "Descubre dónde salir," (entra a 10.40 s, `vo-1`) y "y compra tu entrada" (entra a 12.33 s, `vo-2`).
- Voz generada en local con el TTS de HyperFrames (Kokoro-82M, voz `ef_dora`), tomas crudas en `assets/audio/raw/`, tratadas de forma determinista con `scripts/make-voice.py` (EQ, compresión suave, reverb de placa corta, estéreo, pico −3 dBFS) → `assets/audio/vo-1.wav`, `vo-2.wav`.
- `index.html`: `<audio id="vo-1">` y `<audio id="vo-2">` en las pistas 12 y 13; la música baja ≈ −3 dB y los SFX ≈ −6 dB durante la locución (carriles `data-automation` de volumen en `#music` y `#sfx`, 10.1–14.2 s).

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
