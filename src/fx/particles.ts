// El logotipo REAL de Wave hecho de partículas. Se dibuja el PNG real en un canvas fuera de pantalla y se
// toman muestras de sus píxeles (posición y color). El muestreo es determinista (rejilla + semilla fija),
// el número de partículas se ajusta al tamaño de pantalla y, con "reducir movimiento" o sin WebGL,
// se queda la imagen real estática (la pone el CSS con .is-static).
import { reduceMotion } from "./core";

const LOCKUP = "/brand/wave-lockup.png"; // icono + palabra, 1240x321
const ICON = "/brand/wave-icon-lockup.png"; // icono tal cual aparece en el lockup, 322x321
const WORD = "/brand/wave-wordmark.png"; // palabra, 849x249

type Mode = "wide" | "stack";
type Sample = { pts: Float32Array; rgb: Float32Array; w: number; h: number; n: number; step: number };

const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = rej;
  i.src = src;
});

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dibuja los PNG reales sin tocarlos y devuelve un punto por celda de la rejilla.
async function sample(mode: Mode, target: number): Promise<Sample> {
  const c = document.createElement("canvas");
  const g = c.getContext("2d", { willReadFrequently: true })!;
  let W: number, H: number;
  if (mode === "wide") {
    const img = await load(LOCKUP);
    W = img.naturalWidth; H = img.naturalHeight;
    c.width = W; c.height = H;
    g.drawImage(img, 0, 0);
  } else {
    const [ic, wd] = await Promise.all([load(ICON), load(WORD)]);
    const gap = 70;
    W = wd.naturalWidth; H = ic.naturalHeight + gap + wd.naturalHeight;
    c.width = W; c.height = H;
    g.drawImage(ic, (W - ic.naturalWidth) / 2, 0);
    g.drawImage(wd, 0, ic.naturalHeight + gap);
  }
  const data = g.getImageData(0, 0, W, H).data;
  // Los píxeles muy oscuros son el símbolo del icono (hueco): se dejan vacíos para que se lea igual que el original.
  const solid = (i: number) => data[i + 3] > 140 && data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11 > 70;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) if (solid(i)) count++;
  const step = Math.max(2, Math.sqrt(count / target));
  const pts: number[] = [];
  const rgb: number[] = [];
  let row = 0;
  for (let y = step / 2; y < H; y += step, row++) {
    const off = row % 2 ? step / 2 : 0; // filas desplazadas: aspecto más orgánico que una rejilla
    for (let x = step / 2 + off; x < W; x += step) {
      const i = (Math.floor(y) * W + Math.floor(x)) * 4;
      if (!solid(i)) continue;
      pts.push(x, y);
      rgb.push(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    }
  }
  return { pts: new Float32Array(pts), rgb: new Float32Array(rgb), w: W, h: H, n: pts.length / 2, step };
}

export async function initParticleLogo(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const section = canvas.closest<HTMLElement>(".fx-particles");
  const fallback = () => section?.classList.add("is-static");
  if (reduceMotion) return fallback();
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return fallback();

  const vs = `attribute vec2 p; attribute vec3 c; uniform vec2 r; uniform float s; varying vec3 vc;
    void main(){ vec2 clip=(p/r*2.0-1.0)*vec2(1.0,-1.0); vc=c; gl_Position=vec4(clip,0.0,1.0); gl_PointSize=s; }`;
  const fs = `precision mediump float; varying vec3 vc;
    void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.34,0.5,d); gl_FragColor=vec4(vc*a,a); }`;
  const sh = (t: number, src: string) => { const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(prog, 0, "p");
  gl.bindAttribLocation(prog, 1, "c");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fallback();
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // color premultiplicado
  const uR = gl.getUniformLocation(prog, "r");
  const uS = gl.getUniformLocation(prog, "s");
  const pb = gl.createBuffer()!, cb = gl.createBuffer()!;

  let S: Sample | null = null;
  let mode: Mode = "wide";
  let n = 0;
  let pos = new Float32Array(0), origin = new Float32Array(0), vel = new Float32Array(0), stiff = new Float32Array(0);
  let cw = 1, ch = 1, dpr = 1, visible = false, settled = false, raf = 0, building = false;
  const mouse = { x: -9999, y: -9999, active: 0 };

  const pick = (): Mode => (canvas.clientWidth / Math.max(1, canvas.clientHeight) < 1.1 ? "stack" : "wide");
  const fit = (m: Mode) => (m === "wide" ? { fw: 0.78, fh: 0.46, W: 1240, H: 321 } : { fw: 0.84, fh: 0.5, W: 849, H: 703 });
  // Número de partículas según el tamaño real del logotipo en pantalla: separación de ~3,6 px, así se lee igual en móvil y en escritorio.
  const targetN = (m: Mode) => {
    const f = fit(m);
    const sc = Math.min((canvas.clientWidth * f.fw) / f.W, (canvas.clientHeight * f.fh) / f.H);
    return Math.round(Math.min(10000, Math.max(2200, (f.W * sc * f.H * sc * 0.55) / 15)));
  };

  // Coloca el logotipo centrado y abajo del título; las partículas nuevas nacen dispersas (semilla fija) y se juntan.
  const place = (scatter: boolean) => {
    if (!S) return;
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    cw = Math.max(1, Math.floor(r.width * dpr));
    ch = Math.max(1, Math.floor(r.height * dpr));
    canvas.width = cw; canvas.height = ch;
    const { fw: fitW, fh: fitH } = fit(mode);
    const scale = Math.min((cw * fitW) / S.w, (ch * fitH) / S.h);
    const ox = cw / 2 - (S.w * scale) / 2;
    const oy = ch * (mode === "wide" ? 0.57 : 0.6) - (S.h * scale) / 2;
    const rnd = rng(20240607);
    for (let i = 0; i < n; i++) {
      origin[i * 2] = ox + S.pts[i * 2] * scale;
      origin[i * 2 + 1] = oy + S.pts[i * 2 + 1] * scale;
      if (scatter) {
        const a = rnd() * Math.PI * 2, d = (0.25 + rnd() * 0.75) * Math.max(cw, ch) * 0.55;
        pos[i * 2] = cw / 2 + Math.cos(a) * d;
        pos[i * 2 + 1] = ch / 2 + Math.sin(a) * d * 0.7;
        vel[i * 2] = vel[i * 2 + 1] = 0;
        stiff[i] = 0.028 + rnd() * 0.05;
      } else {
        pos[i * 2] = origin[i * 2]; pos[i * 2 + 1] = origin[i * 2 + 1];
        vel[i * 2] = vel[i * 2 + 1] = 0;
      }
    }
    gl.viewport(0, 0, cw, ch);
    gl.uniform2f(uR, cw, ch);
    gl.uniform1f(uS, Math.max(2 * dpr, Math.min(12 * dpr, S.step * scale * 1.1))); // un poco más que la separación: se funden
    settled = false;
    draw();
  };

  const build = async () => {
    if (building) return;
    building = true;
    try {
      mode = pick();
      S = await sample(mode, targetN(mode));
      n = S.n;
      pos = new Float32Array(n * 2); origin = new Float32Array(n * 2); vel = new Float32Array(n * 2); stiff = new Float32Array(n);
      gl.bindBuffer(gl.ARRAY_BUFFER, cb);
      gl.bufferData(gl.ARRAY_BUFFER, S.rgb, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, pb);
      gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
      place(true);
      section?.classList.add("is-ready");
      if (visible) loop();
    } catch {
      fallback();
    } finally {
      building = false;
    }
  };

  const draw = () => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!n) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cb);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, n);
  };

  const step = () => {
    const R = 170 * dpr, R2 = R * R;
    const push = mouse.active > 0;
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const ix = i * 2, iy = ix + 1;
      if (push) {
        const dx = pos[ix] - mouse.x, dy = pos[iy] - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 1) {
          const f = (1 - d2 / R2) * 5 * dpr, d = Math.sqrt(d2);
          vel[ix] += (dx / d) * f; vel[iy] += (dy / d) * f;
        }
      }
      const k = stiff[i];
      vel[ix] = (vel[ix] + (origin[ix] - pos[ix]) * k) * 0.85;
      vel[iy] = (vel[iy] + (origin[iy] - pos[iy]) * k) * 0.85;
      pos[ix] += vel[ix]; pos[iy] += vel[iy];
      energy += Math.abs(vel[ix]) + Math.abs(vel[iy]) + Math.abs(origin[ix] - pos[ix]) + Math.abs(origin[iy] - pos[iy]);
    }
    if (push) mouse.active--;
    // Cuando todo está quieto no se vuelve a pintar hasta que alguien lo toque.
    if (!push && energy / Math.max(1, n) < 0.02) { for (let i = 0; i < n * 2; i++) pos[i] = origin[i]; settled = true; }
  };

  const loop = () => {
    if (raf || !visible) return;
    const tick = () => {
      raf = 0;
      if (!visible) return;
      if (!settled) { step(); draw(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) loop(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: "60px" }).observe(canvas);

  let rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => { if (pick() !== mode) build(); else place(false); }, 140);
  });

  const poke = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; mouse.active = e.pointerType === "mouse" ? 240 : 40;
    if (settled) { settled = false; }
  };
  if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", poke, { passive: true });
  else canvas.addEventListener("pointerdown", poke, { passive: true });

  build();
}
