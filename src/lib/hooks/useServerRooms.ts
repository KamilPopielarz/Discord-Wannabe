import { useState, useEffect } from 'react';
import type { CreateRoomCommand, CreateRoomResponseDto, GetServerResponseDto } from '../../types';
import type { RoomsViewModel } from '../../types/viewModels';

interface ServerRoomsState extends RoomsViewModel {
  serverInfo?: {
    serverId: string;
    name?: string;
    ttlExpiresAt: string;
  };
  loadingServer: boolean;
}

export function useServerRooms(inviteLink?: string) {
  const [state, setState] = useState<ServerRoomsState>({
    rooms: [],
    loading: false,
    error: undefined,
    serverInfo: undefined,
    loadingServer: false
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load server info and rooms on mount
  useEffect(() => {
    if (inviteLink) {
      loadServerInfo();
      loadRooms();
    }
  }, [inviteLink]);

  const loadServerInfo = async () => {
    if (!inviteLink) return;

    setState(prev => ({
      ...prev,
      loadingServer: true,
      error: undefined
    }));

    try {
      const response = await fetch(`/api/servers${inviteLink}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas ładowania informacji o serwerze';
        
        switch (response.status) {
          case 404:
            errorMessage = 'Serwer nie został znaleziony lub link wygasł';
            break;
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak dostępu do tego serwera';
            break;
          case 429:
            errorMessage = 'Za dużo żądań. Spróbuj ponownie później';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          loadingServer: false,
          error: errorMessage
        }));
        return;
      }

      const data: GetServerResponseDto = await response.json();
      
      setState(prev => ({
        ...prev,
        loadingServer: false,
        serverInfo: {
          serverId: data.serverId,
          name: data.name,
          ttlExpiresAt: data.ttlExpiresAt
        }
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingServer: false,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const loadRooms = async () => {
    if (!inviteLink) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: undefined
    }));

    try {
      // Note: This endpoint might not exist yet, simulate for now
      // For now, we'll use a placeholder serverId since we might not have serverInfo yet
      const serverId = state.serverInfo?.serverId || 'placeholder';
      const response = await fetch(`/api/servers/${serverId}/rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // Endpoint doesn't exist yet, use empty array
        setState(prev => ({
          ...prev,
          loading: false,
          rooms: []
        }));
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas ładowania pokoi';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak uprawnień do przeglądania pokoi';
            break;
          case 429:
            errorMessage = 'Za dużo żądań. Spróbuj ponownie później';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        return;
      }

      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        loading: false,
        rooms: data.rooms || []
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  const createRoom = async (roomData: CreateRoomCommand) => {
    if (!state.serverInfo?.serverId) return;

    setCreating(true);

    try {
      const response = await fetch(`/api/servers/${state.serverInfo.serverId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas tworzenia pokoju';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak uprawnień do tworzenia pokoi';
            break;
          case 429:
            errorMessage = 'Za dużo żądań. Spróbuj ponownie później';
            break;
          case 400:
            errorMessage = 'Nieprawidłowe dane pokoju';
            break;
          default:
            errorMessage = 'Błąd serwera. Spróbuj ponownie później';
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
        setCreating(false);
        return;
      }

      const data: CreateRoomResponseDto = await response.json();
      
      // Add new room to the list
      const newRoom = {
        roomId: data.roomId,
        inviteLink: data.inviteLink,
        requiresPassword: !!roomData.password
      };

      setState(prev => ({
        ...prev,
        rooms: [newRoom, ...prev.rooms],
        error: undefined
      }));

      setCreating(false);
      setCreateModalOpen(false);

      // Show success message and copy invite link
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(data.inviteLink);
          alert(`Pokój "${roomData.name}" utworzony pomyślnie!\nLink zaproszeniowy skopiowany do schowka: ${data.inviteLink}`);
        } catch {
          alert(`Pokój "${roomData.name}" utworzony pomyślnie!\nLink zaproszeniowy: ${data.inviteLink}`);
        }
      } else {
        alert(`Pokój "${roomData.name}" utworzony pomyślnie!\nLink zaproszeniowy: ${data.inviteLink}`);
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
      setCreating(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten pokój? Ta akcja jest nieodwracalna.')) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Wystąpił błąd podczas usuwania pokoju';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Brak autoryzacji. Zaloguj się ponownie';
            break;
          case 403:
            errorMessage = 'Brak uprawnień do usuwania tego pokoju';
            break;
          case 404:
            errorMessage = 'Pokój nie został znaleziony';
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

      // Remove room from the list
      setState(prev => ({
        ...prev,
        rooms: prev.rooms.filter(room => room.roomId !== roomId),
        error: undefined
      }));

      alert('Pokój został usunięty pomyślnie');
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Błąd połączenia. Sprawdź połączenie internetowe'
      }));
    }
  };

  return {
    state,
    createModalOpen,
    setCreateModalOpen,
    creating,
    loadServerInfo,
    loadRooms,
    createRoom,
    deleteRoom
  };
}
