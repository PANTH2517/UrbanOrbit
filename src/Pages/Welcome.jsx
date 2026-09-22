import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import {
  Satellite,
  ArrowRight,
  MapPin,
  BarChart3,
  Shield,
  Radio,
  ChevronDown,
  Camera,
  ListChecks,
  CheckCircle2,
} from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { getActiveCity } from "../config/cities";
import useSmoothScroll from "../Components/useSmoothScroll";

const EASE = [0.22, 1, 0.36, 1];

/** A button that subtly follows the cursor within its own bounds - cheap,
 * dependency-free approximation of the "magnetic button" effect common on
 * award-winning sites. */
function MagneticButton({ children, className = "", onClick }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.3 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.3 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <Button size="lg" onClick={onClick} className={className}>
        {children}
      </Button>
    </motion.div>
  );
}

function FeatureRow({ feature, reverse, index }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-10 md:gap-16`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: reverse ? 8 : -8 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className="shrink-0"
      >
        <div
          className={`w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(56,242,255,0.25)] bg-gradient-to-br ${feature.gradient}`}
        >
          <Icon className="w-14 h-14 md:w-16 md:h-16 text-white" />
        </div>
      </motion.div>
      <div className="text-center md:text-left">
        <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3">{feature.title}</h3>
        <p className="text-slate-400 text-lg max-w-md">{feature.desc}</p>
      </div>
    </motion.div>
  );
}

function StepCard({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, delay: index * 0.15, ease: EASE }}
      className="uo-panel uo-panel-glow rounded-2xl p-8 relative"
    >
      <span className="text-5xl font-bold uo-gradient-text opacity-60">{step.num}</span>
      <h4 className="text-xl font-bold text-white mt-4 mb-2">{step.title}</h4>
      <p className="text-slate-400">{step.desc}</p>
    </motion.div>
  );
}

export default function Welcome() {
  useSmoothScroll();
  const navigate = useNavigate();
  const city = getActiveCity();
  const heroRef = useRef(null);

  // Mouse-parallax on the hero orbit graphic.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const orbitX = useTransform(springX, [-0.5, 0.5], [-24, 24]);
  const orbitY = useTransform(springY, [-0.5, 0.5], [-24, 24]);

  const handleHeroMouseMove = (e) => {
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  // Hero fades/scales/lifts out as you scroll past it.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const features = [
    {
      icon: MapPin,
      title: "Report in Seconds",
      desc: `Drop a pin anywhere in ${city.name}, add a photo, and your report goes live on the public map instantly.`,
      gradient: "from-cyan-400 via-blue-500 to-blue-600",
    },
    {
      icon: BarChart3,
      title: "Real Satellite Data",
      desc: "Heat-island and green-cover views pull directly from NASA MODIS/Terra imagery - genuine remote-sensing data, not a guess.",
      gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    },
    {
      icon: Shield,
      title: "Verified Officials Only",
      desc: "Every government account is manually reviewed and approved by an admin before it can touch a single report.",
      gradient: "from-blue-400 via-indigo-500 to-violet-600",
    },
  ];

  const steps = [
    { num: "01", title: "Spot an Issue", desc: "See a pothole, a broken streetlight, an overflowing drain? Open the map." },
    { num: "02", title: "Report It", desc: "Pin the location, add a photo, pick a category - takes under a minute." },
    { num: "03", title: "Track Progress", desc: "Watch it move from Pending to In Progress to Resolved, in public view." },
  ];

  return (
    <div className="relative text-white">
      <StarfieldBackground density={160} />

      {/* ---------------------------------------------------------------- HERO */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
      >
        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="max-w-4xl mx-auto">
          <motion.div style={{ x: orbitX, y: orbitY }} className="relative w-56 h-56 mx-auto mb-10">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-uo-orbit-slow" />
            <div className="absolute inset-6 rounded-full border border-violet-400/20 animate-uo-orbit-reverse" />
            <div className="absolute inset-12 rounded-full border border-blue-400/15 animate-uo-orbit-slow" style={{ animationDuration: "26s" }} />
            <div className="absolute inset-0 animate-uo-orbit">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_4px_rgba(56,242,255,0.6)]" />
            </div>
            <div className="absolute inset-6 animate-uo-orbit-reverse" style={{ animationDuration: "16s" }}>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_4px_rgba(162,89,255,0.6)]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-[0_0_60px_rgba(77,123,255,0.5)] animate-uo-float">
                <Satellite className="w-12 h-12 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-4"
          >
            Urban<span className="uo-gradient-text">Orbit</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-300 mb-12 font-light flex items-center justify-center gap-2"
          >
            <Radio className="w-5 h-5 text-cyan-400 animate-uo-twinkle" />
            From Satellite to Street: A User Journey
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <MagneticButton
              onClick={() => navigate("/RoleSelection")}
              className="uo-glow-btn px-12 py-4 text-lg font-semibold rounded-xl group"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-500 text-sm"
        >
          Scroll to explore
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------ FEATURES */}
      <section className="relative py-28 md:py-40 px-6">
        <div className="max-w-5xl mx-auto space-y-28 md:space-y-40">
          {features.map((feature, i) => (
            <FeatureRow key={feature.title} feature={feature} reverse={i % 2 === 1} index={i} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- HOW IT WORKS */}
      <section className="relative py-28 md:py-40 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-3">
              From Report to <span className="uo-gradient-text">Resolution</span>
            </h2>
            <p className="text-slate-400 text-lg">Three steps. Full transparency, start to finish.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- FINAL CTA */}
      <section className="relative py-32 md:py-48 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-2xl mx-auto"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to put {city.name} <span className="uo-gradient-text">on the map</span>?
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Empowering citizens and government officials to build better cities together.
          </p>
          <MagneticButton
            onClick={() => navigate("/RoleSelection")}
            className="uo-glow-btn px-12 py-4 text-lg font-semibold rounded-xl group"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </motion.div>
      </section>
    </div>
  );
}
