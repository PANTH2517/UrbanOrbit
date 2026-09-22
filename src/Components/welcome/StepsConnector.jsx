import React from "react";
import { motion } from "framer-motion";

/** Decorative flowing line behind the "how it works" step cards, with a
 * small pulse traveling along it to suggest progress from step to step.
 * md+ only - a 3-column horizontal flow doesn't make sense once the grid
 * collapses to a single column on small screens. */
export default function StepsConnector() {
  const path = "M 40 50 C 220 -10, 450 110, 630 50 S 940 -10, 960 50";

  return (
    <svg
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      className="hidden md:block absolute left-0 right-0 top-10 w-full h-16 -z-10 pointer-events-none"
    >
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(125,170,255,0.25)"
        strokeWidth="1.5"
        strokeDasharray="5 7"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.circle
        r="4"
        fill="#38f2ff"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2 }}
      >
        <animateMotion path={path} dur="4s" repeatCount="indefinite" begin="1.2s" />
      </motion.circle>
    </svg>
  );
}
