// Sonidos de interfaz sintetizados con Web Audio (sin archivos). Empiezan desactivados:
// el navegador no deja sonar nada sin un gesto y no queremos sorprender a nadie. Se activan con el
// botón de la barra (o con "Activar sonido" en la entrada) y la elección se recuerda.

type Name = "tick" | "open" | "close" | "whoosh" | "pop" | "swipe" | "chime" | "intro";

const KEY = "waveSound";
let enabled = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
const last: Partial<Record<Name, number>> = {};
const subs = new Set<(on: boolean) => void>();

try { enabled = localStorage.getItem(KEY) === "1"; } catch { /* sin storage */ }

// El contexto de audio solo se crea dentro de un gesto del usuario.
function unlock(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    master = ctx.createGain();
    master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(c: AudioContext, o: { f: number; to?: number; d: number; t?: number; g?: number; type?: OscillatorType; a?: number }) {
  const t0 = c.currentTime + (o.t ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.d);
  const peak = o.g ?? 0.1;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.a ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
  osc.connect(g).connect(master!);
  osc.start(t0);
  osc.stop(t0 + o.d + 0.05);
}

function air(c: AudioContext, o: { from: number; to: number; d: number; t?: number; g?: number; q?: number }) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    let s = 7; // ruido determinista
    for (let i = 0; i < data.length; i++) { s = (s * 16807) % 2147483647; data[i] = (s / 2147483647) * 2 - 1; }
  }
  const t0 = c.currentTime + (o.t ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = o.q ?? 1.2;
  f.frequency.setValueAtTime(o.from, t0);
  f.frequency.exponentialRampToValueAtTime(o.to, t0 + o.d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.g ?? 0.12, t0 + o.d * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.d);
  src.connect(f).connect(g).connect(master!);
  src.start(t0);
  src.stop(t0 + o.d + 0.05);
}

const SOUNDS: Record<Name, (c: AudioContext) => void> = {
  tick: (c) => tone(c, { f: 1900, to: 1250, d: 0.05, g: 0.05, type: "triangle" }),
  pop: (c) => tone(c, { f: 560, to: 300, d: 0.11, g: 0.12 }),
  open: (c) => { tone(c, { f: 420, to: 560, d: 0.11, g: 0.09 }); tone(c, { f: 630, to: 840, d: 0.14, t: 0.06, g: 0.07, type: "triangle" }); },
  close: (c) => { tone(c, { f: 620, to: 430, d: 0.1, g: 0.07 }); tone(c, { f: 420, to: 300, d: 0.13, t: 0.05, g: 0.06, type: "triangle" }); },
  swipe: (c) => { air(c, { from: 900, to: 3200, d: 0.22, g: 0.05, q: 0.9 }); tone(c, { f: 380, to: 520, d: 0.14, g: 0.04, type: "triangle" }); },
  whoosh: (c) => { air(c, { from: 260, to: 4200, d: 0.7, g: 0.16, q: 0.8 }); tone(c, { f: 110, to: 220, d: 0.6, g: 0.05, type: "sawtooth", a: 0.2 }); },
  chime: (c) => [1046.5, 1318.5, 1568].forEach((f, i) => tone(c, { f, d: 0.5, t: i * 0.075, g: 0.08, type: "triangle", a: 0.012 })),
  intro: (c) => { air(c, { from: 200, to: 5200, d: 1.0, g: 0.18, q: 0.7 }); tone(c, { f: 96, to: 192, d: 0.9, g: 0.07, type: "sawtooth", a: 0.25 }); tone(c, { f: 1318.5, d: 0.9, t: 0.85, g: 0.06, type: "triangle" }); },
};

export const sfx = {
  get on() { return enabled; },
  play(name: Name) {
    if (!enabled) return;
    const c = unlock();
    if (!c || c.state !== "running") return;
    const now = performance.now();
    if (now - (last[name] ?? 0) < 70) return;
    last[name] = now;
    SOUNDS[name](c);
  },
  set(on: boolean, silent = false) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* sin storage */ }
    if (on) { unlock(); if (!silent) setTimeout(() => this.play("chime"), 30); }
    subs.forEach((f) => f(on));
  },
  subscribe(f: (on: boolean) => void) { subs.add(f); f(enabled); },
};

// Botones de sonido, desbloqueo con el primer gesto y sonidos de los componentes comunes.
export function initSound() {
  const sync = (on: boolean) => {
    document.querySelectorAll<HTMLElement>("[data-sound-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Silenciar sonido" : "Activar sonido");
      b.title = on ? "Sonido activado" : "Sonido desactivado";
    });
    document.documentElement.classList.toggle("sfx-on", on);
  };
  sfx.subscribe(sync);

  document.querySelectorAll("[data-sound-toggle]").forEach((b) => b.addEventListener("click", () => sfx.set(!enabled)));
  document.querySelectorAll("[data-sound-opt]").forEach((b) => b.addEventListener("click", () => {
    sfx.set(true);
    b.classList.add("is-done");
    (b as HTMLElement).textContent = "Sonido activado";
  }));

  const wake = () => { if (enabled) unlock(); };
  addEventListener("pointerdown", wake, { passive: true });
  addEventListener("keydown", wake);

  // Sonidos de interfaz por delegación: no hace falta tocar cada componente.
  document.addEventListener("click", (e) => {
    if (!enabled) return;
    const t = (e.target as HTMLElement | null)?.closest<HTMLElement>("button, a");
    if (!t || t.closest("[data-sound-toggle], [data-sound-opt]")) return;
    if (t.matches(".svc-row, .faq-q")) { sfx.play(t.getAttribute("aria-expanded") === "true" ? "open" : "close"); return; }
    if (t.matches(".wl-tabs button, .wl-sw button, [data-step], .exp-ctl")) { sfx.play("pop"); return; }
    if (t.matches(".btn, .fx-nav-cta, .fx-dock-cta, .fx-menu-link a")) sfx.play("tick");
  });
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointerover", (e) => {
      if (!enabled) return;
      const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(".btn, .svc-row, .fx-menu-link a, .fx-nav-cta");
      if (!t || t.contains(e.relatedTarget as Node | null)) return;
      sfx.play("tick");
    }, { passive: true });
  }
}
