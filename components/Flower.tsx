"use client";

import { motion } from "framer-motion";
import { useId, type CSSProperties } from "react";

export type GrowthStage = 0 | 1 | 2 | 3 | 4;

type FlowerProps = {
  stage: GrowthStage;
  miniature?: boolean;
  reducedMotion?: boolean;
};

/** Every petal, leaf and stem is a separate, animated SVG element. */
export default function Flower({ stage, miniature = false, reducedMotion = false }: FlowerProps) {
  const id = useId().replace(/:/g, "");
  const growth = [0, 0.27, 0.65, 1, 1][stage];
  const duration = reducedMotion ? 0 : miniature ? 0.85 : 1.15;
  const flowerY = 365 - 255 * growth;
  const open = stage === 4;

  return (
    <svg viewBox="0 0 300 410" className="flower-svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-petal`} x1="0" y1="0" x2="0.75" y2="1">
          <stop stopColor="#fff1a4" />
          <stop offset="0.4" stopColor="#f5d46b" />
          <stop offset="1" stopColor="#dba635" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#9aaf75" /><stop offset="1" stopColor="#577349" />
        </linearGradient>
        <radialGradient id={`${id}-heart`} cx="40%" cy="35%">
          <stop stopColor="#ac8036" /><stop offset="1" stopColor="#755226" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#fbe8a2" stopOpacity="0.6" /><stop offset="1" stopColor="#fbe8a2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={open ? "flower-sway" : undefined} style={{ "--sway-time": miniature ? "7s" : "8s" } as CSSProperties}>
        <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: growth }} transition={{ duration, ease: [0.22, 1, 0.36, 1] }} style={{ originX: "150px", originY: "365px" }}>
          <path d="M150 365 C143 309 160 274 152 231 C148 194 143 147 150 110" stroke="#658153" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M149 361 C145 309 158 272 150 231 C146 191 143 154 149 122" stroke="#a1b17b" strokeWidth="1.3" fill="none" />
          <motion.g initial={{ scale: 0, rotate: -25 }} animate={{ scale: stage >= 2 ? 1 : 0, rotate: 0 }} transition={{ duration, delay: reducedMotion ? 0 : 0.12 }} style={{ originX: "151px", originY: "283px" }}>
            <g className="leaf-drift leaf-left">
              <path d="M151 285 C126 285 96 269 93 238 C124 238 150 253 151 285Z" fill={`url(#${id}-leaf)`} />
              <path d="M151 285 Q124 261 100 244" stroke="#d8dfb8" strokeOpacity="0.65" strokeWidth="1" fill="none" />
            </g>
          </motion.g>
          <motion.g initial={{ scale: 0, rotate: 25 }} animate={{ scale: stage >= 2 ? 1 : 0, rotate: 0 }} transition={{ duration, delay: reducedMotion ? 0 : 0.28 }} style={{ originX: "151px", originY: "234px" }}>
            <g className="leaf-drift leaf-right">
              <path d="M151 235 C152 208 177 189 206 190 C202 220 178 238 151 235Z" fill={`url(#${id}-leaf)`} />
              <path d="M151 235 Q174 210 199 196" stroke="#d8dfb8" strokeOpacity="0.65" strokeWidth="1" fill="none" />
            </g>
          </motion.g>
          <motion.path d="M147 190 C130 187 119 174 122 158 C138 161 148 174 147 190Z" fill={`url(#${id}-leaf)`} initial={{ scale: 0 }} animate={{ scale: stage >= 3 ? 1 : 0 }} transition={{ duration, delay: reducedMotion ? 0 : 0.3 }} style={{ originX: "147px", originY: "190px" }} />
        </motion.g>
        <motion.g initial={{ y: 255 }} animate={{ y: flowerY - 110 }} transition={{ duration, ease: [0.22, 1, 0.36, 1] }}>
          <motion.circle cx="150" cy="110" r="111" fill={`url(#${id}-glow)`} initial={{ opacity: 0 }} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 2 }} />
          <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: stage >= 3 && !open ? 1 : 0, opacity: stage >= 3 && !open ? 1 : 0 }} transition={{ duration: duration * 0.6 }} style={{ originX: "150px", originY: "120px" }}>
            <path d="M150 120 C127 112 131 83 148 73 C167 82 175 111 150 120Z" fill={`url(#${id}-petal)`} />
            <path d="M150 120 Q145 94 148 78 M150 120 Q163 98 151 79" fill="none" stroke="#cba648" strokeWidth="1" opacity="0.5" />
            <path d="M150 125 Q134 118 134 104 Q146 111 150 117 Q156 108 166 104 Q162 121 150 125Z" fill="#718b55" />
          </motion.g>
          {[0, 1].map((layer) => (
            <g key={layer}>
              {Array.from({ length: layer === 0 ? 13 : 10 }, (_, i) => {
                const count = layer === 0 ? 13 : 10;
                const angle = i * (360 / count) + layer * 14;
                return (
                  <g key={i} transform={`translate(150 110) rotate(${angle})`}>
                    <motion.g initial={{ scaleY: 0.08, scaleX: 0, opacity: 0 }} animate={{ scaleY: open ? 1 : 0.08, scaleX: open ? 1 : 0, opacity: open ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : miniature ? 0.8 : 1.6, delay: reducedMotion ? 0 : (miniature ? 0.4 : 0.1) + layer * 0.16 + i * 0.035, ease: [0.16, 1, 0.3, 1] }}>
                      <path d={layer === 0 ? "M0 5 C-11-6-22-39-13-61 C-7-79 7-79 14-62 C23-41 11-9 0 5Z" : "M0 3 C-9-7-17-29-10-48 C-5-62 7-61 12-46 C18-27 9-6 0 3Z"} fill={`url(#${id}-petal)`} stroke="#dbaf46" strokeWidth="0.55" />
                      <path d={layer === 0 ? "M0-9 Q-3-36 0-64" : "M0-8 Q-2-28 1-49"} fill="none" stroke="#fff2b7" strokeOpacity="0.7" strokeWidth="0.85" />
                    </motion.g>
                  </g>
                );
              })}
            </g>
          ))}
          <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: open ? 1 : 0, opacity: open ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : miniature ? 0.55 : 0.4 }} style={{ originX: "150px", originY: "110px" }}>
            <circle cx="150" cy="110" r="19" fill={`url(#${id}-heart)`} />
            {Array.from({ length: 55 }, (_, i) => {
              const angle = i * 2.39996;
              const radius = Math.sqrt(i) * 2.2;
              return <circle key={i} cx={150 + Math.cos(angle) * radius} cy={110 + Math.sin(angle) * radius} r={1.05} fill={i % 3 === 0 ? "#e4be64" : "#d1a456"} opacity="0.75" />;
            })}
          </motion.g>
        </motion.g>
      </g>
    </svg>
  );
}
