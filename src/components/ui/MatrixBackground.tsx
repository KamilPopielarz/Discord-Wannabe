import React from 'react';

interface MatrixBackgroundProps {
  className?: string;
}

export function MatrixBackground({ className = '' }: MatrixBackgroundProps) {
  // Neutral background using theme colors
  return (
    <div
      className={`matrix-bg ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        background: 'var(--background)',
      }}
    />
  );
}
