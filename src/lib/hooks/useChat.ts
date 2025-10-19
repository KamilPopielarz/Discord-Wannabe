import { useState, useEffect, useRef } from 'react';
import type { SendMessageCommand, MessageDto, ListMessagesResponseDto } from '../../types';
import type { ChatViewModel } from '../../types/viewModels';

export function useChat(roomId?: string) {
  const [state, setState] = useState<ChatViewModel>({
    messages: [],
    nextPage: undefined,
    sending: false,
    error: undefined
  });

  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages on mount and when roomId changes
  useEffect(() => {
    if (roomId) {
      loadMessages();
    }
  }, [roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (page?: string) => {
    if (!roomId) return;

    setLoading(true);
    setState(prev => ({
      ...prev,
      error: undefined
    }));

    try {
      const url = new URL(`/api/rooms/${roomId}/messages`, window.location.origin);
      if (page) {
        url.searchParams.set('page', page);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // Endpoint doesn't exist yet, use empty array
        setState(prev => ({
          ...prev,
          messages: []
        }));
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas ładowania wiadomości';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak dostępu do tego pokoju';
            break;
          case 429:
            errorMessage = 'Za dużo żądań. Spróbuj ponownie później';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        setLoading(false);
        return;
      }

      const data: ListMessagesResponseDto = await response.json();
      
      setState(prev => ({
        ...prev,
        messages: page ? [...data.messages, ...prev.messages] : data.messages,
        nextPage: data.nextPage
      }));
      
      setLoading(false);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
      setLoading(false);
    }
  };

  const loadMoreMessages = () => {
    if (state.nextPage && !loading) {
      loadMessages(state.nextPage);
    }
  };

  const sendMessage = async (content: string) => {
    if (!roomId || !content.trim()) return;

    // Early return for validation
    if (content.trim().length > 2000) {
      setState(prev => ({
        ...prev,
        error: 'Wiadomość jest za długa (maksymalnie 2000 znaków)'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      sending: true,
      error: undefined
    }));

    try {
      const payload: SendMessageCommand = {
        content: content.trim()
      };

      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas wysyłania wiadomości';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak uprawnień do wysyłania wiadomości';
            break;
          case 429:
            errorMessage = 'Za dużo wiadomości. Zwolnij tempo';
            break;
          case 400:
            errorMessage = 'Nieprawidłowa wiadomość';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          sending: false,
          error: errorMessage
        }));
        return;
      }

      const data = await response.json();
      
      // Add new message to the list (optimistic update)
      const newMessage: MessageDto = {
        id: data.messageId,
        userId: null, // Will be filled by server
        sessionId: null, // Will be filled by server
        content: content.trim(),
        metadata: null,
        createdAt: data.createdAt
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        sending: false
      }));

      // Clear message input
      setMessageText('');
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        sending: false,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!roomId || !confirm('Czy na pewno chcesz usunąć tę wiadomość?')) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas usuwania wiadomości';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak uprawnień do usuwania tej wiadomości';
            break;
          case 404:
            errorMessage = 'Wiadomość nie została znaleziona';
            break;
          case 429:
            errorMessage = 'Za dużo żądań. Spróbuj ponownie później';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        return;
      }

      // Remove message from the list
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId),
        error: undefined
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const updateMessageText = (text: string) => {
    setMessageText(text);
    // Clear error when user starts typing
    if (state.error) {
      setState(prev => ({
        ...prev,
        error: undefined
      }));
    }
  };

  return {
    state,
    loading,
    messageText,
    messagesEndRef,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    updateMessageText,
    scrollToBottom
  };
}
