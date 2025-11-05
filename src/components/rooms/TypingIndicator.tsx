import React, { memo } from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator = memo(function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} pisze...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} i ${typingUsers[1]} piszą...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0]}, ${typingUsers[1]} i ${typingUsers[2]} piszą...`;
    } else {
      return `${typingUsers[0]}, ${typingUsers[1]} i ${typingUsers.length - 2} innych piszą...`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground matrix-text">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <span className="font-mono">{getTypingText()}</span>
      </div>
    </div>
  );
});
