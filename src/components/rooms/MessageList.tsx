import React from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Trash2, MoreVertical } from 'lucide-react';
import type { MessageDto } from '../../types';

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
    ? messageDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : messageDate.toLocaleString('pl-PL', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

  const authorName = message.userId ? `Użytkownik ${message.userId.slice(-6)}` : 
                     message.sessionId ? `Gość ${message.sessionId.slice(-6)}` : 
                     'Nieznany';

  return (
    <div className="group flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-xs font-medium text-primary">
          {authorName.charAt(0)}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            {authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeString}
          </span>
        </div>
        
        <div className="text-sm text-foreground break-words">
          {message.content}
        </div>
      </div>

      {canDelete && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(message.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
  messagesEndRef
}: MessageListProps) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Brak wiadomości</h3>
          <p className="text-muted-foreground">
            Rozpocznij rozmowę wysyłając pierwszą wiadomość!
          </p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Ładowanie...
                  </>
                ) : (
                  'Załaduj starsze wiadomości'
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
