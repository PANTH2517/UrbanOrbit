// src/Pages/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Satellite, Home } from "lucide-react";
import { Button } from "../Components/ui/button";
import StarfieldBackground from "../Components/ui/StarfieldBackground";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center text-white text-center px-6">
      <StarfieldBackground />
      <div className="relative z-10">
        <Satellite className="w-14 h-14 text-cyan-400 mx-auto mb-6 animate-uo-float" />
        <h1 className="text-7xl font-bold uo-gradient-text mb-4">404</h1>
        <p className="text-slate-400 mb-8">This orbit doesn't exist - the page you're looking for has drifted off.</p>
        <Button size="lg" onClick={() => navigate("/")}>
          <Home className="w-5 h-5 mr-2" /> Back to Mission Control
        </Button>
      </div>
    </div>
  );
}
