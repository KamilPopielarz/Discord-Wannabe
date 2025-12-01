import { useState, useEffect } from "react";
import type { CreateServerCommand, CreateServerResponseDto } from "../../types";
import type { ServersViewModel } from "../../types/viewModels";

export function useServers() {
  const [state, setState] = useState<ServersViewModel>({
    servers: [],
    loading: false,
    error: undefined,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      // Note: This endpoint might not exist yet, but we're preparing for it
      // For now, we'll simulate with empty array or handle 404
      const response = await fetch("/api/servers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        // Endpoint doesn't exist yet, use empty array
        setState((prev) => ({
          ...prev,
          loading: false,
          servers: [],
        }));
        return;
      }

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas ładowania serwerów";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do przeglądania serwerów";
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

      setState((prev) => ({
        ...prev,
        loading: false,
        servers: data.servers || [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const createServer = async (serverData: CreateServerCommand) => {
    setCreating(true);

    try {
      const payload: CreateServerCommand = {
        name: serverData.name,
      };

      const response = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas tworzenia serwera";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do tworzenia serwerów";
            break;
          case 429:
            errorMessage = "Za dużo żądań. Spróbuj ponownie później";
            break;
          case 400:
            errorMessage = "Nieprawidłowe dane serwera";
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

      const data: CreateServerResponseDto = await response.json();

      // Add new server to the list immediately for instant UI feedback
      const newServer = {
        serverId: data.serverId,
        inviteLink: data.inviteLink,
        name: serverData.name,
        ttlExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
        isMember: true, // Creator is automatically a member
        role: "Owner", // Creator gets Owner role
      };

      setState((prev) => ({
        ...prev,
        servers: [newServer, ...prev.servers],
        error: undefined,
      }));

      setCreating(false);
      setCreateModalOpen(false);

      // Reload servers list in the background to ensure UI is synced with server state
      // Use setTimeout to avoid blocking the UI update
      setTimeout(() => {
        loadServers().catch((error) => {
          console.error("Failed to reload servers list:", error);
        });
      }, 100);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
      setCreating(false);
    }
  };

  const deleteServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas usuwania serwera";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień do usuwania tego serwera";
            break;
          case 404:
            errorMessage = "Serwer nie został znaleziony";
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

      // Remove server from the list
      setState((prev) => ({
        ...prev,
        servers: prev.servers.filter((server) => server.serverId !== serverId),
        error: undefined,
      }));
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
    loadServers,
    createServer,
    deleteServer,
  };
}
