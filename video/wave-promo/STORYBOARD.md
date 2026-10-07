# Wave · promo 16:9 (14,5 s · 1920×1080 · 30 fps · sin audio)

Referencia de estilo: promo de producto "Spotify – Single Click" (grabación de pantalla del preview en DaVinci).
Mismo ritmo y lenguaje, adaptado a Wave: ticketera + red social de ocio nocturno (Zaragoza).
Fondo azul-noche con un glow turquesa que viaja entre escenas (lo anima `index.html`), UI "glass" semitransparente,
blur de entrada/salida, un destello violeta de glitch y texto cinético con una palabra acentuada.

## Marca / tokens

| token | valor |
| --- | --- |
| turquesa Wave | `#21AEC0` (brillo `#5CE8F6`, acento de texto sobre glow `#7FF3FF` o similar: validar contraste) |
| violeta glitch | `#7C3AED`, magenta `#D946EF`, blanco `#FFFFFF` |
| base | `#060B11` (azul-noche casi negro), texto `#FFFFFF`, secundario `rgba(255,255,255,.62)` |
| glass | fondo `rgba(214,222,228,.20)`, borde `rgba(255,255,255,.14)`, radio 22 px, sombra `0 24px 60px rgba(0,0,0,.35)` |
| tipografía | **Inter Tight** (variable 100–900) — ya cargada en `index.html`, pero **cada escena debe declarar su propio `@font-face`** dentro del `<style>` de su `<template>`: `src: url("assets/fonts/inter-tight-latin.woff2") format("woff2"); font-weight: 100 900;` |
| logo | `assets/brand/wave-logo.svg` (squircle turquesa + 2 ondas blancas, viewBox 32). Wordmark: "Wave", Inter Tight 700, tracking −0.04em, blanco |
| carteles | `assets/posters/{neon,aurora,noir,sol,afterglow,onda}.jpg` (3:4, 1080×1440): SALA NEÓN, AURORA, NOIR, TERRAZA SOL, AFTERGLOW, ONDA |

Copy en español, corto, sin tono publicitario. Nada de marcas reales (ni Spotify ni iOS ni Instagram): la UI es genérica/propia.

## Línea de tiempo global (s)

| escena | archivo | start | dur | fin | contenido |
| --- | --- | --- | --- | --- | --- |
| 1 | `compositions/scene-logo.html` | 0.0 | 2.2 | 2.2 | logo Wave aparece desde blur, se mantiene, se encoge/desenfoca al llegar el móvil |
| 2 | `compositions/scene-phone.html` | 1.2 | 3.1 | 4.3 | móvil 3D vuela → pantalla bloqueo 9:41 → inicio con apps → push-in al icono Wave → glitch violeta |
| 3 | `compositions/scene-feed.html` | 4.0 | 5.2 | 9.2 | pills + accesos rápidos + "Nuevas fiestas para ti" con carteles |
| 4 | `compositions/scene-text.html` | 8.9 | 3.8 | 12.7 | "Descubre dónde salir" / "con un solo toque" |
| 5 | `compositions/scene-outro.html` | 12.3 | 2.2 | 14.5 | orbe turquesa → logo Wave + `siemprewave.es` |

Las escenas se solapan en las transiciones; cada raíz es **transparente** (el fondo/glow lo pone `index.html`). Cada escena anima solo lo suyo
y debe dejar **todo su contenido en opacity 0 / fuera de plano al final de su ventana** (la ventana host acaba y desaparece sola, pero evita un corte seco: sal con blur+fade).
Los tiempos de abajo son **locales** a cada escena (= global − start).

### Fondo (ya hecho en index.html, no tocar)
`#bg-glow` (radial turquesa 2000 px) viaja: centro (0–1 s) → crece y baja (logo→móvil) → abajo-izquierda en el feed (4–9 s) → centro-izquierda en el texto (8.9–12.3) → se recoge a un orbe en el centro (12.1–13) y respira detrás del logo final. `#bg-glow2` = glow tenue arriba-derecha en 10.4–12.3.

---

## Escena 1 · logo (0 → 2.2, local)
- Lockup centrado en (960, 540): squircle 150 px + "Wave" 128 px (Inter Tight 700), separación ~28 px. Mismo lockup y posición que en la escena 5 (cierre simétrico).
- 0.25–0.95: aparece desde blur 24 px → 0, opacity 0 → 1, y +30 → 0, scale .92 → 1 (power3.out). El squircle entra primero (≈0.1 s antes) y el texto después con un stagger de letras sutil (tracking ancho → normal).
- 1.45–2.1: sale encogiéndose (scale 1 → .55), blur 0 → 18 px, opacity → 0, y −40 (power2.in) mientras el móvil llega por detrás/encima (escena 2 empieza en global 1.2).

## Escena 2 · móvil 3D (1.2 → 4.3, local 0 → 3.1)
Cámara con `perspective` (≈1800–2400 px) sobre un contenedor `transform-style: preserve-3d`; el móvil es un único objeto con caras de pantalla (bloqueo + inicio) para mantener identidad. NO uses escala sola como falsa profundidad: usa z, rotateX/Y/Z.
- Móvil: cuerpo 430×880 (radio 64, bisel 12 px `#0b0f14`, canto metálico degradado, isla dinámica 120×34, botones laterales), pantalla radio 52.
- Fondo de pantalla: azul-noche con una gran onda turquesa luminosa (SVG con degradados; recuerda a las ondas del logo).
- **Bloqueo**: hora "9:41" (Inter Tight 300–400, ~110 px) + fecha "Sábado, 11 de octubre" arriba; abajo una notificación glass: icono Wave + "Wave · Tu entrada para Sala Neón está lista" + "ahora". Linterna/cámara en las esquinas inferiores.
- **Inicio**: widget glass "Esta noche · Sala Neón · 23:30 · 128 van" (mini cartel neon.jpg), cuadrícula 4 columnas de iconos genéricos (colores propios + glifos SVG simples; etiquetas: Cámara, Fotos, Mapas, Reloj, Notas, Música, Mensajes, Ajustes…) y el **icono Wave** (squircle turquesa + ondas) bien visible, más dock de 4 iconos.
- 0.00–1.00: el móvil entra desde lejos: pequeño (≈ escala .16), muy inclinado (rotateX ≈ 62°, rotateY ≈ −34°, rotateZ ≈ 26°), difuminado (blur 8 → 0), cruzando de arriba-derecha a centro; llega con rotateX ≈ 16°, rotateY ≈ 0, escala ≈ .95 mostrando el **bloqueo** (como "9:41" visto desde abajo). Ease power3.out con ligero overshoot en el rotateX.
- 1.00–1.45: respira en el bloqueo (la notificación glass cae desde arriba con un rebote suave).
- 1.40–1.95: swipe-up: el bloqueo sube y se desvanece; el móvil se endereza (rotateX → 6°) y se acerca (escala → 1.12) revelando el **inicio**; los iconos entran con stagger 0.02 s (scale .8 → 1, opacity).
- 1.90–2.35: push-in lento sobre el icono Wave (transform-origin calculado a mano hacia el icono; escala → ~2.4 con power2.inOut), el icono hace "tap" (scale .92 → 1.05 + anillo turquesa que se expande).
- 2.10–3.10: **glitch violeta**: capa a pantalla completa con manchas/gradientes violeta (#7C3AED), magenta (#D946EF) y blanco (mix-blend-mode screen) que crecen desde el icono hasta cubrir todo el plano (lleno en local ≈ 2.5), con 3–5 barras horizontales de glitch (translateX escalonado, skew), separación cromática (RGB split) y 2 parpadeos stepped; desde 2.7 todo se disuelve a transparente (opacity 1 → 0 en ≈0.4 s) para dejar ver el glow limpio y la escena 3 (global 4.0).
- La escena termina **vacía** (transparente) en local 3.1.

## Escena 3 · app / feed (4.0 → 9.2, local 0 → 5.2)
Tablero UI flotante a la izquierda-centro (x ≈ 520–1500 px) con ligera inclinación 3D (rotateY ≈ −7°, rotateX ≈ 4°), perspectiva ~1600 px. Todo en glass (tokens). Texto en Inter Tight.
- 0.25–0.9: **pills** (alto 52, radio 26): "Todo" (seleccionada, fondo turquesa `#21AEC0`, texto negro), "Fiestas", "Entradas". Entran con blur+y (stagger .07).
- 0.5–1.3: **accesos rápidos** 2 filas × 2 columnas visibles + 2 columnas más cortadas por el borde derecho (como en la referencia): cada tile = miniatura cuadrada del cartel (60×60 → 96×96) + título ("Sala Neón", "Terraza Sol", "Aurora", "Noir", "Afterglow", "Onda"). Entran deslizando desde la derecha con blur (stagger .08).
- 1.35–1.8: la pill "Fiestas" se selecciona (el relleno turquesa se desliza de "Todo" a "Fiestas"); aparece una 4.ª pill "Siguiendo" entre medias (las demás se desplazan).
- 1.9–2.4: los tiles salen a la izquierda con blur 14 px + fade y rotateY.
- 2.3–3.0: título "Nuevas fiestas para ti" (Inter Tight 700, 40 px) + **3 tarjetas** verticales (≈ 300×420 px de cartel + cabecera glass de 56 px con avatar circular (inicial/avatar generado), título del evento y subtítulo "Zaragoza · 142 van"): SALA NEÓN (neon.jpg), AURORA (aurora.jpg), NOIR (noir.jpg). Entran desde z-profundo/derecha con rotateY de −25° → 0 y stagger .12.
- 3.0–3.6: mantiene (micro-deriva lenta del tablero para que no quede estático).
- 3.6–4.4: **scroll**: el tablero sube ≈ 470 px revelando la 2.ª fila: AFTERGLOW (afterglow.jpg), TERRAZA SOL (sol.jpg), ONDA (onda.jpg) con sus cabeceras.
- 4.6–5.2: salida: todo se desenfoca (blur 0 → 20), baja de opacidad y se desplaza ligeramente hacia atrás en z; vacío al final.
- Datos de cabecera (invéntalos coherentes): Sala Neón · "Sáb · 23:30"; Aurora · "Club · 00:00"; Noir · "Lun–Dom"; Afterglow · "Dom · 19:00"; Terraza Sol · "Vie · 22:00"; Onda · "Sáb · 01:00".

## Escena 4 · texto cinético (8.9 → 12.7, local 0 → 3.8)
- Línea 1 centrada en (960, 520): **"Descubre dónde salir"** (Inter Tight 600, 96 px, blanco, "salir" en acento turquesa claro).
  - 0.10–0.75: solo "Descubre" aparece con tracking muy abierto (0.45em → −0.01em), blur 18 → 0, opacity 0 → 1 (como el "L i s t e n" de la referencia).
  - 0.45–1.1: "dónde salir" llega desde la derecha como una estela horizontal difuminada (x +220 → 0, blur horizontal 24 → 0) hasta asentarse; "salir" es la última en enfocarse.
  - 1.1–1.7: mantiene.
  - 1.7–2.0: sale: tracking → cerrado (−0.06em), blur 0 → 22 px, opacity → 0, scaleX .96.
- Línea 2 centrada en (960, 540): **"con un solo toque"** (mismo estilo; "solo" en acento).
  - 2.05–2.55: entra desde el centro con las palabras separadas que se juntan (word gap 80 px → normal) + blur 20 → 0; "solo" se ilumina al final.
  - 2.55–3.45: mantiene; 3.45–3.8: sale con blur y tracking cerrado (como la referencia, que colapsa "witha single click" antes de la última escena).
- Sin elementos decorativos extra: es tipografía sobre el glow. Texto siempre legible sobre el glow (comprobar contraste en snapshot a 1.3 s y 3.0 s locales).

## Escena 5 · cierre (12.3 → 14.5, local 0 → 2.2)
- 0.00–0.55: orbe turquesa brillante (círculo 110 px, degradado radial blanco-cian → #21AEC0, halo) en (960, 540), que "late" (scale 1 → 1.18 → 1) — recoge el glow del fondo (el fondo se recoge a un orbe entre global 12.1–13.0).
- 0.55–1.15: el orbe se transforma en el squircle del logo (radio 55 → 24 % del lado, 110 → 150 px) y las dos ondas blancas se dibujan (stroke-dashoffset) dentro.
- 1.0–1.55: el lockup se centra: el squircle se desplaza a la izquierda y el wordmark "Wave" (Inter Tight 700, 128 px) se revela saliendo desde detrás del squircle (clip/mask + x), mismo lockup que en la escena 1.
- 1.45–1.95: debajo, `siemprewave.es` (Inter Tight 500, 34 px, tracking .08em, `rgba(255,255,255,.72)`) aparece con fade + y +14 → 0 y una línea turquesa fina que se expande.
- 1.95–2.2: mantiene (frame final limpio y legible; sin fundido a negro).

---

## Contrato técnico (resumen; todo está en `/hyperframes-core`)
- Cada escena es un archivo con `<template>` que contiene `<style>`, el nodo raíz y `<script>`. Raíz: `<div id="<prefijo>-root" data-composition-id="scene-xxx" data-width="1920" data-height="1080">`, **estilado por `#<prefijo>-root`** (`position:absolute; inset:0; overflow:hidden`, sin fondo). Prefijos de ids: `lg-`, `ph-`, `fd-`, `tx-`, `ou-` (todos los ids únicos en la página ensamblada).
- Exactamente un `gsap.timeline({ paused: true })` registrado como `window.__timelines["scene-xxx"] = tl` (clave = `data-composition-id`), registrado al final y construido de forma síncrona.
- Determinista: nada de `Date.now`, `Math.random`, `performance.now`, timers, `repeat:-1`, ni medir con `getBoundingClientRect` en tiempo de tween (precalcula constantes). Si necesitas aleatoriedad, PRNG con semilla.
- `fromTo` en vez de `from` para las entradas; no mezcles `transform` CSS inicial con GSAP sobre la misma propiedad (usa `fromTo`/`xPercent`); centra con flex/`inset`, no con `translate(-50%,-50%)` sobre algo que GSAP mueve.
- No `<br>`. No `autoAlpha`/`visibility`/`display` sobre `.clip`. Los hijos sí se pueden animar.
- Imágenes con rutas relativas a la raíz del proyecto (`assets/posters/neon.jpg`), no a la carpeta `compositions/`.
- 3D: `perspective` en un padre estable + `transform-style: preserve-3d` + z/rotación. Evita `backdrop-filter` (caro e inestable en captura): simula el glass con fondos semitransparentes y degradados.
- Blur animado (`filter: blur()`) está permitido pero limítalo a pocos elementos grandes por frame (coste de render).
- Cada escena vacía/transparente al terminar su ventana.

## Flujo de trabajo y QA por escena
1. Trabaja en una copia aislada (ver prompt de tu agente), nunca en el directorio del proyecto compartido hasta el final.
2. Bucle: editar → `hf check` (0 errores; avisos de solape de texto contra los placeholders de OTRAS escenas son ruido: ignóralos) → `hf snapshot --at <tiempos globales>` → **mirar los PNG con Read** → corregir.
3. Verifica como mínimo: primer frame de la escena, 3–5 poses intermedias, pico de la animación, frame final, y el solape con la escena vecina.
4. Cuando esté bien, copia SOLO tu archivo `compositions/scene-xxx.html` al proyecto compartido.
