"use client";
import { useEffect, useRef, useState } from "react";

const FLOWERS = 25, EXTRA_LIMIT = 8;
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const ease = (v: number) => 1 - (1 - clamp(v)) ** 3;
type Plant = { x: number; ground: number; height: number; size: number; tilt: number; delay: number; speed: number; far: boolean; hue: number };
type Spark = { x: number; y: number; born: number; angle: number; petal: boolean };
// Stable layout, without random SSR values or a DOM node for every petal.
const initialPlants: Plant[] = Array.from({ length: FLOWERS }, (_, i) => ({
  x: 0.07 + ((i * 11) % FLOWERS) / (FLOWERS - 1) * 0.86,
  ground: i < 9 ? 0.83 : 0.96, height: 0.32 + ((i * 7) % 13) / 13 * 0.37,
  size: 0.72 + ((i * 3) % 7) / 10, tilt: (((i * 7) % 13) - 6) * 0.021,
  delay: 800 + ((i * 13) % FLOWERS) * 170, speed: 2300 + ((i * 17) % 6) * 130,
  far: i < 9, hue: i % 4,
}));

function petals(ctx: CanvasRenderingContext2D, radius: number, progress: number, hue: number) {
  for (let i = 0; i < 13; i++) {
    const opening = ease((progress - i * 0.017) / 0.79);
    if (opening <= 0) continue;
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 13); ctx.scale(0.35 + opening * 0.65, opening);
    ctx.beginPath(); ctx.moveTo(0, radius * 0.1);
    ctx.bezierCurveTo(-radius * 0.38, -radius * 0.35, -radius * 0.28, -radius, 0, -radius);
    ctx.bezierCurveTo(radius * 0.31, -radius, radius * 0.36, -radius * 0.3, 0, radius * 0.1);
    ctx.fillStyle = ["#efd06d", "#f4d97f", "#edc760", "#f8df8b"][(i + hue) % 4]; ctx.fill();
    ctx.strokeStyle = "#d7ac4c"; ctx.lineWidth = 0.5; ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, radius * 0.24 * ease(progress * 3), 0, Math.PI * 2); ctx.fillStyle = "#927035"; ctx.fill();
  for (let i = 0; i < 12; i++) {
    const r = Math.sqrt(i) * radius * 0.052 * ease(progress * 3);
    ctx.beginPath(); ctx.arc(Math.cos(i * 2.4) * r, Math.sin(i * 2.4) * r, radius * 0.018, 0, Math.PI * 2); ctx.fillStyle = "#dfb75e"; ctx.fill();
  }
}

function leaf(ctx: CanvasRenderingContext2D, y: number, direction: number, size: number) {
  ctx.save(); ctx.translate(0, y); ctx.scale(direction, 1);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.1, -size * 0.8, size * 0.8, -size, size, -size * 0.85);
  ctx.bezierCurveTo(size * 0.95, -size * 0.1, size * 0.4, size * 0.1, 0, 0);
  ctx.fillStyle = "#809763"; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 0.86, -size * 0.74);
  ctx.strokeStyle = "#bcc79a"; ctx.lineWidth = 0.7; ctx.stroke(); ctx.restore();
}

export default function FlowerField({ reducedMotion, onComplete }: { reducedMotion: boolean; onComplete: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), complete = useRef(onComplete);
  const [ready, setReady] = useState(false), [hint, setHint] = useState(false), [extra, setExtra] = useState(0);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    const surface = canvas.current, ctx = surface?.getContext("2d");
    if (!surface || !ctx) return;
    let width = 0, height = 0, elapsed = 0, previous = 0, frame = 0, lastPaint = 0;
    let finished = false, extraCount = 0, hover = -1;
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    let pointerStart: { x: number; y: number } | null = null;
    const plants = initialPlants.map((p) => ({ ...p }));
    let sparks: Spark[] = [];
    const centers: { x: number; y: number; r: number }[] = [];
    // Cache full blooms: steady state needs one drawImage per flower.
    const blooms = Array.from({ length: 8 }, (_, hue) => {
      const image = document.createElement("canvas"); image.width = image.height = 128;
      const brush = image.getContext("2d")!; brush.translate(64, 64);
      if (hue >= 4) brush.filter = "blur(0.65px)";
      petals(brush, 59, 1, hue % 4); return image;
    });
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      centers.length = 0;
      plants.forEach((p, index) => {
        const age = reducedMotion ? (elapsed >= p.delay ? p.speed : 0) : elapsed - p.delay;
        const growth = ease(age / (p.speed * 0.58));
        if (age <= 0) { centers.push({ x: -999, y: -999, r: 0 }); return; }
        const opening = clamp((age - p.speed * 0.57) / (p.speed * 0.43));
        const h = height * p.height * growth, radius = Math.min(width * 0.065, 36) * p.size * (p.far ? 0.8 : 1);
        const rootX = width * p.x, rootY = height * p.ground;
        const lean = p.tilt + (reducedMotion ? 0 : Math.sin(elapsed / 2200 + index * 1.7) * 0.021 + (hover === index ? 0.035 : 0));
        centers.push({ x: rootX + Math.sin(lean) * h, y: rootY - Math.cos(lean) * h, r: radius });
        ctx.save(); ctx.translate(rootX, rootY); ctx.rotate(lean); ctx.globalAlpha = p.far ? 0.72 : 1;
        ctx.strokeStyle = p.far ? "#98a578" : "#6f8557"; ctx.lineWidth = p.far ? 1.6 : 2.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-h * 0.025, -h * 0.33, h * 0.022, -h * 0.7, 0, -h); ctx.stroke();
        const leaves = ease((age / p.speed - 0.22) / 0.25);
        if (leaves > 0) { leaf(ctx, -h * 0.36, -1, radius * 0.9 * leaves); leaf(ctx, -h * 0.62, 1, radius * 0.8 * leaves); }
        ctx.translate(0, -h);
        if (opening <= 0) {
          const bud = ease((age / p.speed - 0.4) / 0.16);
          ctx.beginPath(); ctx.ellipse(0, -radius * 0.09, radius * 0.17 * bud, radius * 0.29 * bud, 0, 0, Math.PI * 2); ctx.fillStyle = "#e5c468"; ctx.fill();
        } else if (opening >= 1) ctx.drawImage(blooms[p.hue + (p.far ? 4 : 0)], -radius * 64 / 59, -radius * 64 / 59, radius * 128 / 59, radius * 128 / 59);
        else petals(ctx, radius, opening, p.hue);
        ctx.restore();
      });
      if (!reducedMotion) {
        for (let i = 0; i < 9; i++) {
          const drift = (elapsed / (8000 + i * 700) + i * 0.13) % 1;
          ctx.save(); ctx.globalAlpha = Math.sin(drift * Math.PI) * 0.45;
          ctx.translate(width * ((i * 0.137 + drift * 0.13) % 1), height * drift); ctx.rotate(drift * 4 + i);
          ctx.fillStyle = "#cfac50"; ctx.beginPath(); ctx.ellipse(0, 0, i % 3 ? 1.2 : 2.3, i % 3 ? 1.2 : 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        const crossing = (elapsed % 18000) / 1300;
        if (elapsed > 10000 && crossing < 1) {
          ctx.strokeStyle = `rgba(198,159,69,${Math.sin(crossing * Math.PI) * 0.35})`;
          ctx.beginPath(); ctx.moveTo(width * crossing - 15, height * 0.12); ctx.lineTo(width * crossing, height * 0.12 - 5); ctx.stroke();
        }
      }
      sparks = sparks.filter((s) => elapsed - s.born < (reducedMotion ? 400 : 1800));
      sparks.forEach((s) => {
        const progress = (elapsed - s.born) / (reducedMotion ? 400 : 1800);
        ctx.save(); ctx.globalAlpha = 1 - progress; ctx.fillStyle = "#d8b552";
        ctx.translate(s.x + (reducedMotion ? 0 : Math.cos(s.angle) * progress * 35), s.y - (reducedMotion ? 0 : Math.sin(s.angle) * progress * 30 + progress * 15));
        ctx.rotate(s.angle + progress); ctx.beginPath(); ctx.ellipse(0, 0, 2, s.petal ? 5 : 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
    };
    const resize = () => {
      const rect = surface.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    };
    const tick = (now: number) => {
      if (previous) elapsed += Math.min(now - previous, 100);
      previous = now;
      if (now - lastPaint >= 32) { draw(); lastPaint = now; }
      if (!finished && elapsed >= (reducedMotion ? 2000 : 9400)) {
        finished = true; setReady(true); setHint(true); complete.current();
        hintTimer = setTimeout(() => setHint(false), 6000);
      }
      const growing = plants.some((p) => elapsed < p.delay + (reducedMotion ? 1 : p.speed));
      if (!reducedMotion || !finished || growing || sparks.length) frame = requestAnimationFrame(tick);
      else { frame = 0; previous = 0; }
    };
    if (reducedMotion) plants.forEach((p) => { p.delay = 250; });
    const wake = () => { if (!frame && !document.hidden) { previous = 0; frame = requestAnimationFrame(tick); } };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; } else wake(); };
    const local = (event: PointerEvent) => { const r = surface.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
    const burst = (x: number, y: number, petal: boolean) => { sparks = sparks.slice(-20); for (let i = 0; i < 4; i++) sparks.push({ x, y, born: elapsed, angle: i * 1.6 + extraCount, petal }); };
    const plant = (x: number, y: number) => {
      if (!finished) return;
      const hit = centers.findIndex((c) => Math.hypot(c.x - x, c.y - y) < c.r * 0.65);
      if (hit >= 0) { burst(centers[hit].x, centers[hit].y, true); hover = hit; wake(); return; }
      if (extraCount >= EXTRA_LIMIT) return;
      const ground = clamp(y / height + 0.2, 0.43, 0.97);
      plants.push({ x: clamp(x / width, 0.07, 0.93), ground, height: 0.18 + extraCount % 3 * 0.025, size: 0.55 + extraCount % 3 * 0.09, tilt: (extraCount % 5 - 2) * 0.025, delay: elapsed, speed: 1100, far: false, hue: extraCount % 4 });
      extraCount++; setExtra(extraCount); burst(x, ground * height, false); wake();
    };
    const down = (event: PointerEvent) => { if (event.isPrimary && event.button === 0) pointerStart = local(event); };
    const up = (event: PointerEvent) => { const point = local(event); if (pointerStart && Math.hypot(point.x - pointerStart.x, point.y - pointerStart.y) < 12) plant(point.x, point.y); pointerStart = null; };
    const cancel = () => { pointerStart = null; hover = -1; };
    const move = (event: PointerEvent) => { if (event.pointerType !== "mouse") return; const p = local(event); hover = centers.findIndex((c) => Math.hypot(c.x - p.x, c.y - p.y) < c.r * 1.3); };
    const keyboard = (event: KeyboardEvent) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); plant(width * (0.12 + ((extraCount * 7) % 9) * 0.09), height * 0.77); } };
    const observer = new ResizeObserver(resize); observer.observe(surface); resize(); wake();
    surface.addEventListener("pointerdown", down); surface.addEventListener("pointerup", up); surface.addEventListener("pointercancel", cancel); surface.addEventListener("pointerleave", cancel); surface.addEventListener("pointermove", move); surface.addEventListener("keydown", keyboard);
    document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(frame); clearTimeout(hintTimer); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); surface.removeEventListener("pointerdown", down); surface.removeEventListener("pointerup", up); surface.removeEventListener("pointercancel", cancel); surface.removeEventListener("pointerleave", cancel); surface.removeEventListener("pointermove", move); surface.removeEventListener("keydown", keyboard); };
  }, [reducedMotion]);
  return <div className="flower-field" data-ready={ready} data-flowers={FLOWERS + extra}>
    <canvas ref={canvas} tabIndex={ready ? 0 : -1} role="button" aria-disabled={!ready} aria-label={`Jardín de ${FLOWERS + extra} flores. Toca un espacio libre o pulsa Enter para plantar. Toca una flor para soltar pétalos.`} />
    <p className={`field-hint ${hint ? "visible" : ""}`} aria-hidden={!hint}>Toca el jardín ✨</p>
    <span className="sr-only" aria-live="polite">{ready ? `${FLOWERS + extra} flores. ${EXTRA_LIMIT - extra} flores adicionales disponibles.` : "El jardín está floreciendo."}</span>
  </div>;
}
