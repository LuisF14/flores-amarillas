import type { CSSProperties } from "react";

export default function FloatingParticles({ burst = 0 }: { burst?: number }) {
  return (
    <div className="particles" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} className="mote" style={{ "--left": `${9 + (i * 37) % 84}%`, "--top": `${12 + (i * 23) % 72}%`, "--delay": `${i * -1.7}s`, "--duration": `${9 + i % 5}s` } as CSSProperties} />
      ))}
      {burst > 0 && <div key={burst} className="burst">{Array.from({ length: 12 }, (_, i) => (
        <i className={i % 3 === 0 ? "spark petal-spark" : "spark"} key={i} style={{ "--x": `${Math.cos(i * 2.4) * (65 + i * 7)}px`, "--y": `${-40 - (i * 29) % 180}px`, "--delay": `${i * 0.045}s`, "--turn": `${i * 37}deg` } as CSSProperties} />
      ))}</div>}
    </div>
  );
}
