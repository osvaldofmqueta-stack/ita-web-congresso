import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ox: number;
  oy: number;
  size: number;
  alpha: number;
  color: string;
}

const COLORS = [
  "rgba(200,168,60,",
  "rgba(245,214,117,",
  "rgba(255,255,255,",
  "rgba(100,140,255,",
  "rgba(180,220,255,",
];

const REPEL = 130;
const SPRING = 0.04;
const DAMPING = 0.83;
const FORCE = 4000;
const SPACING = 70;

export default function GlobalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);
  const scrollY = useRef(0);

  const buildParticles = useCallback((w: number, h: number) => {
    const arr: Particle[] = [];
    const cols = Math.floor(w / SPACING);
    const rows = Math.floor(h / SPACING);
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        const x = c * SPACING + (Math.random() - 0.5) * 18;
        const y = r * SPACING + (Math.random() - 0.5) * 18;
        arr.push({
          x,
          y,
          ox: x,
          oy: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 2.2 + 0.5,
          alpha: Math.random() * 0.45 + 0.1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    }
    particles.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildParticles(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of particles.current) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL && dist > 0) {
          const f = (FORCE / (dist * dist)) * (1 - dist / REPEL);
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }

        p.vx += (p.ox - p.x) * SPRING;
        p.vy += (p.oy - p.y) * SPRING;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();
      }

      for (let i = 0; i < particles.current.length; i++) {
        const a = particles.current[i];
        const dax = a.x - mx;
        const day = a.y - my;
        if (Math.sqrt(dax * dax + day * day) > REPEL * 1.6) continue;
        for (let j = i + 1; j < particles.current.length; j++) {
          const b = particles.current[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 70) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200,168,60,${0.18 * (1 - d / 70)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrame.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [buildParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        mixBlendMode: "screen",
      }}
    />
  );
}
