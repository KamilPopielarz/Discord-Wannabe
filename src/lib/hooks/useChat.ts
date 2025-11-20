import { useState, useEffect, useRef, useCallback } from "react";
import type { SendMessageCommand, MessageDto, ListMessagesResponseDto, SendMessageResponseDto } from "../../types";
import type { ChatViewModel } from "../../types/viewModels";
import { useNotifications } from "./useNotifications";
import { createSupabaseBrowserClient } from "../../db/supabase.client";

export function useChat(roomId?: string, roomName?: string) {

  const [state, setState] = useState<ChatViewModel>({
    messages: [],
    nextPage: undefined,
    sending: false,
    error: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const {
    hasNewMessages,
    unreadCount,
    isWindowFocused,
    notificationsEnabled,
    addNewMessage,
    clearNotifications,
    requestNotificationPermission,
    soundSettings,
    updateSoundSettings,
    testSound,
  } = useNotifications();

  // Use ref for addNewMessage to prevent re-creation of loadNewMessages when notifications state changes
  const addNewMessageRef = useRef(addNewMessage);
  useEffect(() => {
    addNewMessageRef.current = addNewMessage;
  }, [addNewMessage]);

  const loadMessages = useCallback(async (page?: string) => {
    if (!roomId) {
      return;
    }

    setLoading(true);
    setState((prev) => ({
      ...prev,
      error: undefined,
    }));

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = new URL(`/api/rooms/${roomId}/messages`, origin);
      if (page) {
        url.searchParams.set("page", page);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (response.status === 404) {
        // Endpoint doesn't exist yet, use empty array
        setState((prev) => ({
          ...prev,
          messages: [],
        }));
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas ładowania wiadomości";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak dostępu do tego pokoju";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        setLoading(false);
        return;
      }

      const data: ListMessagesResponseDto = await response.json();

      // Messages come in DESC order (newest first), so we reverse them to show oldest first
      const reversedMessages = [...data.messages].reverse();

      // When loading first page, replace messages completely
      // When loading more pages (pagination), prepend older messages
      setState((prev) => ({
        ...prev,
        messages: page ? [...reversedMessages, ...prev.messages] : reversedMessages,
        nextPage: data.nextPage,
      }));

      // Update last message ID for auto-refresh
      // Always update when loading the first page (not pagination)
      if (!page && data.messages.length > 0) {
        lastMessageIdRef.current = Math.max(...data.messages.map(m => m.id));
        console.log(`[LoadMessages] Initialized lastMessageId to: ${lastMessageIdRef.current}`);
      } else if (!page && data.messages.length === 0) {
        // No messages yet, reset to null so polling will fetch all messages
        lastMessageIdRef.current = null;
        console.log(`[LoadMessages] No messages found, resetting lastMessageId`);
      }

      setLoading(false);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
      setLoading(false);
    }
  }, [roomId]);

  const loadNewMessages = useCallback(async (retryCount = 0) => {
    if (!roomId) {
      console.log(`[Polling] Skipping loadNewMessages - no roomId`);
      return;
    }

    // Remove loading check - allow polling even during loading to ensure real-time updates
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s, 3s

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = new URL(`/api/rooms/${roomId}/messages`, origin);
      
      // Only get messages newer than the last one we have
      if (lastMessageIdRef.current) {
        url.searchParams.set("since", lastMessageIdRef.current.toString());
        console.log(`[Polling] Fetching messages since ID: ${lastMessageIdRef.current}`);
      } else {
        console.log(`[Polling] Fetching messages (no since parameter - first load)`);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        // Retry on server errors (5xx) or rate limiting (429)
        if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
          console.warn(`[Polling] Failed to fetch messages (${response.status}), retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            loadNewMessages(retryCount + 1);
          }, retryDelay);
          return;
        }
        console.warn(`[Polling] Failed to fetch messages: ${response.status} ${response.statusText}`);
        return; // Silently fail for auto-refresh after max retries
      }

      const data: ListMessagesResponseDto = await response.json();
      console.log(`[Polling] Received ${data.messages.length} messages`);

      // Only add new messages if we have any
      if (data.messages.length > 0) {
        setState((prev) => {
          // Avoid duplicates - check if message already exists
          const existingIds = new Set(prev.messages.map(m => m.id));
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));
          
          console.log(`[Polling] ${newMessages.length} new messages (${data.messages.length - newMessages.length} duplicates filtered)`);
          
          if (newMessages.length === 0) return prev;

          // Update last message ID - ensure we track the highest ID
          const newLastId = Math.max(...newMessages.map(m => m.id));
          // Also check if we have existing messages with higher IDs
          const existingMaxId = prev.messages.length > 0 ? Math.max(...prev.messages.map(m => m.id)) : 0;
          const finalLastId = Math.max(newLastId, existingMaxId);
          lastMessageIdRef.current = finalLastId;
          console.log(`[Polling] Updated lastMessageId to: ${finalLastId} (new: ${newLastId}, existing max: ${existingMaxId})`);

          // Show notifications for new messages from other users
          newMessages.forEach(message => {
            // Don't notify for own messages  
            if (message.userId !== currentUserIdRef.current) {
              addNewMessageRef.current({
                authorName: message.authorName,
                content: message.content,
              }, roomName);
            }
          });

          // Merge and sort messages to ensure correct order
          const mergedMessages = [...prev.messages, ...newMessages];
          // Sort by ID ascending (oldest first)
          mergedMessages.sort((a, b) => a.id - b.id);

          return {
            ...prev,
            messages: mergedMessages,
          };
        });
      } else {
        console.log(`[Polling] No new messages`);
      }
    } catch (error) {
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.warn(`[Polling] Error loading new messages, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries}):`, error);
        setTimeout(() => {
          loadNewMessages(retryCount + 1);
        }, retryDelay);
        return;
      }
      console.error("[Polling] Error loading new messages after retries:", error);
      // Silently fail for auto-refresh to avoid spamming errors
    }
  }, [roomId, roomName]);

  // Load messages on mount and when roomId changes
  useEffect(() => {
    if (roomId) {
      // Clear existing messages when switching rooms
      setState((prev) => ({
        ...prev,
        messages: [],
        nextPage: undefined,
        error: undefined,
      }));
      loadMessages();
    }
  }, [roomId, loadMessages]);

  // Set up Realtime subscription and fallback polling
  useEffect(() => {
    if (typeof window === "undefined" || !roomId) {
      return;
    }

    // Get current user ID for filtering notifications
    const fetchCurrentUserId = async () => {
      try {
        const response = await fetch('/api/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          currentUserIdRef.current = userData.userId || null;
        }
      } catch (error) {
        console.error('Failed to fetch current user ID:', error);
      }
    };
    
    fetchCurrentUserId();

    // Initialize Supabase client for Realtime with auth token
    const setupRealtime = async () => {
      let accessToken = null;
      try {
        // Fetch access token from server (since cookies are httpOnly)
        const response = await fetch('/api/auth/token');
        if (response.ok) {
          const data = await response.json();
          accessToken = data.access_token;
        } else {
          console.warn('[Realtime] Failed to fetch auth token, status:', response.status);
        }
      } catch (e) {
        console.error("[Realtime] Failed to get auth token:", e);
      }

      const supabase = createSupabaseBrowserClient();
      let channel: any = null;

      if (supabase) {
        if (accessToken) {
          console.log('[Realtime] Setting auth token');
          supabase.realtime.setAuth(accessToken);
        } else {
          console.warn('[Realtime] No access token available, subscriptions may fail due to RLS');
        }

        channel = supabase
          .channel(`room:${roomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: '*', // Listen to all tables to catch partitioned messages
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              console.log('[Realtime] New message received:', payload);
              // Trigger fetch of new messages (handles author info and ordering)
              loadNewMessages();
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime] Subscription status: ${status}`);
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Connected to channel');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('[Realtime] Channel error, subscription may have failed');
            }
            if (status === 'TIMED_OUT') {
                console.error('[Realtime] Subscription timed out');
            }
          });
      }
      
      return { supabase, channel };
    };

    let isMounted = true;
    let cleanup: (() => void) | undefined;
    
    setupRealtime().then(({ supabase, channel }) => {
      if (!isMounted) {
        // If unmounted before setup finished, clean up immediately
        if (channel && supabase) {
          supabase.removeChannel(channel);
        }
        return;
      }

      cleanup = () => {
        if (channel && supabase) {
          supabase.removeChannel(channel);
        }
      };
    });

    // Fallback polling (every 3 seconds) just in case Realtime disconnects
    const pollingInterval = setInterval(() => {
      // Check always to ensure sync in multi-window tests and background tabs
      // Using function reference from useRef to avoid stale closures
      if (typeof loadNewMessages === 'function') {
        loadNewMessages();
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
      clearInterval(pollingInterval);
    };
  }, [roomId, loadNewMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Track last message ID to only scroll when new messages arrive
  const prevLastMessageIdRef = useRef<number | null>(null);

  // Auto-scroll to bottom when new messages arrive and handle notifications
  useEffect(() => {
    const lastMessage = state.messages[state.messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;
    
    // Only scroll if the newest message has changed (new message arrived or initial load)
    if (lastMessageId && lastMessageId !== prevLastMessageIdRef.current) {
      scrollToBottom();
      prevLastMessageIdRef.current = lastMessageId;
    }
    
    // Clear notifications when window is focused and user sees messages
    if (isWindowFocused && hasNewMessages) {
      clearNotifications();
    }
  }, [state.messages, isWindowFocused, hasNewMessages, clearNotifications, scrollToBottom]);

  const loadMoreMessages = () => {
    if (state.nextPage && !loading) {
      loadMessages(state.nextPage);
    }
  };

  const sendMessage = async (content: string) => {
    if (!roomId || !content.trim()) {
      return;
    }

    // Early return for validation
    if (content.trim().length > 2000) {
      setState((prev) => ({
        ...prev,
        error: "Wiadomość jest za długa (maksymalnie 2000 znaków)",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      sending: true,
      error: undefined,
    }));

    try {
      const payload: SendMessageCommand = {
        content: content.trim(),
      };

      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas wysyłania wiadomości";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do wysyłania wiadomości";
            break;
          case 429:
            errorMessage = "Za dużo wiadomości. Zwolnij tempo";
            break;
          case 400:
            errorMessage = "Nieprawidłowa wiadomość";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          sending: false,
          error: errorMessage,
        }));
        return;
      }

      const data: SendMessageResponseDto = await response.json();

      setState((prev) => ({
        ...prev,
        sending: false,
      }));

      // Clear message input
      setMessageText("");

      // Update lastMessageIdRef with the new message ID if available
      // This ensures polling will fetch messages after this one
      if (data.messageId && typeof data.messageId === 'number') {
        // Use the message ID minus 1 to ensure we fetch the new message
        lastMessageIdRef.current = data.messageId - 1;
        console.log(`[SendMessage] Updated lastMessageIdRef to ${lastMessageIdRef.current} (new message ID: ${data.messageId})`);
      }

      // Use loadNewMessages instead of loadMessages for better performance
      // This fetches only new messages instead of reloading everything
      // Use a small delay to ensure the database has committed the transaction
      setTimeout(async () => {
        // Fetch new messages including the one we just sent
        await loadNewMessages();
      }, 200);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        sending: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!roomId || !confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas usuwania wiadomości";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do usuwania tej wiadomości";
            break;
          case 404:
            errorMessage = "Wiadomość nie została znaleziona";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return;
      }

      // Remove message from the list
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((msg) => msg.id !== messageId),
        error: undefined,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const clearChat = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to clear chat");
      }

      // Clear local messages
      setState((prev) => ({
        ...prev,
        messages: [],
        error: undefined,
      }));
      
      // Reset pagination references
      lastMessageIdRef.current = null;
      
    } catch (error: any) {
      console.error("Error clearing chat:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Błąd połączenia",
      }));
      throw error;
    }
  };

  const updateMessageText = (text: string) => {
    setMessageText(text);

    // Clear error when user starts typing
    if (state.error) {
      setState((prev) => ({
        ...prev,
        error: undefined,
      }));
    }
  };

  const setCurrentUserId = (userId: string) => {
    currentUserIdRef.current = userId;
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
    clearChat,
    updateMessageText,
    scrollToBottom,
    setCurrentUserId,
    // Notification states
    hasNewMessages,
    unreadCount,
    notificationsEnabled,
    requestNotificationPermission,
    // Sound settings
    soundSettings,
    updateSoundSettings,
    testSound,
  };
}
