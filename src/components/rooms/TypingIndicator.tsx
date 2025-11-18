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
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0]} i ${typingUsers[1]} piszą...`;
    }
    if (typingUsers.length === 3) {
      return `${typingUsers[0]}, ${typingUsers[1]} i ${typingUsers[2]} piszą...`;
    }
    return `${typingUsers[0]}, ${typingUsers[1]} i ${typingUsers.length - 2} innych piszą...`;
  };

  return (
    <div className="px-4 py-2 text-xs text-muted-foreground retro-text">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <span className="h-2 w-2 rounded-full bg-[var(--retro-orange)] animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-[var(--retro-teal)] animate-pulse [animation-delay:0.15s]" />
          <span className="h-2 w-2 rounded-full bg-[var(--retro-plum)] animate-pulse [animation-delay:0.3s]" />
        </div>
        <span className="tracking-wide uppercase text-[var(--retro-orange-bright)]">{getTypingText()}</span>
      </div>
    </div>
  );
});
