"use client";

import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Garden, { MAX_FLOWERS } from "./Garden";
import Message from "./Message";
import SoundButton from "./SoundButton";
import { useBackgroundMusic } from "./useBackgroundMusic";
import FlowerField from "./FlowerField";
import InfiniteGarden from "./InfiniteGarden";
import type { EntryGarden } from "./journeyScene";
import type { GrowthStage } from "./Flower";

function LittleFlower({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.2">{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="16" cy="9" rx="2.8" ry="5.8" transform={`rotate(${i * 45} 16 16)`} />)}<circle cx="16" cy="16" r="3.7" fill="var(--paper)" /></g></svg>;
}

export default function GrowingFlower() {
  const [stage, setStage] = useState<GrowthStage>(0);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [fieldReady, setFieldReady] = useState(false);
  const [travel, setTravel] = useState(false);
  const [entered, setEntered] = useState(false);
  const [entry, setEntry] = useState<EntryGarden | null>(null);
  const experience = useRef<HTMLElement>(null);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const { audioRef, enabled, started, volume, setVolume, toggle } = useBackgroundMusic();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const beginTravel = () => {
    const current = experience.current?.querySelector<HTMLCanvasElement>(".flower-field canvas");
    if (current) {
      const bounds = current.getBoundingClientRect();
      const image = document.createElement("canvas");
      image.width = current.width; image.height = current.height;
      image.getContext("2d")?.drawImage(current, 0, 0);
      setEntry({ image, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
    }
    setTravel(true);
  };

  const grow = useCallback(() => {
    if (locked.current || surprise || (stage === 4 && !revealed)) return;

    if (revealed && count >= MAX_FLOWERS) {
      setSurprise(true);
      return;
    }
    locked.current = true;
    setBusy(true);
    if (stage < 4) {
      const next = (stage + 1) as GrowthStage;
      setStage(next);
      // The last petal opens by 2.12s; leave a further second before the note.
      timer.current = setTimeout(() => {
        if (next === 4) setRevealed(true);
        setBusy(false);
        locked.current = false;
      }, reducedMotion ? (next === 4 ? 1000 : 120) : next === 4 ? 3250 : 1250);
    } else {
      setCount((current) => Math.min(current + 1, MAX_FLOWERS));
      timer.current = setTimeout(() => { setBusy(false); locked.current = false; }, reducedMotion ? 120 : 1100);
    }
  }, [stage, revealed, count, reducedMotion, surprise]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || (event.key !== "Enter" && event.key !== " ")) return;
      if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      grow();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [grow]);

  return (
    <MotionConfig reducedMotion="user">
      <main className={`gift-page ${surprise ? "field-active" : ""} ${travel ? "journey-active" : ""}`}>
        <div className="page-frame" aria-hidden="true" />
        <header className="page-header flex items-center justify-between gap-4">
          <div className="wordmark flex items-center gap-2.5"><LittleFlower /><span>un pequeño detalle</span></div>
          <div className="date-mark"><span className="date-day">21</span><span className="date-month">SEPTIEMBRE</span></div>
        </header>

        <section ref={experience} className="experience" aria-label="Haz crecer tu flor amarilla" inert={travel} aria-hidden={travel}>
          <div className="intro">
            <p className="eyebrow"><span />PARA ALEGRARTE EL DÍA<span /></p>
            <motion.h1 key={revealed ? "final" : "intro"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              {revealed ? <>Una flor amarilla<br /><em>para ti.</em></> : <>Te guardé un poquito<br /><em>de sol.</em></>}
            </motion.h1>
            <p className="intro-note">{revealed ? "Hay distancias que un pequeño detalle puede cruzar." : <>Dicen que el 21 de septiembre<br className="mobile-break" /> se regalan flores amarillas...</>}</p>
          </div>

          {!surprise && <Garden stage={stage} count={count} busy={busy} reducedMotion={reducedMotion} onGrow={grow} />}
          <Message stage={stage} revealed={revealed} count={count} />

          {!surprise && <div className="interaction-controls">
            <button className="grow-button inline-flex items-center justify-center gap-2.5 transition-colors" onClick={grow} aria-disabled={busy} aria-label={revealed ? count >= MAX_FLOWERS ? "¿Y si fueran muchas más?" : "Una más: añadir otra flor" : stage === 0 ? "Tócala: hacer germinar la semilla" : "Seguir haciendo crecer la flor"}>
              {revealed ? <LittleFlower /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><path d="M12 20V10m0 6C4 16 4 9 4 9s8-1 8 7Zm0-4c0-7 8-8 8-8s0 8-8 8Z" /></svg>}
              <motion.span key={revealed && count >= MAX_FLOWERS ? "surprise" : "grow"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>{revealed ? count >= MAX_FLOWERS ? "¿Y si fueran muchas más? ✨" : "Una más" : stage === 0 ? "Tócala" : stage === 4 ? "Floreciendo..." : "Otro toquecito"}</motion.span>
              {!revealed && stage < 4 && <span className="button-plus" aria-hidden="true">+</span>}
            </button>
            {revealed ? <p className="garden-count" aria-live="polite">{`${count} ${count === 1 ? "flor" : "flores"} · un poquito más de alegría`}</p> : <div className="progress-row" aria-label={`${stage} de 4 etapas completadas`}><div className="progress-dots" aria-hidden="true">{[1, 2, 3, 4].map((dot) => <span key={dot} className={stage >= dot ? "filled" : ""} />)}</div><span>Las cosas bonitas, poquito a poquito.</span></div>}
          </div>}
          {surprise && <>
            <div className="surprise-note" aria-live="polite">
              {fieldReady && <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 1.4 }}><h2>Creo que una sola no era suficiente 💛</h2><p>Así está un poquito mejor.</p></motion.div>}
            </div>
            {!entered && <FlowerField reducedMotion={reducedMotion} onComplete={() => setFieldReady(true)} />}
            {fieldReady && !travel && <motion.button className="journey-invite" initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 1 }} onClick={beginTravel}>Hay algo más ✨</motion.button>}
          </>}
        </section>

        <footer className="page-footer flex items-center justify-between gap-4">
          <div className="journey"><span>PERÚ</span><span className="journey-line" /><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 12 18-8-7 17-3-7-8-2Z M11 14 21 4" /></svg><span className="journey-line" /><span>MÉXICO</span><span className="with-care">con cariño</span></div>
        </footer>
        {travel && <InfiniteGarden entry={entry} reducedMotion={reducedMotion} onEntered={() => setEntered(true)} />}
        <audio ref={audioRef} src="/audio/vienna.mp3" preload="auto" loop playsInline />
        <SoundButton enabled={enabled} started={started} volume={volume} onVolume={setVolume} onToggle={toggle} />
        <noscript><p className="noscript-note">Esta flor necesita JavaScript para crecer. Actívalo y vuelve a cargar la página. Feliz 21 de septiembre 💛</p></noscript>
      </main>
    </MotionConfig>
  );
}


