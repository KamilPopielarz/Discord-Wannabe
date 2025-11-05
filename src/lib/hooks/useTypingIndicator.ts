import { useState, useEffect, useRef, useCallback } from "react";

interface TypingUser {
  userId: string;
  username: string;
  lastTyping: number;
}

export function useTypingIndicator(roomId?: string, currentUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Simulate receiving typing indicators from other users
  const addTypingUser = useCallback((userId: string, username: string) => {
    if (userId === currentUserId) return; // Don't show own typing

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
  }, [currentUserId]);

  // Remove typing user
  const removeTypingUser = useCallback((userId: string) => {
    setTypingUsers(prev => prev.filter(user => user.userId !== userId));
  }, []);

  // Handle current user typing
  const handleTyping = useCallback(() => {
    if (!roomId || !currentUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If not already typing, start typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      // Here you would send typing start event to server
      console.log('Started typing in room:', roomId);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        // Here you would send typing stop event to server
        console.log('Stopped typing in room:', roomId);
      }
    }, 2000);
  }, [roomId, currentUserId]);

  // Stop typing immediately (e.g., when message is sent)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (isTypingRef.current) {
      isTypingRef.current = false;
      // Here you would send typing stop event to server
      console.log('Stopped typing in room:', roomId);
    }
  }, [roomId]);

  // Simulate other users typing occasionally for demo purposes
  useEffect(() => {
    if (!roomId) return;

    // Clear existing simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    // Simulate typing users every 10-20 seconds
    simulationIntervalRef.current = setInterval(() => {
      const shouldSimulate = Math.random() < 0.3; // 30% chance
      if (shouldSimulate) {
        const mockUsers = [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
          { id: 'user-3', name: 'Charlie' },
        ];
        
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        addTypingUser(randomUser.id, randomUser.name);
        
        // Stop typing after 2-4 seconds
        setTimeout(() => {
          removeTypingUser(randomUser.id);
        }, 2000 + Math.random() * 2000);
      }
    }, 10000 + Math.random() * 10000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [roomId, addTypingUser, removeTypingUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Get display names of typing users
  const typingUsernames = typingUsers.map(user => user.username);

  return {
    typingUsers: typingUsernames,
    isTyping: isTypingRef.current,
    handleTyping,
    stopTyping,
    addTypingUser,
    removeTypingUser,
  };
}
