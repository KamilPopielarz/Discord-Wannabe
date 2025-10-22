import React from "react";
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
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

interface MessageItemProps {
  message: MessageDto;
  onDelete: (messageId: number) => void;
  canDelete: boolean;
}

function MessageItem({ message, onDelete, canDelete }: MessageItemProps) {
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
    <div className="group flex items-start space-x-3 p-3 hover:bg-matrix-green/5 rounded-lg transition-all duration-200 border-l-2 border-transparent hover:border-matrix-green/30">
      {/* Avatar with Matrix styling */}
      <div className="flex-shrink-0 w-8 h-8 bg-matrix-green/10 border border-matrix-green/30 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-matrix-green font-mono">
          {authorName.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Message header with Matrix styling */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium matrix-text font-mono tracking-wide">
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            [{timeString}]
          </span>
        </div>

        {/* Message content with Matrix font */}
        <div className="text-sm matrix-text break-words font-mono leading-relaxed bg-matrix-green/5 px-3 py-2 rounded-md border border-matrix-green/10">
          {message.content}
        </div>
      </div>

      {/* Delete button with Matrix styling */}
      {canDelete && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(message.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 matrix-button"
            title="Usuń wiadomość"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function MessageList({
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
          <div className="mx-auto w-20 h-20 bg-matrix-green/10 border border-matrix-green/30 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-matrix-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2 matrix-title">KANAŁ KOMUNIKACYJNY PUSTY</h3>
          <p className="text-muted-foreground matrix-text font-mono">
            Zainicjuj bezpieczną transmisję danych wysyłając pierwszą wiadomość do systemu Matrix.
          </p>
          <div className="mt-4 p-3 matrix-form rounded-lg text-xs">
            <p className="matrix-text">
              ● WSZYSTKIE WIADOMOŚCI SĄ SZYFROWANE<br/>
              ● TRANSMISJA W CZASIE RZECZYWISTYM<br/>
              ● PEŁNA KONTROLA NAD DANYMI
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
}
