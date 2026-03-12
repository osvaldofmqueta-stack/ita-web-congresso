import { useState, useEffect, useRef, useCallback } from "react";

const CONGRESS_NAME = "Congresso do Sector Agro-Alimentar";
const CONGRESS_ABBR = "CSA 2026";
const INSTITUTE = "Instituto de Tecnologia Agro-Alimentar";
const UNIVERSITY = "Universidade Rainha Njinga a Mbande";
const UNIVERSITY_ABBR = "URNM";

const thematicAxes = [
  {
    number: "01",
    title: "Ensino e Investigação",
    description: "Ensino e investigação aplicada ao sector agro-alimentar",
    icon: "🎓",
  },
  {
    number: "02",
    title: "Contribuição Económica",
    description: "Contribuição do sector agro na economia nacional",
    icon: "📈",
  },
  {
    number: "03",
    title: "Integração Empresarial",
    description:
      "Integração empresarial na criação de políticas de desenvolvimento do sector agro em Angola",
    icon: "🤝",
  },
];

/* ─── Gravity Particle Canvas ─────────────────────────────────────────────── */

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

function GravityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);

  const COLORS = [
    "rgba(200,168,60,",
    "rgba(245,214,117,",
    "rgba(255,255,255,",
    "rgba(100,140,255,",
    "rgba(180,220,255,",
  ];

  const buildParticles = useCallback((w: number, h: number) => {
    const cols = Math.floor(w / 60);
    const rows = Math.floor(h / 60);
    const arr: Particle[] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = (c + 0.5) * (w / cols) + (Math.random() - 0.5) * 20;
        const y = (r + 0.5) * (h / rows) + (Math.random() - 0.5) * 20;
        arr.push({
          x,
          y,
          ox: x,
          oy: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 2.5 + 0.6,
          alpha: Math.random() * 0.5 + 0.15,
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
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildParticles(canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const REPEL = 120;
    const SPRING = 0.04;
    const DAMPING = 0.82;
    const FORCE = 3500;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (const p of particles.current) {
        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL && dist > 0) {
          const f = (FORCE / (dist * dist)) * (1 - dist / REPEL);
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }

        // Spring back to origin
        p.vx += (p.ox - p.x) * SPRING;
        p.vy += (p.oy - p.y) * SPRING;

        // Damping
        p.vx *= DAMPING;
        p.vy *= DAMPING;

        p.x += p.vx;
        p.y += p.vy;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();
      }

      // Draw connecting lines between close particles near mouse
      for (let i = 0; i < particles.current.length; i++) {
        const a = particles.current[i];
        const dax = a.x - mx;
        const day = a.y - my;
        if (Math.sqrt(dax * dax + day * day) > REPEL * 1.5) continue;
        for (let j = i + 1; j < particles.current.length; j++) {
          const b = particles.current[j];
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 60) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(200,168,60,${0.15 * (1 - d / 60)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animFrame.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrame.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [buildParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

/* ─── Toast notification ──────────────────────────────────────────────────── */

function ComingSoonToast({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0a1437, #1a2d6e)", border: "1px solid rgba(200,168,60,0.4)" }}
      >
        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a1437">
            <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm">Aplicação em Breve!</p>
          <p className="text-yellow-300/80 text-xs mt-0.5">O link de download será disponibilizado brevemente</p>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white ml-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a1437]/95 backdrop-blur-md shadow-xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center gap-3">
            <img src="/csa-logo.png" alt="CSA Logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">{CONGRESS_ABBR}</p>
              <p className="text-yellow-300 text-xs font-medium">{UNIVERSITY_ABBR}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {["Início", "Sobre", "Eixos Temáticos", "Download"].map((item) => (
              <a
                key={item}
                href={`#${encodeURIComponent(item.toLowerCase().replace(/\s+/g, "-"))}`}
                className="text-white/80 hover:text-yellow-300 text-sm font-medium transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          <a
            href="#download"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[#0a1437] gold-gradient shadow-lg hover:scale-105 transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99z"/>
            </svg>
            Download App
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */

function HeroSection({ onDownloadClick }: { onDownloadClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2026-05-01T00:00:00Z");
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="início" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src="/instituto2.jpeg" alt={INSTITUTE} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Gravity Particle Canvas */}
      <GravityCanvas />

      {/* Decorative rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-yellow-400/8"
            style={{
              width: `${250 + i * 160}px`,
              height: `${250 + i * 160}px`,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              animation: `pulse-ring ${4 + i * 0.6}s ease-out ${i * 0.5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 py-32 pointer-events-none">
        <div className="flex justify-center items-center gap-6 mb-8">
          <img src="/urnm-logo.png" alt={UNIVERSITY} className="h-20 w-20 object-contain animate-float drop-shadow-2xl" />
          <div className="w-px h-16 bg-yellow-400/40" />
          <img src="/csa-logo.png" alt={CONGRESS_ABBR} className="h-20 w-20 object-contain animate-float drop-shadow-2xl" style={{ animationDelay: "1s" }} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-sm font-medium mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Inscrições Abertas · 01 Março — 31 Abril 2026
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
          <span className="block">{CONGRESS_ABBR}</span>
          <span className="shimmer-text text-3xl sm:text-4xl lg:text-5xl font-bold block mt-2">
            {CONGRESS_NAME}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/80 mb-2 font-medium">{INSTITUTE}</p>
        <p className="text-base text-yellow-300/80 mb-10 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {UNIVERSITY} — República de Angola
        </p>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto mb-12">
          {[
            { label: "Dias", value: timeLeft.days },
            { label: "Horas", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Seg", value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-2xl p-3 text-center">
              <p className="text-3xl font-bold text-yellow-300 font-mono tabular-nums">
                {String(item.value).padStart(2, "0")}
              </p>
              <p className="text-white/60 text-xs mt-1 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
          <button
            onClick={onDownloadClick}
            className="download-btn inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-[#0a1437] gold-gradient shadow-2xl hover:scale-105 transition-transform"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-4.2-5.78v1.75l3.2-3.01L12.8 9v1.78C10.34 11.27 8.73 12.94 8.1 15c.99-1.1 2.33-1.79 3.7-1.78z"/>
            </svg>
            Descarregar App
          </button>
          <a
            href="#sobre"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white border-2 border-white/30 hover:border-yellow-400/60 hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            Saber Mais
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/40 text-xs">Scroll</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ─── About ───────────────────────────────────────────────────────────────── */

function AboutSection() {
  return (
    <section id="sobre" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Sobre o Congresso
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
              Um Encontro de{" "}
              <span className="text-primary relative">
                Excelência Científica
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 gold-gradient rounded-full" />
              </span>{" "}
              e Inovação Agro-Alimentar
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              O <strong className="text-foreground">{CONGRESS_NAME} ({CONGRESS_ABBR})</strong> é um evento científico de referência promovido pela{" "}
              <strong className="text-foreground">{UNIVERSITY}</strong>, que reúne investigadores, docentes, estudantes e profissionais do sector agro-alimentar angolano.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              O congresso decorre no <strong className="text-foreground">{INSTITUTE}</strong>. As inscrições e submissão de trabalhos realizam-se exclusivamente através da aplicação móvel, de{" "}
              <strong className="text-foreground">01 de Março a 31 de Abril de 2026</strong>.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Local", value: INSTITUTE, icon: "📍" },
                { label: "Instituição", value: UNIVERSITY_ABBR, icon: "🎓" },
                { label: "Inscrições", value: "01 Mar – 31 Abr 2026", icon: "📅" },
                { label: "Candidatura", value: "App Móvel", icon: "📱" },
              ].map((info) => (
                <div key={info.label} className="p-4 rounded-2xl bg-card border border-border/60 card-hover">
                  <span className="text-2xl">{info.icon}</span>
                  <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider font-medium">{info.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{info.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img src="/instituto2.jpeg" alt={INSTITUTE} className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1437]/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white font-bold text-lg">{INSTITUTE}</p>
                <p className="text-yellow-300 text-sm mt-1 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  Angola
                </p>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-center">
              <img src="/urnm-logo.png" alt={UNIVERSITY_ABBR} className="w-16 h-16 object-contain" />
            </div>
            <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 shadow-xl border border-yellow-400/20"
              style={{ background: "rgba(10,20,55,0.85)" }}
            >
              <div className="flex items-center gap-3">
                <img src="/csa-logo.png" alt="CSA" className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-white text-sm font-bold">{CONGRESS_ABBR}</p>
                  <p className="text-yellow-300 text-xs">2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Thematic Axes ───────────────────────────────────────────────────────── */

function ThematicAxesSection() {
  return (
    <section
      id="eixos-temáticos"
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1437 0%, #1a2d6e 50%, #0a1437 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c8a83c, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c8a83c, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/30 text-yellow-300 text-sm font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Programa Científico
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Eixos Temáticos</h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            O congresso organiza-se em torno de três grandes eixos que estruturam o debate e a investigação no sector agro-alimentar
          </p>
          <div className="section-divider max-w-48 mx-auto mt-6" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {thematicAxes.map((axis, idx) => (
            <div
              key={axis.number}
              className="group glass-card rounded-3xl p-8 card-hover cursor-default"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="text-5xl">{axis.icon}</div>
                <span className="text-yellow-400/35 font-bold text-5xl font-mono leading-none">{axis.number}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-300 transition-colors">
                {axis.title}
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">{axis.description}</p>
              <div className="mt-6 h-0.5 w-0 group-hover:w-full gold-gradient rounded-full transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────────── */

function PricingSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Taxas de Participação
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Preços de Inscrição</h2>
          <p className="text-muted-foreground text-lg">Preços em Kwanza (Kz) — Inscrições via aplicativo móvel</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-xl border border-border/60">
            <div className="navy-gradient p-6">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="text-left">
                  <p className="text-yellow-300/70 text-xs uppercase tracking-wider font-medium">Categoria</p>
                </div>
                {["Docentes/Investigadores", "Estudantes", "Outros"].map((col) => (
                  <div key={col}>
                    <p className="text-yellow-300 text-xs uppercase tracking-wider font-bold">{col}</p>
                    <div className="flex justify-center gap-2 mt-1">
                      <span className="text-white/50 text-xs">URNM</span>
                      <span className="text-white/30 text-xs">/</span>
                      <span className="text-white/50 text-xs">Externo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card divide-y divide-border/50">
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="font-semibold text-foreground">Espectadores</p>
                  </div>
                  {[
                    { urnm: "5.000", ext: "7.000" },
                    { urnm: "3.000", ext: "4.000" },
                    { urnm: "5.000", ext: "10.000" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-center gap-4 text-center">
                      <div>
                        <p className="font-bold text-primary text-sm">{item.urnm} Kz</p>
                        <p className="text-xs text-muted-foreground">URNM</p>
                      </div>
                      <div className="w-px bg-border/60" />
                      <div>
                        <p className="font-bold text-foreground/80 text-sm">{item.ext} Kz</p>
                        <p className="text-xs text-muted-foreground">Externo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      Prelectores{" "}
                      <span className="text-muted-foreground font-normal text-sm">(autores)</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="inline-flex items-center px-6 py-2 rounded-full gold-gradient text-[#0a1437] font-bold text-lg shadow-lg">
                      20.000 Kz
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Tarifa única</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary flex-shrink-0 mt-0.5">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <p className="text-sm text-muted-foreground">
              As inscrições e submissões de trabalhos são realizadas exclusivamente através da{" "}
              <strong className="text-foreground">aplicação móvel CSA 2026</strong>. Descarregue a app, registe-se e complete a sua candidatura.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Download ────────────────────────────────────────────────────────────── */

function DownloadSection({ onDownloadClick }: { onDownloadClick: () => void }) {
  return (
    <section
      id="download"
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a1437 0%, #1a2d6e 60%, #0a1437 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #f5d675, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/30 text-yellow-300 text-sm font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Disponível em Breve
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Descarregue a Aplicação
            <span className="shimmer-text block text-5xl mt-1">CSA 2026</span>
          </h2>
          <p className="text-white/65 text-lg max-w-2xl mx-auto">
            Inscreva-se, submeta as suas apresentações e acompanhe toda a informação do evento através da nossa aplicação oficial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-16">
          {[
            {
              platform: "Android",
              store: "Google Play Store",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M3 18v-1l1-1V9l-1-1V7h4.5C9.43 7 11 8.57 11 10.5c0 1.13-.56 2.12-1.41 2.74C10.52 14 11.5 15.39 11.5 17c0 2.21-1.79 4-4 4H3v-1l1-1zM5.5 12h2c.83 0 1.5-.67 1.5-1.5S8.33 9 7.5 9h-2v3zm0 7h2.5c.83 0 1.5-.67 1.5-1.5S8.83 16 8 16H5.5v3zM16 7h4v2h-1.5v10h-1V9H16V7z"/>
                </svg>
              ),
              bg: "linear-gradient(135deg, #1a1a2e, #16213e)",
            },
            {
              platform: "iOS",
              store: "Apple App Store",
              icon: (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              ),
              bg: "linear-gradient(135deg, #1c1c1e, #2c2c2e)",
            },
          ].map(({ platform, store, icon, bg }) => (
            <div key={platform} className="glass-card rounded-3xl p-8 text-center card-hover group border border-white/10 hover:border-yellow-400/30 transition-all">
              <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: bg }}>
                {icon}
              </div>
              <h3 className="text-white font-bold text-xl mb-2">{platform}</h3>
              <p className="text-white/60 text-sm mb-6">{store}</p>
              <button
                onClick={onDownloadClick}
                className="download-btn w-full py-3 px-6 rounded-2xl font-semibold text-[#0a1437] gold-gradient shadow-lg text-sm hover:scale-105 transition-transform"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
                  </svg>
                  Em Breve — Clique para saber
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* How to participate */}
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border border-yellow-400/15">
            <h3 className="text-yellow-300 font-bold text-xl text-center mb-8">Como Participar em 3 Passos</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "1", icon: "📲", title: "Descarregue a App", desc: "Instale a aplicação CSA 2026 no seu dispositivo Android ou iOS" },
                { step: "2", icon: "📝", title: "Registe-se", desc: "Crie a sua conta com os seus dados académicos ou profissionais" },
                { step: "3", icon: "🚀", title: "Submeta & Participe", desc: "Inscreva-se e submeta as suas apresentações directamente na app" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-2xl shadow-lg">
                      {item.icon}
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#0a1437] text-xs font-bold flex items-center justify-center shadow">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-2">{item.title}</h4>
                  <p className="text-white/55 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[#050d24] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/csa-logo.png" alt="CSA" className="w-10 h-10 object-contain" />
              <div>
                <p className="text-white font-bold text-sm">{CONGRESS_ABBR}</p>
                <p className="text-yellow-300/70 text-xs">{CONGRESS_NAME}</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Um evento científico promovido pela {UNIVERSITY}, dedicado ao avanço do sector agro-alimentar em Angola.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2">
              {["Sobre o Congresso", "Eixos Temáticos", "Taxas de Inscrição", "Descarregar App"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-yellow-300 text-sm transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Organização</h4>
            <div className="flex items-start gap-3">
              <img src="/urnm-logo.png" alt={UNIVERSITY_ABBR} className="w-12 h-12 object-contain flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-medium">{UNIVERSITY}</p>
                <p className="text-white/50 text-xs mt-1">República de Angola</p>
                <p className="text-yellow-300/70 text-xs font-medium mt-1 italic">Honoris · Opus · Liberta</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section-divider mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs text-center md:text-left">
            © 2026 {CONGRESS_NAME} · {UNIVERSITY} · Todos os direitos reservados
          </p>

          {/* Developer credit — highlighted */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-400/25 bg-yellow-400/5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span className="text-white/40 text-xs">Desenvolvido por</span>
            <span className="text-yellow-300 text-xs font-semibold tracking-wide">Eng. Osvaldo Queta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function CongressPage() {
  const [toastVisible, setToastVisible] = useState(false);

  const handleDownloadClick = useCallback(() => {
    setToastVisible(true);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection onDownloadClick={handleDownloadClick} />
      <AboutSection />
      <ThematicAxesSection />
      <PricingSection />
      <DownloadSection onDownloadClick={handleDownloadClick} />
      <Footer />
      <ComingSoonToast visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  );
}
