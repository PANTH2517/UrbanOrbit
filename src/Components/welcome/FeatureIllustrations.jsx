import React from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** A pin drops in with a spring bounce, then a radar ping loops from its base. */
export function PinDropIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-pin-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fd9ff" />
          <stop offset="100%" stopColor="#4d7bff" />
        </linearGradient>
      </defs>

      <motion.ellipse
        cx="60"
        cy="94"
        rx="14"
        ry="4"
        fill="#38f2ff"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: [0, 0.35, 0.15] }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.6 }}
      />
      <motion.circle
        cx="60"
        cy="94"
        r="6"
        fill="none"
        stroke="#38f2ff"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: [0, 0.7, 0], scale: [0.6, 2.6, 2.6] }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 1.8, repeat: Infinity, repeatDelay: 0.6, ease: "easeOut" }}
      />

      <motion.g
        initial={{ y: -46, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
      >
        <path
          d="M60 30c-11 0-20 8.7-20 19.4C40 63 60 84 60 84s20-21 20-34.6C80 38.7 71 30 60 30z"
          fill="url(#uo-pin-grad)"
        />
        <circle cx="60" cy="49" r="7.5" fill="#05070f" opacity="0.85" />
      </motion.g>
    </svg>
  );
}

/** Vertical bars grow from a baseline while a scan-line sweeps the frame. */
export function SatelliteDataIllustration() {
  const bars = [
    { x: 30, h: 26 },
    { x: 44, h: 42 },
    { x: 58, h: 18 },
    { x: 72, h: 50 },
    { x: 86, h: 32 },
  ];
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-bar-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#a259ff" />
          <stop offset="100%" stopColor="#ff5ec4" />
        </linearGradient>
        <linearGradient id="uo-scan-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a259ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#a259ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a259ff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="uo-frame-clip">
          <rect x="22" y="22" width="76" height="70" rx="4" />
        </clipPath>
      </defs>

      <rect x="22" y="22" width="76" height="70" rx="4" fill="none" stroke="rgba(162,89,255,0.3)" strokeWidth="1" />

      <g clipPath="url(#uo-frame-clip)">
        {bars.map((bar, i) => (
          <motion.rect
            key={bar.x}
            x={bar.x}
            width="8"
            rx="1.5"
            fill="url(#uo-bar-grad)"
            initial={{ y: 92, height: 0 }}
            whileInView={{ y: 92 - bar.h, height: bar.h }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.1 * i, ease: EASE }}
          />
        ))}
        <motion.rect
          x="18"
          width="86"
          height="18"
          fill="url(#uo-scan-grad)"
          initial={{ y: 20 }}
          whileInView={{ y: [20, 88, 20] }}
          viewport={{ once: true }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
      </g>
    </svg>
  );
}

/** A shield outline draws itself in, then a checkmark follows inside it. */
export function ShieldIllustration() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-shield-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d7bff" />
          <stop offset="100%" stopColor="#a259ff" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="58"
        r="34"
        fill="none"
        stroke="rgba(77,123,255,0.3)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: [0, 0.6, 0.2], scale: [0.8, 1.15, 1.15] }}
        viewport={{ once: true }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <motion.path
        d="M60 26 L86 36 V58 C86 76 75 88 60 94 C45 88 34 76 34 58 V36 Z"
        fill="url(#uo-shield-grad)"
        fillOpacity="0.9"
        stroke="#eaf1ff"
        strokeWidth="1"
        strokeOpacity="0.4"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <motion.path
        d="M48 59 L57 68 L74 47"
        fill="none"
        stroke="#eaf1ff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: 0.85, ease: EASE }}
      />
    </svg>
  );
}
