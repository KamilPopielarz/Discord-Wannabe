import React, { useEffect, useRef } from "react";

interface RetroGridBackgroundProps {
  className?: string;
  speed?: number;
}

export function RetroGridBackground({ className = "", speed = 0.06 }: RetroGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getColor = (token: string, fallback: string) => {
      if (typeof window === "undefined") return fallback;
      const styles = getComputedStyle(document.documentElement);
      const value = styles.getPropertyValue(token).trim();
      return value || fallback;
    };

    const colors = {
      orange: getColor("--retro-orange", "#ff7a18"),
      orangeBright: getColor("--retro-orange-bright", "#ffb347"),
      teal: getColor("--retro-teal", "#22c5c7"),
      plum: getColor("--retro-plum", "#8439ff"),
      midnight: getColor("--retro-midnight", "#1d130f"),
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const shapes = Array.from({ length: 16 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 60 + 20,
      hue: Math.random() > 0.5 ? colors.teal : colors.plum,
      drift: Math.random() * 0.3 + 0.1,
    }));

    let animationFrame: number;
    let offset = 0;

    const render = () => {
      if (!ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `${colors.orangeBright}20`);
      gradient.addColorStop(0.4, `${colors.teal}10`);
      gradient.addColorStop(1, `${colors.midnight}`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const gridSize = 120;
      ctx.strokeStyle = `${colors.teal}40`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      offset += speed;

      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + (offset % gridSize), 0);
        ctx.lineTo(x + (offset % gridSize), height);
        ctx.stroke();
      }

      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + (offset % gridSize));
        ctx.lineTo(width, y + (offset % gridSize));
        ctx.stroke();
      }

      shapes.forEach((shape) => {
        shape.y += shape.drift * speed;
        if (shape.y > 1.2) shape.y = -0.2;

        ctx.beginPath();
        ctx.fillStyle = `${shape.hue}50`;
        ctx.shadowColor = `${shape.hue}80`;
        ctx.shadowBlur = 20;
        ctx.arc(shape.x * width, shape.y * height, shape.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [speed]);

  return <canvas ref={canvasRef} className={`retro-grid ${className}`} />;
}
