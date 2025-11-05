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

  const loadUsers = useCallback(async (silent = false) => {
    if (!roomId) return;

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
      });

      if (!response.ok) {
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

      setState((prev) => ({
        ...prev,
        users: data.users,
        loading: false,
        error: undefined,
      }));
    } catch (error) {
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
      loadUsers();
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
    // - Active user: 10 seconds (users change less frequently than messages)
    // - Inactive user: 30 seconds
    const interval = isActive ? 10000 : 30000;

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
