import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  trigger?: boolean;
}

export function GlitchText({ 
  text, 
  className = '', 
  intensity = 'medium',
  trigger = false 
}: GlitchTextProps) {
  const [glitchedText, setGlitchedText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  const intensitySettings = {
    low: { duration: 100, frequency: 0.1 },
    medium: { duration: 200, frequency: 0.2 },
    high: { duration: 300, frequency: 0.3 }
  };

  const createGlitch = () => {
    const settings = intensitySettings[intensity];
    return text.split('').map(char => {
      if (Math.random() < settings.frequency) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join('');
  };

  useEffect(() => {
    if (trigger) {
      setIsGlitching(true);
      const settings = intensitySettings[intensity];
      
      const glitchInterval = setInterval(() => {
        setGlitchedText(createGlitch());
      }, 50);

      const stopTimer = setTimeout(() => {
        clearInterval(glitchInterval);
        setGlitchedText(text);
        setIsGlitching(false);
      }, settings.duration);

      return () => {
        clearInterval(glitchInterval);
        clearTimeout(stopTimer);
      };
    }
  }, [trigger, text, intensity]);

  return (
    <span 
      className={`matrix-text ${isGlitching ? 'matrix-flicker' : ''} ${className}`}
      style={{
        textShadow: isGlitching 
          ? '2px 0 #ff0000, -2px 0 #00ff00, 0 2px #0000ff' 
          : undefined
      }}
    >
      {glitchedText}
    </span>
  );
}
