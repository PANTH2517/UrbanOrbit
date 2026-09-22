import React from "react";
import { motion } from "framer-motion";

/** A satellite that's drifted off its (broken, dashed) orbit and now
 * tumbles slowly in place - the 404 page's visual joke, built from the
 * same satellite vector as OrbitHero so it reads as part of one world. */
export default function LostSatellite() {
  return (
    <motion.svg
      viewBox="0 0 240 240"
      className="w-full h-full"
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="uo-lost-sat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38f2ff" />
          <stop offset="100%" stopColor="#a259ff" />
        </linearGradient>
      </defs>

      <motion.path
        d="M50 150 A 90 90 0 0 1 190 90"
        fill="none"
        stroke="rgba(125,170,255,0.3)"
        strokeWidth="1.5"
        strokeDasharray="3 8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {[
        [70, 170],
        [200, 60],
        [30, 60],
      ].map(([cx, cy], i) => (
        <motion.circle key={i} cx={cx} cy={cy} r="1.6" fill="#eaf1ff">
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + i}s`} repeatCount="indefinite" />
        </motion.circle>
      ))}

      <motion.g
        style={{ transformOrigin: "120px 130px" }}
        animate={{ rotate: [0, 12, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <g transform="translate(120 130)">
          <rect x="-14" y="-5" width="28" height="10" rx="2.5" fill="url(#uo-lost-sat)" />
          <rect x="-30" y="-8" width="12" height="16" rx="1.5" fill="#38f2ff" opacity="0.85" />
          <rect x="18" y="-8" width="12" height="16" rx="1.5" fill="#38f2ff" opacity="0.85" />
          <line x1="0" y1="-5" x2="-6" y2="-18" stroke="#eaf1ff" strokeWidth="1.4" />
          <circle cx="-6" cy="-18" r="2.4" fill="#eaf1ff" />
        </g>
      </motion.g>
    </motion.svg>
  );
}
