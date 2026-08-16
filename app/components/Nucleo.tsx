"use client";

import { useEffect, useRef } from "react";

export type EstadoNucleo = "inactivo" | "escuchando" | "procesando" | "hablando";

type Particula = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
};

const COLOR_CORE = "#EAF6FF";
const COLOR_BLUE = "#2E8FFF";
const COLOR_BRIGHT = "#7AC8FF";
const COLOR_ACCENT = "#00D4FF";

export default function Nucleo({
  estado,
  amplitud = 0,
}: {
  estado: EstadoNucleo;
  amplitud?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particulasRef = useRef<Particula[]>([]);
  const rotRef = useRef(0);
  const rafRef = useRef<number>();
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.7;
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    if (particulasRef.current.length === 0) {
      particulasRef.current = Array.from({ length: 220 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 40 + Math.random() * 90,
        speed: 0.001 + Math.random() * 0.004,
        size: 0.6 + Math.random() * 1.8,
      }));
    }

    const draw = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.32;

      ctx.clearRect(0, 0, w, h);

      let velocidad = 0.002;
      let intensidad = 0.5;
      if (estado === "escuchando") {
        velocidad = 0.006 + amplitud * 0.02;
        intensidad = 0.7 + amplitud * 0.5;
      } else if (estado === "procesando") {
        velocidad = -0.012;
        intensidad = 0.9;
      } else if (estado === "hablando") {
        velocidad = 0.004;
        intensidad = 0.6 + amplitud * 0.8;
      }

      if (!reducedMotion.current) {
        rotRef.current += velocidad;
      }

      ctx.globalCompositeOperation = "lighter";

      const nucleoR = baseR * 0.28 * (1 + intensidad * 0.15);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucleoR);
      grad.addColorStop(0, COLOR_CORE);
      grad.addColorStop(0.4, COLOR_BRIGHT);
      grad.addColorStop(1, "rgba(46,143,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, nucleoR, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const r = baseR * (0.55 + i * 0.22);
        ctx.strokeStyle = i % 2 === 0 ? COLOR_BLUE : COLOR_BRIGHT;
        ctx.globalAlpha = 0.25 + intensidad * 0.2 - i * 0.05;
        ctx.lineWidth = 1 + i * 0.5;
        ctx.beginPath();
        const dir = i % 2 === 0 ? 1 : -1;
        const segs = 60;
        for (let s = 0; s <= segs; s++) {
          const a = (s / segs) * Math.PI * 2 + rotRef.current * dir * (1 + i * 0.3);
          const wobble = Math.sin(a * 6 + rotRef.current * 10) * r * 0.02;
          const rr = r + wobble;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr * 0.92;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const rayos = 10;
      for (let i = 0; i < rayos; i++) {
        const a = (i / rayos) * Math.PI * 2 + rotRef.current * 2;
        const len = baseR * (0.9 + Math.sin(rotRef.current * 20 + i) * 0.15);
        ctx.strokeStyle = COLOR_ACCENT;
        ctx.globalAlpha = 0.15 + intensidad * 0.25;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * nucleoR * 0.6, cy + Math.sin(a) * nucleoR * 0.6);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const p of particulasRef.current) {
        if (!reducedMotion.current) {
          p.angle += p.speed * (1 + intensidad);
        }
        const r = baseR * (p.radius / 100) * (0.8 + intensidad * 0.3);
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r * 0.92;
        ctx.fillStyle = Math.random() > 0.5 ? COLOR_BRIGHT : COLOR_BLUE;
        ctx.globalAlpha = 0.4 + intensidad * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [estado, amplitud]);

  return <canvas ref={canvasRef} className="block" />;
}
