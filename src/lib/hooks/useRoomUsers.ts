import { useState, useEffect, useRef, useCallback } from "react";
import type { RoomUserDto, ListRoomUsersResponseDto } from "../../types";
import { useUserActivity } from "./useUserActivity";

interface RoomUsersState {
  users: RoomUserDto[];
  loading: boolean;
  error?: string;
}

export function useRoomUsers(roomId?: string) {
  const [state, setState] = useState<RoomUsersState>({
    users: [],
    loading: false,
    error: undefined,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isActive } = useUserActivity();

  const loadUsers = useCallback(async (silent = false, retryCount = 0) => {
    if (!roomId) return;

    const maxRetries = 2;
    const retryDelay = 1000 * (retryCount + 1); // Exponential backoff: 1s, 2s

    if (!silent) {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: undefined,
      }));
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        // Retry on server errors (5xx) or rate limiting (429)
        if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
          console.warn(`[useRoomUsers] Failed to fetch users (${response.status}), retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            loadUsers(silent, retryCount + 1);
          }, retryDelay);
          return;
        }

        let errorMessage = "Wystąpił błąd podczas ładowania użytkowników";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak dostępu do tego pokoju";
            break;
          case 404:
            errorMessage = "Pokój nie został znaleziony";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        if (!silent) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
        }
        return;
      }

      const data: ListRoomUsersResponseDto = await response.json();
      
      console.log(`[useRoomUsers] Received ${data.users.length} users from API for room ${roomId}`);

      setState((prev) => ({
        ...prev,
        users: data.users,
        loading: false,
        error: undefined,
      }));
    } catch (error) {
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.warn(`[useRoomUsers] Error loading users, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries}):`, error);
        setTimeout(() => {
          loadUsers(silent, retryCount + 1);
        }, retryDelay);
        return;
      }

      if (!silent) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Błąd połączenia. Sprawdź połączenie internetowe",
        }));
      }
    }
  }, [roomId]);

  // Load users on mount and when roomId changes
  useEffect(() => {
    if (roomId) {
      setState((prev) => ({
        ...prev,
        users: [],
        error: undefined,
      }));
      // Force refresh when entering room
      loadUsers(false);
      
      // Also refresh after a short delay to catch any users added during room join
      const delayedRefresh = setTimeout(() => {
        loadUsers(true); // Silent refresh
      }, 2000);
      
      return () => {
        clearTimeout(delayedRefresh);
      };
    }
  }, [roomId, loadUsers]);

  // Auto-refresh users with adaptive interval
  useEffect(() => {
    // Only set up interval on client side
    if (typeof window === "undefined" || !roomId) {
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Adaptive refresh interval for users:
    // - Active user: 15 seconds (reduced load from 5s)
    // - Inactive user: 60 seconds (reduced load from 30s)
    const interval = isActive ? 15000 : 60000;

    console.log(`[useRoomUsers] Starting polling for room ${roomId}, interval: ${interval}ms (active: ${isActive})`);

    intervalRef.current = setInterval(() => {
      loadUsers(true); // Silent refresh
    }, interval);

    // Cleanup interval on unmount or roomId change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [roomId, isActive, loadUsers]);

  const refreshUsers = () => {
    loadUsers();
  };

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    refreshUsers,
  };
}
