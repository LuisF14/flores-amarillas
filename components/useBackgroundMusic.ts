"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type SafariWindow = Window & { webkitAudioContext?: typeof AudioContext };
export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const engine = useRef<{ context: AudioContext; gain: GainNode; source: MediaElementAudioSourceNode } | null>(null);
  const [enabled, setEnabled] = useState(false), [started, setStarted] = useState(false);
  const [volume, setVolumeState] = useState(0.55);
  const level = useRef(0.55), previousLevel = useRef(0.55);
  const mounted = useRef(false), desired = useRef(false), revision = useRef(0), frame = useRef(0);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useCallback((audible: boolean, duration: number) => {
    cancelAnimationFrame(frame.current);
    const audio = audioRef.current;
    if (!audio) return;
    // The slider writes audio.volume directly. Gain is only the fade envelope,
    // or the volume fallback on browsers that ignore media.volume (iOS).
    if (engine.current) {
      const { gain, context } = engine.current, now = context.currentTime;
      const target = audible ? (Math.abs(audio.volume - level.current) < 0.01 ? 1 : level.current) : 0;
      if (typeof gain.gain.cancelAndHoldAtTime === "function") gain.gain.cancelAndHoldAtTime(now);
      else { const value = gain.gain.value; gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(value, now); }
      gain.gain.linearRampToValueAtTime(target, now + duration / 1000);
    } else {
      const from = audio.volume, begin = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - begin) / duration);
        audio.volume = from + ((audible ? level.current : 0) - from) * t;
        if (t < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }
  }, []);
  const setPlaying = useCallback((next: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++revision.current;
    desired.current = next;
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    if (!next) {
      fade(false, 350);
      pauseTimer.current = setTimeout(() => { if (!desired.current) audio.pause(); }, 380);
      return;
    }
    const reject = (error: unknown) => {
      if (request !== revision.current) return;
      console.warn("[AUDIO] No se pudo iniciar la reproducción", error);
      desired.current = false; audio.pause(); setEnabled(false);
    };
    try {
      audio.volume = level.current;
      if (!engine.current) {
        const Constructor = window.AudioContext || (window as SafariWindow).webkitAudioContext;
        if (Constructor) {
          const context = new Constructor(), gain = context.createGain(); gain.gain.value = 0;
          const source = context.createMediaElementSource(audio); source.connect(gain); gain.connect(context.destination);
          engine.current = { context, gain, source };
        } else audio.volume = 0;
      }
      if (audio.error) audio.load();
      // Called synchronously by the button/range gesture, never by an effect.
      const resume = engine.current?.context.resume(), play = audio.play();
      void Promise.all([play, resume]).then(() => {
        if (request !== revision.current || !desired.current || audio.paused) return;
        setStarted(true); setEnabled(true); fade(true, 900);
      }).catch(reject);
    } catch (error) { reject(error); }
  }, [fade]);
  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    level.current = next; setVolumeState(next);
    if (next > 0) previousLevel.current = next;
    if (audioRef.current) audioRef.current.volume = next;
    if (next === 0) setPlaying(false);
    else if (!desired.current) setPlaying(true);
    else if (engine.current) fade(true, 80);
  }, [fade, setPlaying]);
  const toggle = useCallback(() => {
    if (!desired.current || level.current === 0) {
      if (level.current === 0) { level.current = previousLevel.current; setVolumeState(level.current); }
      setPlaying(true);
    } else setPlaying(false);
  }, [setPlaying]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    mounted.current = true; audio.volume = level.current;
    const pause = () => { setEnabled(false); desired.current = false; };
    const error = () => { console.warn("[AUDIO] Archivo no disponible", audio.error); pause(); };
    audio.addEventListener("pause", pause); audio.addEventListener("error", error);
    const invalidate = () => { revision.current++; };
    return () => {
      mounted.current = false; invalidate(); desired.current = false; cancelAnimationFrame(frame.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
      audio.removeEventListener("pause", pause); audio.removeEventListener("error", error); audio.pause();
      queueMicrotask(() => {
        if (mounted.current || !engine.current) return;
        const { context, source, gain } = engine.current;
        source.disconnect(); gain.disconnect(); void context.close().catch(() => {}); engine.current = null;
      });
    };
  }, []);
  return { audioRef, enabled: enabled && volume > 0, started, volume, setVolume, toggle };
}
