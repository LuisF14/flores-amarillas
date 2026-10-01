"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { GrowthStage } from "./Flower";

const messages = ["Así que te guardé una.", "Parece que está creciendo...", "Un poquito más...", "Ya casi...", "Las cosas bonitas toman su tiempo."];

export default function Message({ stage, revealed, count }: { stage: GrowthStage; revealed: boolean; count: number }) {
  return (
    <div className="message-area" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={revealed ? "revealed" : stage} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.35 }}>
          {revealed ? <>
            <p className="dedication">No podía mandártela desde Perú hasta México,<br className="desktop-break" /> así que hice que una creciera aquí para ti.</p>
            <p className="greeting">{count >= 4 ? "Bueno... quizá una sola era muy poco 💛" : "Feliz dia de las flores amarillas 💛"}</p>
          </> : <><p className="stage-message">{messages[stage]}</p><p className="stage-detail">{stage === 0 ? "Un toque tuyo, y empieza la magia." : stage < 4 ? "Dale otro toque. Todavía tiene una sorpresa." : "Un pequeño regalo, a punto de florecer."}</p></>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
