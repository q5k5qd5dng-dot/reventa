# Herramientas de imágenes (no forman parte del build)

Las imágenes de la web no son fotos: se generan con código y se guardan en `src/assets/art/*.webp`.

- `seats.html` + `render.cjs`: renderiza en **three.js** (luces, sombras y reflejos) las butacas del hero con una butaca naranja y recupera el canal alfa renderizando sobre negro y sobre blanco.
- `art.html` + `gen-art.cjs`: pinta en canvas los carteles de cada evento, los exporta a WebP y calcula el **color dominante** de cada uno (`src/data/art.json`), que tiñe la cabecera de la página del evento.

Uso (servidor estático en la raíz del repo y Playwright instalado):

```bash
python3 -m http.server 8765 &
node tools/render.cjs "?w=2800&h=400&fov=17&cy=1.45&cz=3.0&ly=1.4&rows=4&cols=31&ar=2&ac=17" seats-wide.png
node tools/gen-art.cjs            # todos los carteles
node tools/gen-art.cjs duro-festival   # solo uno
```
