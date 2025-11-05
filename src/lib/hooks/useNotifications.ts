import { useState, useEffect, useRef, useCallback } from "react";
import { useSoundNotifications } from "./useSoundNotifications";

interface NotificationState {
  hasNewMessages: boolean;
  unreadCount: number;
  lastNotificationTime: number | null;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    hasNewMessages: false,
    unreadCount: 0,
    lastNotificationTime: null,
  });

  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const originalTitleRef = useRef<string>("");
  
  const {
    settings: soundSettings,
    updateSettings: updateSoundSettings,
    playMessageSound,
    testSound,
  } = useSoundNotifications();

  // Define clearNotifications before it's used in useEffect
  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewMessages: false,
      unreadCount: 0,
    }));
  }, []);

  // Initialize original title and check notifications on client side only
  useEffect(() => {
    // Set original title only on client side
    if (typeof document !== "undefined") {
      originalTitleRef.current = document.title;
    }

    // Check if notifications are supported and request permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === "granted");
        });
      }
    }
  }, []);

  // Track window focus state
  useEffect(() => {
    // Only add event listeners on client side
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      setIsWindowFocused(true);
      clearNotifications();
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [clearNotifications]);

  // Update document title with unread count
  useEffect(() => {
    // Only update title on client side
    if (typeof document === "undefined") return;

    if (state.unreadCount > 0 && !isWindowFocused) {
      document.title = `(${state.unreadCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }
  }, [state.unreadCount, isWindowFocused]);

  const showNotification = (message: { authorName?: string; content: string; roomName?: string }) => {
    // Only show notifications on client side
    if (typeof window === "undefined" || typeof Notification === "undefined") return;

    // Don't show notifications if window is focused
    if (isWindowFocused) return;

    // Don't show notifications if not enabled
    if (!notificationsEnabled) return;

    // Throttle notifications (max one per 2 seconds)
    const now = Date.now();
    if (state.lastNotificationTime && now - state.lastNotificationTime < 2000) {
      return;
    }

    const title = message.roomName ? `Nowa wiadomość w ${message.roomName}` : 'Nowa wiadomość';
    const body = message.authorName ? `${message.authorName}: ${message.content}` : message.content;
    
    const notification = new Notification(title, {
      body: body.length > 100 ? body.substring(0, 100) + '...' : body,
      icon: '/favicon.png',
      tag: 'chat-message', // Replace previous notifications
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setState(prev => ({
      ...prev,
      lastNotificationTime: now,
    }));
  };

  const addNewMessage = (message: { authorName?: string; content: string }, roomName?: string) => {
    setState(prev => ({
      ...prev,
      hasNewMessages: true,
      unreadCount: prev.unreadCount + 1,
    }));

    // Play sound notification
    playMessageSound();

    // Show browser notification
    showNotification({ ...message, roomName });
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === "granted");
      return permission === "granted";
    }
    return false;
  };

  return {
    hasNewMessages: state.hasNewMessages,
    unreadCount: state.unreadCount,
    isWindowFocused,
    notificationsEnabled,
    addNewMessage,
    clearNotifications,
    requestNotificationPermission,
    // Sound settings
    soundSettings,
    updateSoundSettings,
    testSound,
  };
}
