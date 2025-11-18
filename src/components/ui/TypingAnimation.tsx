import React, { useState, useEffect } from "react";

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypingAnimation({ text, speed = 50, className = "", onComplete }: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (index >= text.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText((prev) => prev + text[index]);
      setIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [index, text, speed, onComplete]);

  useEffect(() => {
    const cursorTimer = setInterval(() => setCursorVisible((prev) => !prev), 450);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <span className={`retro-text ${className}`}>
      {displayText}
      {cursorVisible && <span className="inline-block h-5 w-1 bg-[var(--retro-orange-bright)] ml-1 animate-pulse" />}
    </span>
  );
}
