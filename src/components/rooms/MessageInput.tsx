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
}

export function MessageInput({
  onSend,
  disabled,
  value,
  onChange,
  placeholder = "Napisz wiadomość...",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend(value);
      }
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
      onChange(newValue);

      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t border-matrix-green/20 bg-background/95 backdrop-blur p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`matrix-input resize-none pr-12 font-mono ${isOverLimit ? "border-destructive matrix-error" : ""}`}
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />

          {/* Emoji button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-matrix-green/70 hover:text-matrix-green hover:bg-matrix-green/10 matrix-button"
            disabled={disabled}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Dodaj emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute right-0 top-12 z-50 w-80 max-h-64 overflow-y-auto matrix-form border border-matrix-green/30 rounded-lg shadow-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium matrix-title">WYBIERZ EMOJI</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 matrix-button hover:bg-matrix-green/10"
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
                    className="h-8 w-8 p-0 text-lg hover:bg-matrix-green/10 matrix-button"
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
            <span className={`font-mono ${isNearLimit ? (isOverLimit ? "text-destructive matrix-error" : "text-amber-500") : "text-muted-foreground"}`}>
              [{characterCount}/{maxCharacters}]
            </span>
            {isOverLimit && <span className="text-destructive matrix-error font-mono">PRZEKROCZONO LIMIT ZNAKÓW</span>}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-muted-foreground font-mono">
              [ENTER] - TRANSMITUJ | [SHIFT+ENTER] - NOWA LINIA
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={disabled || !value.trim() || isOverLimit}
              className="min-w-[100px] matrix-button font-mono tracking-wide"
            >
              {disabled ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  TRANSMISJA...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  TRANSMITUJ
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
