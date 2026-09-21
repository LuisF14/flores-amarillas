// Canvas-only scenery: a bounded set of reusable flowers, not an SVG forest.
export const JOURNEY_END = 145;
export const THOUGHTS = [
  "No tienes que tener todo resuelto hoy.",
  "Está bien ir a tu propio ritmo.",
  "También estás avanzando cuando descansas.",
  "Hay cosas bonitas que toman tiempo.",
  "No olvides disfrutar mientras llegas.",
  "Eres más fuerte de lo que a veces crees.",
  "Confía en ti y en las decisiones que tomas.",
  "Puedes sentir miedo y aun así dar el siguiente paso.",
  "Todavía hay mucho por descubrir.",
];
export const THOUGHT_TIMES = [4.5, 9.5, 14.5, 19.5, 25, 31, 36, 41, 46];
export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export type EntryGarden = { image: HTMLCanvasElement; left: number; top: number; width: number; height: number };
type Blossom = { x: number; z: number; height: number; type: number; phase: number };
type Hit = { x: number; y: number; radius: number; index: number };
type Petal = { x: number; y: number; time: number; seed: number };

function flowerSprite(type: number, night: boolean, close = false) {
  const canvas = document.createElement("canvas"); canvas.width = 192; canvas.height = 384;
  const c = canvas.getContext("2d")!;
  c.scale(1.5, 1.5);
  if (close) c.filter = "blur(1.1px)";
  const head = 52, lean = (type - 2) * 2;
  c.strokeStyle = night ? "#354d43" : "#748551"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(64, 254); c.bezierCurveTo(57, 186, 71 + lean, 121, 64 + lean, head); c.stroke();
  for (let i = 0; i < 3; i++) {
    const y = 205 - i * 43, dir = i % 2 ? 1 : -1;
    c.save(); c.translate(64, y); c.scale(dir, 1);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(0, -21, 26, -39, 43, -35); c.bezierCurveTo(40, -9, 21, 4, 0, 0);
    c.fillStyle = night ? "#344d3b" : "#90a06b"; c.fill();
    c.beginPath(); c.moveTo(0, 0); c.lineTo(35, -30); c.strokeStyle = night ? "#718054" : "#c5cc9c"; c.lineWidth = 0.7; c.stroke(); c.restore();
  }
  c.translate(64 + lean, head);
  if (night && type % 2 === 0) {
    const glow = c.createRadialGradient(0, 0, 4, 0, 0, 57);
    glow.addColorStop(0, "#ffd16b24"); glow.addColorStop(1, "#ffd16b00");
    c.fillStyle = glow; c.fillRect(-58, -58, 116, 116);
  }
  const gradient = c.createRadialGradient(-8, -15, 2, 0, 0, 47);
  gradient.addColorStop(0, night ? "#fff0ac" : "#ffe7a0"); gradient.addColorStop(1, night ? "#c28a26" : "#e6bb51");
  for (let i = 0; i < 13; i++) {
    c.save(); c.rotate(i * Math.PI * 2 / 13 + type * 0.09);
    c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-17, -14, -17, -46, 0, -48 + type); c.bezierCurveTo(17, -46, 17, -14, 0, 4);
    c.fillStyle = gradient; c.fill(); c.strokeStyle = night ? "#d5aa50" : "#ddba60"; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -38); c.strokeStyle = night ? "#d6bb713f" : "#fff3be9f"; c.stroke(); c.restore();
  }
  c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.fillStyle = night ? "#665631" : "#957039"; c.fill();
  for (let i = 0; i < 21; i++) { const r = Math.sqrt(i) * 2; c.beginPath(); c.arc(Math.cos(i * 2.4) * r, Math.sin(i * 2.4) * r, 0.8, 0, Math.PI * 2); c.fillStyle = "#d5b567"; c.fill(); }
  return canvas;
}

export function createJourneyScene(canvas: HTMLCanvasElement, entry: EntryGarden | null) {
  const c = canvas.getContext("2d");
  if (!c) return null;
  const night = Array.from({ length: 5 }, (_, i) => flowerSprite(i, true));
  const nearNight = Array.from({ length: 5 }, (_, i) => flowerSprite(i, true, true));
  // Four depth bands emerge from projection; the horizon and sky are two more layers.
  const flowers: Blossom[] = Array.from({ length: 200 }, (_, i) => ({
    x: i < 20 ? (i % 2 ? -1 : 1) * (0.75 + noise(i) * 1.2) : i < 80 ? (((i * 31) % 79) / 78 - 0.5) * 17 : (((i * 73) % 181) / 180 - 0.5) * 96,
    z: 3 + ((i * 47) % 181) / 180 * (i < 80 ? 43 : 107),
    height: 1.35 + ((i * 11) % 9) * 0.17, type: i % 5, phase: i * 2.4,
  }));
  // Distant silhouettes are painted once and reused as a continuous horizon strip.
  const horizon = document.createElement("canvas"); horizon.width = 1400; horizon.height = 100;
  const hc = horizon.getContext("2d")!;
  for (let i = 0; i < 520; i++) {
    const x = ((i * 97) % 1400), y = 15 + ((i * 37) % 75), size = 2 + (i % 5);
    hc.strokeStyle = "#7e87587a"; hc.beginPath(); hc.moveTo(x, 100); hc.lineTo(x, y); hc.stroke();
    hc.fillStyle = ["#e6c565", "#f2d880", "#cdb367", "#e8cf89"][i % 4]; hc.beginPath(); hc.ellipse(x, y, size, size * 0.65, 0, 0, Math.PI * 2); hc.fill();
  }
  hc.globalCompositeOperation = "destination-in";
  const mist = hc.createLinearGradient(0, 0, 0, 100);
  mist.addColorStop(0, "#000"); mist.addColorStop(0.4, "#000"); mist.addColorStop(1, "#0000");
  hc.fillStyle = mist; hc.fillRect(0, 0, 1400, 100);
  let width = 1, height = 1;
  let hits: Hit[] = [], petals: Petal[] = [];
  const resize = () => {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const react = (x: number, y: number, time: number) => {
    const hit = [...hits].reverse().find((h) => Math.hypot(x - h.x, y - h.y) < Math.max(20, h.radius));
    if (!hit) return;
    petals = petals.slice(-12);
    for (let i = 0; i < 4; i++) petals.push({ x: hit.x, y: hit.y, time, seed: i + hit.index });
  };
  const draw = (distance: number, seconds: number, entrance: number, mouseX: number, mouseY: number, reduced: boolean) => {
    c.clearRect(0, 0, width, height);
    const entering = smooth(entrance);
    const pulse = (start: number, duration: number) => seconds < start || seconds > start + duration ? 0 : Math.sin((seconds - start) / duration * Math.PI);
    const lastBreeze = reduced ? 0 : pulse(61.5, 4.5);
    const smallBreeze = reduced ? 0 : pulse(18, 2.5) * 0.025 + pulse(29, 3) * 0.035 + lastBreeze * 0.035;
    const horizonY = height * (reduced ? 0.33 : mix(0.40, 0.33, entering)) + (reduced ? 0 : mouseY * 3);
    const sky = c.createLinearGradient(0, 0, 0, horizonY + 50);
    sky.addColorStop(0, "#060c1c");
    sky.addColorStop(0.67, "#111b37");
    sky.addColorStop(1, "#243044");
    c.globalAlpha = entering; c.fillStyle = sky; c.fillRect(0, 0, width, height);
    // A very faint diagonal band, not a bright galaxy.
    c.save(); c.translate(width * 0.5, horizonY * 0.43); c.rotate(-0.22);
    const band = c.createLinearGradient(0, -65, 0, 65);
    band.addColorStop(0, "#9ca6ce00"); band.addColorStop(0.5, "#9ca6ce08"); band.addColorStop(1, "#9ca6ce00");
    c.fillStyle = band; c.fillRect(-width, -65, width * 2, 130); c.restore();
    for (let i = 0; i < 85; i++) {
      const x = noise(i + 41) * width, y = 15 + noise(i + 199) * (horizonY - 35);
      c.globalAlpha = entering * (reduced ? 0.65 : 0.4 + Math.sin(seconds * 0.5 + i) * 0.2);
      c.fillStyle = "#fff4d1"; c.beginPath(); c.arc(x, y, i % 7 === 0 ? 1.2 : 0.7, 0, Math.PI * 2); c.fill();
    }
    const shooting = ((seconds - 24 + 47) % 47) / 1.6;
    if (!reduced && seconds >= 24 && shooting < 1) {
      c.globalAlpha = Math.sin(shooting * Math.PI) * 0.45; c.strokeStyle = "#fff1c3";
      c.beginPath(); c.moveTo(width * (0.18 + shooting * 0.3), horizonY * 0.35 + shooting * 35); c.lineTo(width * (0.18 + shooting * 0.3) - 26, horizonY * 0.35 + shooting * 35 - 8); c.stroke();
    }
    c.globalAlpha = entering;
    const ground = c.createLinearGradient(0, horizonY, 0, height);
    ground.addColorStop(0, "#1e302f00"); ground.addColorStop(0.09, "#1a2c2b"); ground.addColorStop(0.45, "#102320"); ground.addColorStop(1, "#080f18");
    c.fillStyle = ground; c.fillRect(0, horizonY, width, height - horizonY);
    c.globalAlpha = entering * 0.45;
    c.drawImage(horizon, -10, horizonY - 7, width + 20, height * 0.13);
    const focal = Math.max(width * 0.65, Math.min(height * 0.78, width * 1.1)), cameraHeight = reduced ? 2.65 : mix(7.5, 2.65, entering);
    const clearing = smooth((seconds - 51) / 8);
    const sceneDistance = reduced ? 15 : distance;
    // The path bends gently toward the vanishing point; its width grows with depth.
    const bend = (z: number) => Math.sin(z * 0.065 + sceneDistance * 0.018) * (width < 600 ? 0.4 : 1.0);
    const pathWidth = width < 600 ? 0.48 + clearing * 0.48 : 0.8 + clearing * 1.1;
    const trail = c.createLinearGradient(0, horizonY, 0, height);
    trail.addColorStop(0, "#071519bb"); trail.addColorStop(0.5, "#07151988"); trail.addColorStop(1, "#07151900");
    c.globalAlpha = entering; c.fillStyle = trail; c.beginPath();
    for (let side = -1; side <= 1; side += 2) {
      for (let step = 0; step <= 40; step++) {
        const z = side < 0 ? 110 - step * 2.7 : 2 + step * 2.7, scale = focal / z;
        const x = width / 2 + (bend(z) + side * pathWidth) * scale;
        const y = horizonY + cameraHeight * scale;
        if (side < 0 && step === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
    }
    c.closePath(); c.fill();
    for (let i = 0; i < 28; i++) {
      const z = 3 + ((i * 3.7 - sceneDistance % 75 + 75) % 75), scale = focal / z;
      c.globalAlpha = entering * 0.24;
      c.fillStyle = i % 4 ? "#b89d57" : "#ead391";
      c.beginPath(); c.ellipse(width / 2 + (bend(z) + Math.sin(i * 7) * pathWidth * 0.75) * scale, horizonY + cameraHeight * scale, Math.min(3, scale * 0.04), Math.min(1.3, scale * 0.02), i, 0, Math.PI * 2); c.fill();
    }
    const projected = flowers.map((f, index) => {
      const range = index < 20 ? 18 : index < 80 ? 43 : 107;
      const z = 2 + ((f.z - sceneDistance % range + range) % range);
      const center = bend(z);
      // Preserve a clear walking corridor at every depth, widening at the finale.
      const x = center + (f.x < 0 ? -1 : 1) * (Math.abs(f.x) * (width < 600 ? 0.55 : 1) + pathWidth + 0.25);
      return { ...f, index, x, z };
    }).sort((a, b) => b.z - a.z);
    hits = [];
    for (const f of projected) {
      const scale = focal / f.z, worldH = f.height * scale;
      const x = width / 2 + (f.x - (reduced ? 0 : mouseX * 0.4)) * scale;
      const bottom = horizonY + cameraHeight * scale;
      const w = worldH * 0.5;
      if (x + w < 0 || x - w > width || bottom - worldH > height || bottom < 0) continue;
      const gust = reduced ? 0 : Math.sin(distance * 0.15) ** 12 * 0.05;
      const wind = reduced ? 0 : Math.sin(seconds * 0.75 + f.phase) * 0.023 + gust + smallBreeze;
      const tilt = Math.sin(f.phase) * 0.055 + wind + (reduced ? 0 : Math.sign(f.x) * smooth((7 - f.z) / 4) * 0.06);
      const alpha = entering * smooth(((f.index < 20 ? 20 : f.index < 80 ? 45 : 109) - f.z) / (f.index < 20 ? 3 : 9));
      c.save(); c.translate(x, bottom); c.rotate(tilt);
      const sprites = f.z < 5 ? nearNight : night;
      c.globalAlpha = alpha; c.drawImage(sprites[f.type], -w / 2, -worldH, w, worldH);
      c.restore();
      if (f.z < 26) hits.push({ x: x + Math.sin(tilt) * worldH * 0.8, y: bottom - worldH * 0.8, radius: w * 0.38, index: f.index });
    }
    // A few nearby pass-through blooms disguise recycling and sell the camera descent.
    if (!reduced && entrance < 1 && entrance > 0.2) {
      c.globalAlpha = Math.sin(clamp((entrance - 0.2) / 0.8) * Math.PI) * 0.85;
      c.drawImage(nearNight[2], -width * 0.12 - entrance * 130, height * 0.35, Math.min(width * 0.45, 240 + entrance * 200), Math.min(width * 0.9, 480 + entrance * 400));
      c.drawImage(nearNight[0], width - 100 + entrance * 100, height * 0.5, 230, 460);
    }
    if (entry && entrance < 1) {
      const scale = reduced ? 1 : 1 + smooth(entrance) * 1.9;
      c.globalAlpha = 1 - smooth((entrance - 0.22) / 0.68);
      c.drawImage(entry.image, entry.left - entry.width * (scale - 1) / 2, entry.top + (reduced ? 0 : entrance * height * 0.21), entry.width * scale, entry.height * scale);
    }
    c.globalAlpha = 1;
    {
      for (let i = 0; i < 12; i++) {
        let x = ((i * 83) % 997) / 997 * width + (reduced ? 0 : Math.sin(seconds * 0.4 + i) * 14 + mouseX * (i % 3 + 1) * 4);
        let y = horizonY + 12 + ((i * 31) % 151) / 151 * height * 0.34 + (reduced ? 0 : Math.cos(seconds * 0.6 + i) * 7 + mouseY * 3);
        const gathering = reduced ? 0 : clearing * (0.22 + (i % 4) * 0.1);
        x = mix(x, width * (0.43 + noise(i + 22) * 0.17), gathering);
        y = mix(y, height * (0.48 + noise(i + 36) * 0.2), gathering);
        c.globalAlpha = entering * (reduced ? 0.45 : 0.15 + (Math.sin(seconds + i) + 1) * 0.25 + pulse(13, 2.5) * 0.15 + lastBreeze * 0.16);
        if (i % 4 === 0) {
          const glow = c.createRadialGradient(x, y, 0, x, y, 10);
          glow.addColorStop(0, "#ffd87f70"); glow.addColorStop(1, "#ffd87f00");
          c.fillStyle = glow; c.fillRect(x - 10, y - 10, 20, 20);
        }
        c.fillStyle = "#f2d777"; c.beginPath(); c.arc(x, y, 1.7, 0, Math.PI * 2); c.fill();
      }
    }
    if (!reduced) {
      for (let i = 0; i < 5; i++) {
        const t = (seconds / (18 + i * 3) + i * 0.21) % 1;
        c.save(); c.globalAlpha = Math.sin(t * Math.PI) * 0.45 * entering;
        c.translate(width * t, horizonY + height * 0.2 * Math.sin(t * 3 + i)); c.rotate(t * 7 + i);
        c.fillStyle = "#c1a14f"; c.beginPath(); c.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2); c.fill(); c.restore();
      }
    }
    // Two short, bounded petal breezes; no extra animation objects or confetti.
    if (!reduced) {
      for (const start of [8.5, 61.5]) {
        const t = (seconds - start) / 4.5;
        if (t < 0 || t > 1) continue;
        for (let i = 0; i < 4; i++) {
          c.save(); c.globalAlpha = Math.sin(t * Math.PI) * 0.5;
          c.translate(width * (t * 1.2 - 0.1) + i * 26, height * (0.42 + i * 0.07) + Math.sin(t * 5 + i) * 15); c.rotate(t * 4 + i);
          c.fillStyle = "#e4c16b"; c.beginPath(); c.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2); c.fill(); c.restore();
        }
      }
    }
    petals = petals.filter((p) => seconds - p.time < 2);
    for (const p of petals) {
      const t = (seconds - p.time) / 2;
      c.save(); c.globalAlpha = 1 - t; c.translate(p.x + (reduced ? 0 : Math.cos(p.seed * 2.4) * t * 55), p.y - (reduced ? 0 : t * 40)); c.rotate(p.seed + t);
      c.fillStyle = "#efcf75"; c.beginPath(); c.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2); c.fill(); c.restore();
    }
    c.globalAlpha = 1;
  };
  return { resize, draw, react };
}
