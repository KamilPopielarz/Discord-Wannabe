import { useState, useEffect } from "react";
import type { CreateRoomCommand, CreateRoomResponseDto, GetServerResponseDto } from "../../types";
import type { RoomsViewModel } from "../../types/viewModels";
import { useUserSettings } from "./useUserSettings";

interface ServerRoomsState extends RoomsViewModel {
  serverInfo?: {
    serverId: string;
    name?: string;
    ttlExpiresAt: string;
  };
  loadingServer: boolean;
}

export function useServerRooms(inviteLink?: string) {
  const { settings } = useUserSettings();
  const [state, setState] = useState<ServerRoomsState>({
    rooms: [],
    loading: false,
    error: undefined,
    serverInfo: undefined,
    loadingServer: false,
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

  const loadServerInfo = async (): Promise<string | null> => {
    if (!inviteLink) return null;

    setState((prev) => ({
      ...prev,
      loadingServer: true,
      error: undefined,
    }));

    try {
      const response = await fetch(`/api/servers/invite/${inviteLink}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas ładowania informacji o serwerze";

        switch (response.status) {
          case 404:
            errorMessage = "Serwer nie został znaleziony lub link wygasł";
            break;
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak dostępu do tego serwera";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          loadingServer: false,
          error: errorMessage,
        }));
        return null;
      }

      const data: GetServerResponseDto = await response.json();

      setState((prev) => ({
        ...prev,
        loadingServer: false,
        serverInfo: {
          serverId: data.serverId,
          name: data.name,
          ttlExpiresAt: data.ttlExpiresAt,
        },
      }));

      return data.serverId;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingServer: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
      return null;
    }
  };

  const loadRooms = async () => {
    if (!inviteLink) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      // Get serverId from serverInfo - if not available, load server info first
      let serverId = state.serverInfo?.serverId;

      if (!serverId) {
        // Need to load server info first to get serverId
        serverId = await loadServerInfo();
      }

      if (!serverId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Nie można pobrać ID serwera",
        }));
        return;
      }

      const response = await fetch(`/api/servers/${serverId}/rooms`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Endpoint pokojów nie istnieje",
        }));
        return;
      }

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas ładowania pokoi";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do przeglądania pokoi";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      const data = await response.json();

      // Transform room data to match RoomsViewModel format
      const transformedRooms = (data.rooms || []).map((room: any) => ({
        roomId: room.roomId,
        inviteLink: room.inviteLink,
        name: room.name,
        requiresPassword: room.requiresPassword,
        isPermanent: room.isPermanent,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
      }));

      setState((prev) => ({
        ...prev,
        loading: false,
        rooms: transformedRooms,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const createRoom = async (roomData: CreateRoomCommand) => {
    if (!state.serverInfo?.serverId) return;

    setCreating(true);

    try {
      const response = await fetch(`/api/servers/${state.serverInfo.serverId}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas tworzenia pokoju";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do tworzenia pokoi";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          case 400:
            errorMessage = "Nieprawidłowe dane pokoju";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        setCreating(false);
        return;
      }

      const data: CreateRoomResponseDto = await response.json();

      // Add new room to the list
      const newRoom = {
        roomId: data.roomId,
        inviteLink: data.inviteLink,
        requiresPassword: !!roomData.password,
      };

      setState((prev) => ({
        ...prev,
        rooms: [newRoom, ...prev.rooms],
        error: undefined,
      }));

      setCreating(false);
      setCreateModalOpen(false);

      // Show success message
      const showSuccess = settings?.preferences.confirmations?.createRoom ?? true;
      
      if (showSuccess) {
        alert(`Pokój "${roomData.name}" utworzony pomyślnie!\nLink zaproszeniowy: ${data.inviteLink}`);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
      setCreating(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten pokój? Ta akcja jest nieodwracalna.")) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas usuwania pokoju";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do usuwania tego pokoju";
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

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
        return;
      }

      // Remove room from the list
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((room) => room.roomId !== roomId),
        error: undefined,
      }));

      alert("Pokój został usunięty pomyślnie");
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
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
    deleteRoom,
  };
}
