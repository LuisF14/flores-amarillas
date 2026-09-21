"use client";
import { useEffect, useRef, useState } from "react";
export default function SoundButton({ enabled, started, volume, onVolume, onToggle }: { enabled: boolean; started: boolean; volume: number; onVolume: (value: number) => void; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const control = useRef<HTMLDivElement>(null), button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!control.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className="music-control" ref={control} onClick={event => event.stopPropagation()} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    {open && <div id="music-volume" className="music-panel" role="group" aria-label="Volumen de la música">
      <button className="music-mute" onClick={onToggle} aria-label={enabled ? "Silenciar música" : "Reactivar música"} aria-pressed={!enabled}>{enabled ? "🔊" : "🔇"}</button>
      <input aria-label="Volumen" type="range" min="0" max="1" step="0.01" value={volume} aria-valuetext={`${Math.round(volume * 100)}%`} onChange={event => onVolume(Number(event.target.value))} />
      <output aria-hidden="true">{Math.round(volume * 100)}%</output>
    </div>}
    <button ref={button} className="sound-button music-toggle" onClick={() => { if (!enabled) onToggle(); setOpen(value => !value); }} aria-label={started ? "Ajustar música" : "Activar música"} aria-expanded={open} aria-controls="music-volume" aria-pressed={enabled}>
      <span>{enabled ? "🔊 Música activada" : started ? "🔇 Música silenciada" : "🎵 Música"}</span>
    </button>
  </div>;
}
