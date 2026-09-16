import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/button";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import { Satellite, ArrowRight, MapPin, Shield, BarChart3, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { getActiveCity } from "../config/cities";

export default function Welcome() {
  const navigate = useNavigate();
  const city = getActiveCity();

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <StarfieldBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Orbit hero graphic */}
          <div className="relative w-56 h-56 mx-auto mb-10">
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-uo-orbit-slow" />
            <div className="absolute inset-6 rounded-full border border-violet-400/20 animate-uo-orbit-reverse" />
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
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-3">
            Urban<span className="uo-gradient-text">Orbit</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl text-slate-300 mb-14 font-light flex items-center justify-center gap-2"
          >
            <Radio className="w-5 h-5 text-cyan-400 animate-uo-twinkle" />
            From Satellite to Street: A User Journey
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid md:grid-cols-3 gap-5 mb-14 max-w-3xl mx-auto"
          >
            {[
              { icon: MapPin, title: "Location Tracking", desc: `Precise mapping of urban issues across ${city.name}`, color: "text-cyan-400" },
              { icon: BarChart3, title: "Real-time Analytics", desc: "Live data on 10 core urban problems", color: "text-violet-400" },
              { icon: Shield, title: "Transparent Governance", desc: "Open access for citizens, secure tools for officials", color: "text-blue-400" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -6 }}
                className="uo-panel uo-panel-glow rounded-2xl p-6"
              >
                <f.icon className={`w-8 h-8 mb-4 mx-auto ${f.color}`} />
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="uo-glow-btn px-12 py-4 text-lg font-semibold rounded-xl group"
              onClick={() => navigate("/RoleSelection")}
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-slate-500 text-sm mt-10"
          >
            Empowering citizens and government officials to build better cities together
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
