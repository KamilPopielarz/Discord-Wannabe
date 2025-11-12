import React, { useState, useEffect } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypingAnimation({ 
  text, 
  speed = 50, 
  className = '', 
  onComplete 
}: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <span className={className || ''} style={className.includes('!text-white') ? { color: 'white' } : undefined}>
      {displayText}
      {showCursor && (
        <span className="inline-block w-0.5 h-5 bg-accent-green ml-1 animate-pulse" />
      )}
    </span>
  );
}
