const COLORS = ["#c6ff3d", "#7c5cff", "#22d3ee", "#ff3d9a", "#ffe14d", "#ffffff"];
interface P { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string; life: number }

export function confetti(canvas: HTMLCanvasElement, x = 0.5, y = 0.45, count = 220) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const ox = x * canvas.width, oy = y * canvas.height;
  const ps: P[] = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, s = (6 + Math.random() * 14) * dpr;
    return { x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6 * dpr, w: (6 + Math.random() * 8) * dpr, h: (4 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1 };
  });
  let raf = 0;
  const step = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (const p of ps) {
      p.vy += 0.38 * dpr;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.life -= 0.0065;
      if (p.life <= 0 || p.y > canvas.height + 40) continue;
      alive++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(1, Math.cos(p.r * 2));
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(step);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  cancelAnimationFrame(raf);
  step();
}
