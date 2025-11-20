import { useState, useEffect, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "../../db/supabase.client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  userId: string;
  username: string;
  lastTyping: number;
}

export function useTypingIndicator(roomId?: string, currentUserId?: string, currentUsername?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentRef = useRef<number>(0);

  // Clean up expired typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => 
        prev.filter(user => now - user.lastTyping < 3000) // Remove users who haven't typed in 3 seconds
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to typing events
  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    // Use a separate channel for typing indicators to avoid conflicts
    const channel = supabase.channel(`room:${roomId}-typing`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        // console.log('[Typing] Received typing event:', payload);
        const { userId, username } = payload.payload;
        if (userId === currentUserId) return; // Ignore own events

        setTypingUsers(prev => {
          const existing = prev.find(user => user.userId === userId);
          const now = Date.now();
          
          if (existing) {
            // Update existing user's typing time
            return prev.map(user => 
              user.userId === userId 
                ? { ...user, lastTyping: now }
                : user
            );
          } else {
            // Add new typing user
            return [...prev, { userId, username, lastTyping: now }];
          }
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            // console.log('[Typing] Subscribed to typing channel');
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, currentUserId]);

  // Handle current user typing
  const handleTyping = useCallback(() => {
    if (!roomId || !currentUserId || !currentUsername) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Throttle sending events (max once every 2 seconds)
    const now = Date.now();
    if (now - lastSentRef.current > 2000) {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: currentUserId, username: currentUsername },
            }).catch(err => console.error('[Typing] Failed to send typing event:', err));
            
            lastSentRef.current = now;
            isTypingRef.current = true;
            // console.log('[Typing] Sent typing event');
        }
    }

    // Set timeout to stop typing status locally after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 3000);
  }, [roomId, currentUserId, currentUsername]);

  // Stop typing immediately
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      // Optional: Send explicit stop typing event if we wanted to be instant
    }
  }, []);

  // Get display names of typing users
  const typingUsernames = typingUsers.map(user => user.username);

  return {
    typingUsers: typingUsernames,
    isTyping: isTypingRef.current,
    handleTyping,
    stopTyping,
    // addTypingUser removed as it was for simulation
  };
}
