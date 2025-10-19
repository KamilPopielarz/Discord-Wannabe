import { useState, useEffect } from 'react';
import type { JoinRoomCommand, GetRoomResponseDto } from '../../types';

interface RoomJoinState {
  roomInfo?: {
    roomId: string;
    requiresPassword: boolean;
  };
  loadingRoom: boolean;
  joining: boolean;
  error?: string;
  password: string;
  joined: boolean;
}

export function useRoomJoin(inviteLink?: string) {
  const [state, setState] = useState<RoomJoinState>({
    roomInfo: undefined,
    loadingRoom: false,
    joining: false,
    error: undefined,
    password: '',
    joined: false
  });

  // Load room info on mount
  useEffect(() => {
    if (inviteLink) {
      loadRoomInfo();
    }
  }, [inviteLink]);

  const loadRoomInfo = async () => {
    if (!inviteLink) return;

    setState(prev => ({
      ...prev,
      loadingRoom: true,
      error: undefined
    }));

    try {
      const response = await fetch(`/api/rooms${inviteLink}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas ładowania informacji o pokoju';
        
        switch (response.status) {
          case 404:
            errorMessage = 'Pokój nie został znaleziony lub link wygasł';
            break;
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
          loadingRoom: false,
          error: errorMessage
        }));
        return;
      }

      const data: GetRoomResponseDto = await response.json();
      
      setState(prev => ({
        ...prev,
        loadingRoom: false,
        roomInfo: {
          roomId: data.roomId,
          requiresPassword: data.requiresPassword
        }
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingRoom: false,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const updatePassword = (password: string) => {
    setState(prev => ({
      ...prev,
      password,
      error: undefined // Clear error when user types
    }));
  };

  const joinRoom = async () => {
    if (!state.roomInfo) return;

    // Early return for validation
    if (state.roomInfo.requiresPassword && !state.password.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Hasło jest wymagane do dołączenia do tego pokoju'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      joining: true,
      error: undefined
    }));

    try {
      const payload: JoinRoomCommand = {
        ...(state.roomInfo.requiresPassword ? { password: state.password.trim() } : {})
      };

      const response = await fetch(`/api/rooms/${state.roomInfo.roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas dołączania do pokoju';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Nieprawidłowe hasło pokoju';
            break;
          case 403:
            errorMessage = 'Brak dostępu do tego pokoju';
            break;
          case 404:
            errorMessage = 'Pokój nie został znaleziony';
            break;
          case 429:
            errorMessage = 'Za dużo prób dołączenia. Spróbuj ponownie później';
            break;
          case 400:
            errorMessage = 'Nieprawidłowe dane dołączenia';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          joining: false,
          error: errorMessage
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        joining: false,
        joined: true,
        error: undefined
      }));

      // Success - redirect to chat view after a short delay
      setTimeout(() => {
        window.location.href = `/rooms${inviteLink}?view=chat`;
      }, 1000);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        joining: false,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const retryLoadRoom = () => {
    loadRoomInfo();
  };

  return {
    state,
    updatePassword,
    joinRoom,
    retryLoadRoom
  };
}
