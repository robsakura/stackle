'use client';

import { useEffect, useRef } from 'react';
import type { Player } from '@/lib/types';

const COLORS: Record<Player, string[]> = {
  Red: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#ff8fa3', '#ffffff'],
  Yellow: ['#facc15', '#fde047', '#fbbf24', '#f59e0b', '#ffe566', '#ffffff'],
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

function createBurst(cx: number, cy: number, colors: string[], count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 4 + Math.random() * 7;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 6,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }
  return particles;
}

export default function Fireworks({ winner }: { winner: Player }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const colors = COLORS[winner];
    let particles: Particle[] = [];
    let frame: number;
    let startTime: number | null = null;
    const totalDuration = 2800;

    // Schedule bursts at different times
    const burstSchedule = [
      { delay: 0,    x: 0.3, y: 0.35 },
      { delay: 120,  x: 0.7, y: 0.28 },
      { delay: 300,  x: 0.5, y: 0.45 },
      { delay: 500,  x: 0.2, y: 0.42 },
      { delay: 650,  x: 0.8, y: 0.38 },
      { delay: 900,  x: 0.45, y: 0.3 },
      { delay: 1100, x: 0.65, y: 0.48 },
      { delay: 1350, x: 0.35, y: 0.33 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    burstSchedule.forEach(({ delay, x, y }) => {
      const t = setTimeout(() => {
        const cx = canvas.width * x;
        const cy = canvas.height * y;
        particles.push(...createBurst(cx, cy, colors, 28));
      }, delay);
      timeouts.push(t);
    });

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;   // gravity
        p.vx *= 0.98;   // drag
        p.rotation += p.rotationSpeed;
        // fade out in the last 40% of total duration
        const fadeStart = totalDuration * 0.6;
        p.alpha = elapsed < fadeStart
          ? 1
          : Math.max(0, 1 - (elapsed - fadeStart) / (totalDuration * 0.4));

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < totalDuration) {
        frame = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      timeouts.forEach(clearTimeout);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [winner]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
    />
  );
}
