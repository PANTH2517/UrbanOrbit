import React from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

const lines = [
  { y: 58, w: 32 },
  { y: 70, w: 26 },
  { y: 82, w: 30 },
];

/** A verification-form vector badge: a clipboard whose checklist lines
 * tick themselves off one by one, echoing the review-and-approve flow
 * this page leads into. */
export default function ClipboardBadge() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-clip-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="62"
        r="34"
        fill="none"
        stroke="rgba(232,121,249,0.3)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.6, 0.2], scale: [0.8, 1.15, 1.15] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <motion.rect
        x="35"
        y="34"
        width="50"
        height="60"
        rx="6"
        fill="url(#uo-clip-grad)"
        fillOpacity="0.92"
        initial={{ opacity: 0, y: 42 }}
        animate={{ opacity: 1, y: 34 }}
        transition={{ duration: 0.5, ease: EASE }}
      />
      <rect x="48" y="28" width="24" height="10" rx="3" fill="#eaf1ff" />

      {lines.map((line, i) => (
        <g key={line.y}>
          <motion.path
            d={`M42 ${line.y} l3 3 l6-6`}
            fill="none"
            stroke="#05070f"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.6 + i * 0.35, ease: EASE }}
          />
          <motion.rect
            x="56"
            y={line.y - 2}
            height="3.5"
            rx="1.5"
            fill="#05070f"
            fillOpacity="0.55"
            initial={{ width: 0 }}
            animate={{ width: line.w }}
            transition={{ duration: 0.3, delay: 0.75 + i * 0.35, ease: EASE }}
          />
        </g>
      ))}
    </svg>
  );
}
