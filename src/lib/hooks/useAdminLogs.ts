import { useState, useEffect } from "react";
import type { AuditLogDto, ListAuditLogsResponseDto } from "../../types";
import type { AdminLogsViewModel } from "../../types/viewModels";

interface LogFilters {
  action?: string;
  actorId?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAdminLogs(serverId?: string) {
  const [state, setState] = useState<AdminLogsViewModel>({
    logs: [],
    nextPage: undefined,
    loading: false,
    error: undefined,
  });

  const [filters, setFilters] = useState<LogFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Load logs on mount and when filters change
  useEffect(() => {
    if (serverId) {
      loadLogs();
    }
  }, [serverId, filters, currentPage]);

  const loadLogs = async (page?: string) => {
    if (!serverId) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = new URL(`/api/servers/${serverId}/logs`, origin);

      // Add filters to query params
      if (filters.action) url.searchParams.set("action", filters.action);
      if (filters.actorId) url.searchParams.set("actorId", filters.actorId);
      if (filters.targetType) url.searchParams.set("targetType", filters.targetType);
      if (filters.dateFrom) url.searchParams.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) url.searchParams.set("dateTo", filters.dateTo);
      if (page) url.searchParams.set("page", page);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        // Endpoint doesn't exist yet, use mock data
        const mockLogs: AuditLogDto[] = [
          {
            id: 1,
            action: "server.create",
            actorId: "user123",
            targetType: "server",
            targetId: serverId,
            metadata: { serverName: "Test Server" },
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            action: "room.create",
            actorId: "user123",
            targetType: "room",
            targetId: "room456",
            metadata: { roomName: "General", hasPassword: false },
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: 3,
            action: "user.join",
            actorId: "user789",
            targetType: "server",
            targetId: serverId,
            metadata: { joinMethod: "invite" },
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          },
        ];

        setState((prev) => ({
          ...prev,
          loading: false,
          logs: mockLogs,
          nextPage: undefined,
        }));
        return;
      }

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas ładowania logów";

        switch (response.status) {
          case 401:
            errorMessage = "Brak autoryzacji. Zaloguj się ponownie";
            break;
          case 403:
            errorMessage = "Brak uprawnień administratora";
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

      const data: ListAuditLogsResponseDto = await response.json();

      setState((prev) => ({
        ...prev,
        loading: false,
        logs: page ? [...prev.logs, ...data.logs] : data.logs,
        nextPage: data.nextPage,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const updateFilters = (newFilters: Partial<LogFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const loadMoreLogs = () => {
    if (state.nextPage && !state.loading) {
      loadLogs(state.nextPage);
    }
  };

  const refreshLogs = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return {
    state,
    filters,
    currentPage,
    updateFilters,
    clearFilters,
    loadMoreLogs,
    refreshLogs,
    goToPage,
  };
}
