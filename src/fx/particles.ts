// El logo de Wave hecho de partículas WebGL que se apartan del cursor y vuelven.
import { reduceMotion } from "./core";

const WAVES = "M5 13c3-3 5-3 8 0s5 3 8 0 4-3 6-1.5M5 20c3-3 5-3 8 0s5 3 8 0 4-3 6-1.5";

async function sampleLogo(): Promise<{ pts: number[]; w: number; h: number }> {
  const W = 1600, H = 900;
  await document.fonts.load('400 400px "Anton"').catch(() => {});
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineCap = "round";
  // ondas
  g.save();
  const k = 20;
  g.translate(W / 2 - 16 * k, 10);
  g.scale(k, k);
  g.lineWidth = 2.6;
  g.stroke(new Path2D(WAVES));
  g.restore();
  // palabra
  g.font = '400 520px "Anton", Impact, sans-serif';
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillText("WAVE", W / 2, 840);
  const data = g.getImageData(0, 0, W, H).data;
  const step = 8;
  const pts: number[] = [];
  for (let y = 0; y < H; y += step)
    for (let x = 0; x < W; x += step)
      if (data[(y * W + x) * 4 + 3] > 80) pts.push(x, y);
  return { pts, w: W, h: H };
}

export async function initParticleLogo(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
  if (!gl) return;
  const { pts, w: SW, h: SH } = await sampleLogo();
  const n = pts.length / 2;

  const vs = `attribute vec2 p; attribute float c; uniform vec2 r; uniform float s; varying float vc;
    void main(){ vec2 clip=(p/r*2.0-1.0)*vec2(1.0,-1.0); vc=c; gl_Position=vec4(clip,0.0,1.0); gl_PointSize=s; }`;
  const fs = `precision mediump float; varying float vc;
    void main(){ float d=length(gl_PointCoord-0.5); float a=1.0-smoothstep(0.25,0.5,d);
      vec3 col=mix(vec3(0.13,0.68,0.75),vec3(1.0),vc); gl_FragColor=vec4(col,a); }`;
  const sh = (t: number, src: string) => { const s = gl.createShader(t)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(prog, 0, "p");
  gl.bindAttribLocation(prog, 1, "c");
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const pos = new Float32Array(n * 2);
  const origin = new Float32Array(n * 2);
  const vel = new Float32Array(n * 2);
  const col = new Float32Array(n);
  for (let i = 0; i < n; i++) col[i] = Math.random() < 0.18 ? 1 : 0;
  const pb = gl.createBuffer()!, cb = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, cb);
  gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, pb);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);

  const mouse = { x: -9999, y: -9999, active: 0 };
  let cw = 1, ch = 1, dpr = 1, visible = true;

  const layout = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    cw = Math.max(1, Math.floor(r.width * dpr));
    ch = Math.max(1, Math.floor(r.height * dpr));
    canvas.width = cw; canvas.height = ch;
    const scale = Math.min((cw * 0.86) / SW, (ch * 0.8) / SH);
    const ox = cw / 2 - (SW * scale) / 2, oy = ch / 2 - (SH * scale) / 2;
    for (let i = 0; i < n; i++) {
      origin[i * 2] = ox + pts[i * 2] * scale;
      origin[i * 2 + 1] = oy + pts[i * 2 + 1] * scale;
      pos[i * 2] = origin[i * 2]; pos[i * 2 + 1] = origin[i * 2 + 1];
      vel[i * 2] = vel[i * 2 + 1] = 0;
    }
    gl.viewport(0, 0, cw, ch);
    gl.uniform2f(gl.getUniformLocation(prog, "r"), cw, ch);
    gl.uniform1f(gl.getUniformLocation(prog, "s"), Math.max(2.2, 3.4 * dpr * (cw / 1600 + 0.6)));
  };
  layout();
  addEventListener("resize", layout);
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(canvas);

  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; mouse.active = 240;
  };
  if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", move, { passive: true });

  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!reduceMotion) {
      const R = 190 * dpr, R2 = R * R;
      for (let i = 0; i < n; i++) {
        const ix = i * 2, iy = ix + 1;
        if (mouse.active > 0) {
          const dx = pos[ix] - mouse.x, dy = pos[iy] - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1) {
            const f = (1 - d2 / R2) * 5.5 * dpr;
            const d = Math.sqrt(d2);
            vel[ix] += (dx / d) * f; vel[iy] += (dy / d) * f;
          }
        }
        vel[ix] = (vel[ix] + (origin[ix] - pos[ix]) * 0.06) * 0.84;
        vel[iy] = (vel[iy] + (origin[iy] - pos[iy]) * 0.06) * 0.84;
        pos[ix] += vel[ix]; pos[iy] += vel[iy];
      }
      if (mouse.active > 0) mouse.active--;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, cb);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, n);
  };
  frame();
}
