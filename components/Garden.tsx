"use client";

import Flower, { type GrowthStage } from "./Flower";
import FloatingParticles from "./FloatingParticles";
import type { CSSProperties } from "react";

export const MAX_FLOWERS = 5;
const positions = [
  { x: -64, scale: 0.77, tilt: -14 },
  { x: 63, scale: 0.87, tilt: 12 },
  { x: -116, scale: 0.63, tilt: -19 },
  { x: 117, scale: 0.66, tilt: 20 },
  { x: -34, scale: 0.6, tilt: -7 },
  { x: 36, scale: 0.58, tilt: 7 },
  { x: -92, scale: 0.94, tilt: -8 },
  { x: 94, scale: 0.98, tilt: 9 },
  { x: 4, scale: 0.73, tilt: -5 },
];

type GardenProps = {
  stage: GrowthStage;
  count: number;
  busy: boolean;
  reducedMotion: boolean;
  onGrow: () => void;
};

export default function Garden({ stage, count, busy, reducedMotion, onGrow }: GardenProps) {
  return (
    <div className={`garden-scene stage-${stage}`}>
      <div className="sun-halo" aria-hidden="true" />
      <div className="orbit orbit-outer" aria-hidden="true" />
      <div className="orbit orbit-inner" aria-hidden="true" />
      <FloatingParticles burst={stage + count - 1} />
      <div className="garden-art" aria-hidden="true">
        <svg className="soil" viewBox="0 0 460 62">
          <defs><radialGradient id="soil-shadow"><stop stopColor="#c8b991" stopOpacity="0.27" /><stop offset="1" stopColor="#d9cdb0" stopOpacity="0" /></radialGradient></defs>
          <ellipse cx="230" cy="31" rx="221" ry="29" fill="url(#soil-shadow)" />
          <path d="M123 30 Q163 27 190 30 Q214 19 235 25 Q258 20 279 29 Q305 26 338 30" fill="none" stroke="#c1b397" strokeWidth="1.1" strokeLinecap="round" />
          {[174, 196, 215, 244, 262, 283, 305].map((x, i) => <ellipse key={x} cx={x} cy={30 + (i % 3) * 3} rx={i % 2 ? 1.8 : 1.2} ry="0.9" fill="#b6a584" opacity="0.65" />)}
        </svg>
        {positions.slice(0, count - 1).map((position, i) => (
          <div key={i} className="extra-flower" style={{ "--offset": `${position.x}px`, "--scale": position.scale, "--tilt": `${position.tilt}deg`, zIndex: position.scale > 0.9 ? 1 : 3 } as CSSProperties}>
            <Flower stage={4} miniature reducedMotion={reducedMotion} />
          </div>
        ))}
        <div className="main-flower"><Flower stage={stage} reducedMotion={reducedMotion} /></div>
        <div className={`seed ${stage > 0 ? "seed-planted" : ""}`}><span /></div>
        {stage === 0 && <div className="seed-caption"><span>todo empieza con algo pequeñito</span><svg viewBox="0 0 47 45"><path d="M4 3 Q40 6 32 36 M25 30 L32 38 L40 31" /></svg></div>}
      </div>
      {stage < 4 && <button className="garden-touch" onClick={onGrow} aria-label={stage === 0 ? "Tocar la semilla" : "Tocar la planta para hacerla crecer"} aria-disabled={busy} tabIndex={-1} />}
    </div>
  );
}
