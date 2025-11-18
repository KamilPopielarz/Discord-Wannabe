import React, { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "subtle" | "bold";
  trigger?: boolean;
}

export function GlitchText({ text, className = "", intensity = "subtle", trigger = false }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setGlitching(true);

    const charset = "▲◆◼︎●★✦✧☼0123456789DISCORDWANABE";
    const duration = intensity === "bold" ? 400 : 220;
    const frequency = intensity === "bold" ? 0.35 : 0.18;

    const glitchInterval = setInterval(() => {
      const scrambled = text
        .split("")
        .map((char) => (Math.random() < frequency ? charset[Math.floor(Math.random() * charset.length)] : char))
        .join("");
      setDisplayText(scrambled);
    }, 45);

    const stopTimeout = setTimeout(() => {
      clearInterval(glitchInterval);
      setDisplayText(text);
      setGlitching(false);
    }, duration);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(stopTimeout);
    };
  }, [text, trigger, intensity]);

  return (
    <span
      className={`retro-text ${className}`}
      style={{
        textShadow: glitching ? "2px 0 var(--retro-plum), -2px 0 var(--retro-orange), 0 2px var(--retro-teal)" : undefined,
        letterSpacing: "0.08em",
      }}
    >
      {displayText}
    </span>
  );
}
