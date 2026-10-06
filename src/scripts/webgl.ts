/** Aurora líquida en WebGL (fragment shader con fbm). Devuelve start/stop/destroy. */
export function createAurora(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "low-power" });
  if (!gl) return null;

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const fs = `
  precision mediump float;
  uniform vec2 uRes; uniform float uT; uniform vec2 uM; uniform float uS;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p=p*2.02+vec2(3.1,1.7); a*=.5; } return v; }
  void main(){
    vec2 uv = gl_FragCoord.xy / uRes.xy;
    vec2 p = (gl_FragCoord.xy - .5*uRes.xy) / uRes.y;
    vec2 m = (uM - .5) * vec2(uRes.x/uRes.y, 1.);
    float t = uT * .12;
    vec2 q = vec2(fbm(p*1.6 + t), fbm(p*1.6 + vec2(5.2,1.3) - t));
    vec2 r = vec2(fbm(p*2.2 + 3.*q + vec2(1.7,9.2) + t*1.3), fbm(p*2.2 + 3.*q + vec2(8.3,2.8) - t));
    float f = fbm(p*1.4 + 3.2*r + m*.8);
    vec3 c1 = vec3(.486,.361,1.);   // violeta
    vec3 c2 = vec3(.133,.827,.933); // cian
    vec3 c3 = vec3(1.,.239,.604);   // rosa
    vec3 c4 = vec3(.776,1.,.239);   // lima
    vec3 col = mix(vec3(.027,.027,.05), c1, smoothstep(.2,.8,f));
    col = mix(col, c2, smoothstep(.35,1.,r.x)*.8);
    col = mix(col, c3, smoothstep(.45,1.,r.y*q.x*1.6)*.7);
    col += c4 * smoothstep(.0,.55,.25-length(p-m*1.2))*.55;      // halo lima siguiendo el ratón
    col *= .55 + .55*smoothstep(1.2,.0,length(p*vec2(.8,1.1)));   // viñeta
    col *= 1. - uS*.7;                                            // se apaga al hacer scroll
    gl_FragColor = vec4(col, 1.);
  }`;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uT = gl.getUniformLocation(prog, "uT");
  const uM = gl.getUniformLocation(prog, "uM");
  const uS = gl.getUniformLocation(prog, "uS");

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  let scrollK = 0;
  let raf = 0;
  let running = false;
  let t0 = performance.now();
  const dpr = Math.min(devicePixelRatio || 1, 1.25) * 0.6;

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(2, Math.floor(w * dpr));
    canvas.height = Math.max(2, Math.floor(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = 1 - (e.clientY - r.top) / r.height;
  };
  const frame = (now: number) => {
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    scrollK = Math.min(1, Math.max(0, scrollY / Math.max(1, canvas.clientHeight)));
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uM, mouse.x, mouse.y);
    gl.uniform1f(uS, scrollK);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (running) raf = requestAnimationFrame(frame);
  };
  addEventListener("resize", resize);
  addEventListener("pointermove", onMove, { passive: true });
  resize();
  return {
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    still() {
      running = false;
      requestAnimationFrame(frame);
    },
    destroy() {
      this.stop();
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
    },
  };
}
