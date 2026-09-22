import { useEffect } from "react";
import Lenis from "lenis";

/** Buttery smooth-scroll for a page using native document scroll (bare
 * pages like Welcome.jsx - Layout.jsx's sidebar pages use their own
 * internal overflow-auto container instead, so this isn't wired there). */
export default function useSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
