import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Send, Smile } from 'lucide-react';

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
  placeholder = "Napisz wiadomość..." 
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(1);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
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
    if (e.key === 'Enter' && !e.shiftKey) {
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

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`resize-none pr-12 ${isOverLimit ? 'border-destructive' : ''}`}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji button placeholder */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            disabled={disabled}
            title="Emoji (wkrótce)"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span className={isNearLimit ? (isOverLimit ? 'text-destructive' : 'text-amber-500') : ''}>
              {characterCount}/{maxCharacters}
            </span>
            {isOverLimit && (
              <span className="text-destructive">
                Wiadomość jest za długa
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-xs text-muted-foreground">
              Enter - wyślij, Shift+Enter - nowa linia
            </div>
            
            <Button 
              type="submit" 
              size="sm"
              disabled={disabled || !value.trim() || isOverLimit}
              className="min-w-[80px]"
            >
              {disabled ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
