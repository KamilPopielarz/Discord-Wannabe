// Temporarily disabled - @tanstack/react-query not installed
// import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import type {
  CreateGuestSessionCommand,
  GuestSessionResponseDto,
  GetInvitationResponseDto,
  GetServerResponseDto,
  CreateServerCommand,
  CreateServerResponseDto,
  GetRoomResponseDto,
  ListMessagesResponseDto,
  SendMessageCommand,
  SendMessageResponseDto,
  GenerateVoiceTokenCommand,
  GenerateVoiceTokenResponseDto,
  ListAuditLogsResponseDto,
  DataExportResponseDto,
} from "../../types";
// Temporarily disabled imports - types not available
// import type { VoiceParticipantVM } from "../../types/viewModels";
// import type { MemberVM } from "../../types/viewModels";
import { useState } from "react";

// Shared hooks stubs - to be implemented
export const useAuth = () => {
  // TODO: implement authentication hooks (useRegister, useLogin, etc.)
  return {} as Record<string, unknown>;
};

// Invitation hook - temporarily disabled
export const useInvitation = (link: string) => {
  // TODO: Implement with @tanstack/react-query when installed
  return { data: null, isLoading: false, error: null };
};

// Guest session mutation - temporarily disabled
export const useGuestSession = () => {
  // TODO: Implement with @tanstack/react-query when installed
  return { mutate: () => {}, isLoading: false, error: null };
};

// All hooks temporarily disabled - @tanstack/react-query not installed
export const useServers = () => ({ data: [], isLoading: false, error: null });
export const useCreateServer = () => ({ mutate: () => {}, isLoading: false, error: null });
export const useRooms = () => ({ data: [], isLoading: false, error: null });
export const useRoom = (roomId: string) => ({ data: null, isLoading: false, error: null });
export const useMessages = (roomId: string) => ({ data: null, isLoading: false, error: null });
export const useSendMessage = (roomId: string) => ({ mutate: () => {}, isLoading: false, error: null });
export const useVoiceToken = (roomId: string) => ({ mutate: () => {}, isLoading: false, error: null });

export const useVoiceConnection = () => {
  // TODO: implement live voice connection hook
  return {} as Record<string, unknown>;
};

export const useRoomParticipants = (roomId: string) => ({ data: [], isLoading: false, error: null });
export const useAuditLogs = (serverId: string) => ({ data: null, isLoading: false, error: null });
export const useUpdateServerMemberRole = (serverId: string, userId: string) => ({ mutate: () => {}, isLoading: false, error: null });
export const useServerMembers = (serverId: string) => ({ data: [], isLoading: false, error: null });

export const useAppSettings = (userId: string) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const exportData = { mutate: () => {}, isLoading: false, error: null };
  const deleteUser = { mutate: () => {}, isLoading: false, error: null };

  return { theme, toggleTheme, exportData, deleteUser };
};

// TODO: PermissionsContext to be implemented separately
