"use client";
import { useEffect, useRef, useState } from "react";
import { createJourneyScene, JOURNEY_END, THOUGHTS, THOUGHT_TIMES, clamp, smooth, type EntryGarden } from "./journeyScene";

export default function InfiniteGarden({ entry, reducedMotion, onEntered }: { entry: EntryGarden | null; reducedMotion: boolean; onEntered: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), thought = useRef<HTMLParagraphElement>(null), end = useRef<HTMLDivElement>(null);
  const onEnteredRef = useRef(onEntered);
  const progress = useRef(0), elapsed = useRef(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => { onEnteredRef.current = onEntered; }, [onEntered]);
  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const scene = createJourneyScene(surface, entry);
    if (!scene) return;
    let frame = 0, last = 0, painted = 0, seconds = elapsed.current, boost = 0, mouseX = 0, mouseY = 0;
    let entered = false, currentMessage = -1, finalAge = 0, finalStep = 0;
    let pointer: { x: number; y: number } | null = null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    surface.focus({ preventScroll: true });
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now; seconds += dt; elapsed.current = seconds; boost *= Math.exp(-dt * 0.6);
      const entrance = clamp(seconds / (reducedMotion ? 1.4 : 3.5));
      if (entrance >= 1 && !entered) { entered = true; onEnteredRef.current(); }
      if (entered && seconds < 59 && progress.current < JOURNEY_END) {
        const slow = 1 - smooth((seconds - 51) / 8);
        progress.current = Math.min(JOURNEY_END, progress.current + dt * 0.95 * slow * (1 + boost));
      }
      const distance = progress.current;
      finalAge = Math.max(0, seconds - 56);
      if (now - painted > (reducedMotion ? 100 : 32)) {
        scene.draw(distance, seconds, entrance, mouseX, mouseY, reducedMotion);
        painted = now;
        const message = THOUGHT_TIMES.findIndex((start) => seconds >= start && seconds < start + 4.5);
        if (thought.current) {
          const t = message < 0 ? 0 : (seconds - THOUGHT_TIMES[message]) / 4.5;
          thought.current.style.opacity = message < 0 ? "0" : String(smooth(t / 0.12) * (1 - smooth((t - 0.82) / 0.18)));
          const mobile = surface.clientWidth < 600;
          const positions = mobile ? [36, 64, 44, 62, 37, 54] : [30, 70, 44, 68, 33, 56];
          thought.current.style.left = positions[Math.max(0, message) % positions.length] + "%";
          thought.current.style.top = (message % 3 === 0 ? 53 : message % 3 === 1 ? 61 : 48) + "%";
          thought.current.style.filter = reducedMotion ? "none" : `blur(${Math.max(0, 0.6 - t * 2, (t - 0.8) * 2)}px)`;
          thought.current.style.transform = `translate(-50%, -50%) translateY(${reducedMotion ? 0 : -12 + t * 35}px) scale(${reducedMotion ? 1 : 0.87 + t * 0.2})`;
          if (message !== currentMessage) {
            thought.current.textContent = message >= 0 ? THOUGHTS[message] : "";
            if (message >= 0) setAnnouncement(THOUGHTS[message]);
            currentMessage = message;
          }
        }
        if (end.current) {
          const children = Array.from(end.current.children) as HTMLElement[];
          children.forEach((el, i) => { el.style.opacity = String(smooth((finalAge - [0, 3, 5.5][i]) / 1)); });
          const step = finalAge > 5.5 ? 3 : finalAge > 3 ? 2 : finalAge > 0 ? 1 : 0;
          if (step !== finalStep) { finalStep = step; setAnnouncement(["", "No hay prisa.", "Sigue floreciendo a tu tiempo. 💛", "Feliz 21 de septiembre."][step]); }
        }
        surface.dataset.distance = distance.toFixed(2);
        surface.dataset.elapsed = seconds.toFixed(2);
        surface.dataset.phase = finalAge > 0 ? "rest" : entered ? "travel" : "entering";
      }
      frame = requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else wake(); };
    const wheel = (event: WheelEvent) => { event.preventDefault(); boost = clamp(boost + Math.abs(event.deltaY) / 500, 0, 1.1); };
    const down = (event: PointerEvent) => { if (event.isPrimary && event.button === 0) pointer = { x: event.clientX, y: event.clientY }; };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "mouse") { mouseX = (event.clientX / window.innerWidth - 0.5) * 2; mouseY = (event.clientY / window.innerHeight - 0.5) * 2; }
    };
    const up = (event: PointerEvent) => {
      if (!pointer) return;
      const dy = pointer.y - event.clientY, dx = pointer.x - event.clientX;
      if (dy > 15 && event.pointerType !== "mouse") boost = clamp(boost + dy / 250, 0, 1.1);
      else if (Math.hypot(dx, dy) < 12) scene.react(event.clientX, event.clientY, seconds);
      pointer = null;
    };
    const cancel = () => { pointer = null; mouseX = 0; mouseY = 0; };
    const key = (event: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", " ", "Enter"].includes(event.key)) { event.preventDefault(); boost = clamp(boost + 0.25, 0, 1.1); } };
    const observer = new ResizeObserver(scene.resize); observer.observe(surface); scene.resize();
    surface.addEventListener("wheel", wheel, { passive: false }); surface.addEventListener("pointerdown", down); surface.addEventListener("pointermove", move); surface.addEventListener("pointerup", up); surface.addEventListener("pointercancel", cancel); surface.addEventListener("pointerleave", cancel); surface.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility); wake();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); document.body.style.overflow = previousOverflow;
      surface.removeEventListener("wheel", wheel); surface.removeEventListener("pointerdown", down); surface.removeEventListener("pointermove", move); surface.removeEventListener("pointerup", up); surface.removeEventListener("pointercancel", cancel); surface.removeEventListener("pointerleave", cancel); surface.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", visibility);
    };
  }, [entry, reducedMotion]);
  return <section className="infinite-garden" aria-label="Un viaje por el jardín infinito">
    <canvas ref={canvas} tabIndex={0} aria-label="Campo de flores. Desliza hacia arriba, usa la rueda o las flechas para avanzar un poco más rápido. Toca las flores para soltar pétalos." />
    <p className="journey-thought" ref={thought} aria-hidden="true" />
    <div className="journey-finale" ref={end} aria-hidden="true"><h2>No hay prisa.</h2><p>Sigue floreciendo a tu tiempo. 💛</p><small>Feliz 21 de septiembre.</small></div>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
  </section>;
}

