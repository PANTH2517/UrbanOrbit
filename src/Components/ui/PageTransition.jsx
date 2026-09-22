import React from "react";
import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      // h-full, not min-h-full: min-height doesn't count as a "definite"
      // height for CSS purposes, so any page using percentage-based flex
      // children (height: 100%, h-full) to fill available space couldn't
      // resolve against this wrapper - they'd collapse to content size
      // instead of stretching. A page with more content than the viewport
      // still scrolls correctly either way (overflow: visible here just
      // lets it spill past this box, which the ancestor's overflow-auto
      // still measures and scrolls).
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
