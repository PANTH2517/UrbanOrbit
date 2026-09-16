import React, { useEffect, useRef } from "react";

/**
 * Lightweight animated starfield + drifting nebula glows for the dark
 * "orbital command center" theme. Pure canvas, no dependencies, cheap
 * enough to run behind every page.
 */
export default function StarfieldBackground({ density = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrame;
    let width, height, stars;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.2,
        speed: Math.random() * 0.15 + 0.02,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        star.twinkle += 0.02;
        const opacity = 0.35 + Math.abs(Math.sin(star.twinkle)) * 0.65;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 225, 255, ${opacity})`;
        ctx.fill();
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      }
      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#05070f]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-blue-600/20 blur-[120px] animate-uo-float" />
      <div
        className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-violet-600/20 blur-[120px] animate-uo-float"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] rounded-full bg-cyan-500/10 blur-[120px] animate-uo-float"
        style={{ animationDelay: "-1.5s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#05070f_85%)]" />
    </div>
  );
}
