import React, { memo } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Trash2, MoreVertical } from "lucide-react";
import type { MessageDto } from "../../types";

interface MessageListProps {
  messages: MessageDto[];
  loading: boolean;
  error?: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onDeleteMessage: (messageId: number) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

interface MessageItemProps {
  message: MessageDto;
  onDelete: (messageId: number) => void;
  canDelete: boolean;
}

const MessageItem = memo(function MessageItem({ message, onDelete, canDelete }: MessageItemProps) {
  const messageDate = new Date(message.createdAt);
  const isToday = messageDate.toDateString() === new Date().toDateString();
  const timeString = isToday
    ? messageDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    : messageDate.toLocaleString("pl-PL", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const authorName = message.authorName || "NIEZNANY_UŻYTKOWNIK";

  return (
    <div className="group flex items-start space-x-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-[var(--retro-orange)]/50 hover:bg-[var(--retro-orange-soft)]/40">
      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--retro-orange)] bg-[var(--retro-orange-soft)] font-semibold text-[var(--retro-orange-bright)]">
        <span className="text-xs font-mono">
          {authorName.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-semibold retro-text tracking-wide">
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            [{timeString}]
          </span>
        </div>

        <div className="retro-panel text-sm retro-text break-words rounded-lg border border-[var(--border)] px-3 py-2 font-mono leading-relaxed">
          {message.content}
        </div>
      </div>

      {canDelete && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(message.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Usuń wiadomość"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
});

export const MessageList = memo(function MessageList({
  messages,
  loading,
  error,
  hasMore,
  onLoadMore,
  onDeleteMessage,
  messagesEndRef,
}: MessageListProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--retro-orange)] bg-[var(--retro-orange-soft)]">
            <svg className="h-10 w-10 text-[var(--retro-orange-bright)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="retro-heading mb-2 text-xl">Kanał Discord-Wannabe jest pusty</h3>
          <p className="retro-text font-mono text-muted-foreground">
            Zacznij rozmowę i pozwól, by retro vibe przemówił pierwszy.
          </p>
          <div className="retro-panel text-xs mt-4 rounded-lg p-3">
            <p className="retro-text space-y-1">
              • Wiadomości natychmiastowe<br />
              • Bezpieczna komunikacja retro<br />
              • Kontrola nad całym pokojem
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <ErrorBanner error={error} className="mx-4 mb-2" />

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Ładowanie...
                  </>
                ) : (
                  "Załaduj starsze wiadomości"
                )}
              </Button>
            </div>
          )}

          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onDelete={onDeleteMessage}
              canDelete={true} // For now, allow deleting all messages
            />
          ))}

          {loading && messages.length === 0 && (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="mr-2" />
              <span className="text-muted-foreground">Ładowanie wiadomości...</span>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </ScrollArea>
    </div>
  );
});
