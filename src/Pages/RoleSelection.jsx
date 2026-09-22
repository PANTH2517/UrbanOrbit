import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../Components/ui/button";
import { Card, CardContent } from "../Components/ui/card";
import StarfieldBackground from "../Components/ui/StarfieldBackground";
import { Users, Shield, ArrowRight, MapPin, BarChart3, FileText, Eye, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <StarfieldBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="uo-gradient-text">Role</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Select how you'd like to engage with UrbanOrbit
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Citizen Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Card className="group h-full">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(56,242,255,0.35)] group-hover:shadow-[0_0_44px_rgba(56,242,255,0.55)] transition-shadow">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">I am a Citizen</h2>
                  <p className="text-slate-400 mb-6">Report issues, view data, and track progress in your city</p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    [Eye, "View all urban issues on interactive map"],
                    [MapPin, "Report new problems with location & photos"],
                    [BarChart3, "Access public analytics and trends"],
                    [FileText, "Track issue status and resolution progress"],
                  ].map(([Icon, text]) => (
                    <div key={text} className="flex items-center gap-3 text-slate-200">
                      <Icon className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full py-3" onClick={() => navigate("/CitizenAuth")}>
                  Enter as Citizen
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-slate-500 text-xs text-center mt-4">
                  Free to browse • Email verification required to report issues
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Government Official Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ y: -4 }}
          >
            <Card className="group h-full">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(162,89,255,0.35)] group-hover:shadow-[0_0_44px_rgba(162,89,255,0.55)] transition-shadow">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">I am a Government Official</h2>
                  <p className="text-slate-400 mb-6">Manage issues, update status, and export detailed reports</p>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    [Settings, "Full dashboard with issue management"],
                    [FileText, "Update issue status and assign priority"],
                    [BarChart3, "Advanced analytics and PDF exports"],
                    [Shield, "Admin-approved official accounts"],
                  ].map(([Icon, text]) => (
                    <div key={text} className="flex items-center gap-3 text-slate-200">
                      <Icon className="w-5 h-5 text-violet-400 shrink-0" />
                      <span className="text-sm">{text}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full py-3 !bg-gradient-to-r !from-violet-500 !via-fuchsia-500 !to-pink-500"
                  onClick={() => navigate("/GovernmentLogin")}
                >
                  Official Login
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-slate-500 text-xs text-center mt-4">
                  Secure access • Verified officials only
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Welcome
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
