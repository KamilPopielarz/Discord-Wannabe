import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Send, Smile, X } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  value,
  onChange,
  placeholder = "Napisz wiadomość...",
  onTyping,
  onStopTyping,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const maxRows = 5;
      const newRows = Math.min(Math.max(1, Math.ceil(scrollHeight / lineHeight)), maxRows);
      setRows(newRows);
    }
  }, [value]);

  // Focus textarea when disabled state changes from true to false (sending completed)
  const prevDisabled = useRef(disabled);
  useEffect(() => {
    if (prevDisabled.current && !disabled && textareaRef.current) {
      // Small timeout to ensure the disabled attribute is removed from DOM
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
    }
    prevDisabled.current = disabled;
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      onStopTyping?.(); // Stop typing when message is sent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value);
        onStopTyping?.(); // Stop typing when message is sent
      }
    }
  };

  const handleChange = (newValue: string) => {
    let processedValue = newValue;

    const emojiShortcuts: Record<string, string> = {
      ":)": "🙂",
      ":D": "😃",
      ":(": "🙁",
      ";)": "😉",
      ":P": "😛",
      ":p": "😛",
      "<3": "❤️",
      ":o": "😮",
      ":O": "😮",
      ":*": "😘",
      "xD": "😆",
      "XD": "😆",
      ":|": "😐",
    };

    Object.entries(emojiShortcuts).forEach(([shortcut, emoji]) => {
       processedValue = processedValue.replaceAll(shortcut, emoji);
    });

    onChange(processedValue);

    // Trigger typing indicator when user types
    if (processedValue.length > 0) {
      onTyping?.();
    } else {
      onStopTyping?.();
    }
  };

  const characterCount = value.length;
  const maxCharacters = 2000;
  const isNearLimit = characterCount > maxCharacters * 0.8;
  const isOverLimit = characterCount > maxCharacters;

  // Common emojis
  const commonEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥸",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "😞",
    "😔",
    "😟",
    "😕",
    "🙁",
    "☹️",
    "😣",
    "😖",
    "😫",
    "😩",
    "🥺",
    "😢",
    "😭",
    "😤",
    "😠",
    "😡",
    "🤬",
    "🤯",
    "😳",
    "🥵",
    "🥶",
    "😱",
    "😨",
    "😰",
    "😥",
    "😓",
    "🤗",
    "🤔",
    "🤭",
    "🤫",
    "🤥",
    "😶",
    "😐",
    "😑",
    "😬",
    "🙄",
    "😯",
    "😦",
    "😧",
    "😮",
    "😲",
    "🥱",
    "😴",
    "🤤",
    "😪",
    "😵",
    "🤐",
    "🥴",
    "🤢",
    "🤮",
    "🤧",
    "😷",
    "🤒",
    "🤕",
    "🤑",
    "🤠",
    "😈",
    "👿",
    "👹",
    "👺",
    "🤡",
    "💩",
    "👻",
    "💀",
    "☠️",
    "👽",
    "👾",
    "🤖",
    "🎃",
    "😺",
    "😸",
    "😹",
    "😻",
    "😼",
    "😽",
    "🙀",
    "😿",
    "😾",
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "👊",
    "✊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
    "✍️",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🤎",
    "🖤",
    "🤍",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
    "✝️",
    "☪️",
    "🕉️",
    "☸️",
    "✡️",
    "🔯",
    "🕎",
    "☯️",
    "☦️",
    "🛐",
    "⛎",
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
    "🆔",
    "⚛️",
    "🉑",
    "☢️",
    "☣️",
  ];

  const addEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + emoji + value.substring(end);
      handleChange(newValue);

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t border-[var(--border)] bg-background/90 backdrop-blur p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`retro-input resize-none pr-12 font-mono ${isOverLimit ? "border-destructive retro-error" : ""}`}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-[var(--retro-orange)] hover:bg-[var(--retro-orange-soft)]/60"
            disabled={disabled}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Dodaj emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {showEmojiPicker && (
            <div className="absolute right-0 bottom-full mb-2 z-50 max-h-64 w-80 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] p-3 shadow-retro">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[var(--retro-orange-bright)]">WYBIERZ EMOJI</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-[var(--retro-orange)] hover:bg-[var(--retro-orange-soft)]/70"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-lg hover:bg-[var(--retro-orange-soft)]/60"
                    onClick={() => addEmoji(emoji)}
                    disabled={disabled}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            <span className={`font-mono ${isNearLimit ? (isOverLimit ? "retro-error" : "text-amber-400") : "text-muted-foreground"}`}>
              [{characterCount}/{maxCharacters}]
            </span>
            {isOverLimit && <span className="retro-error font-mono">PRZEKROCZONO LIMIT ZNAKÓW</span>}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-muted-foreground font-mono">[ENTER] - WYŚLIJ | [SHIFT+ENTER] - NOWA LINIA</div>

            <Button
              type="submit"
              size="sm"
              disabled={disabled || !value.trim() || isOverLimit}
              className="retro-button min-w-[100px] rounded-full font-mono tracking-wide"
            >
              {disabled ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  WYSYŁANIE...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  WYŚLIJ
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
