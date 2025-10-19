import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
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
import type { VoiceParticipantVM } from "../../types/viewModels";
import type { MemberVM } from "../../types/viewModels";
import { useState } from "react";

// Shared hooks stubs - to be implemented
export const useAuth = () => {
  // TODO: implement authentication hooks (useRegister, useLogin, etc.)
  return {} as Record<string, unknown>;
};

// Invitation hook
export const useInvitation = (link: string) =>
  useQuery<GetInvitationResponseDto, Error>({
    queryKey: ["invitation", link],
    queryFn: async () => {
      const res = await fetch(`/api/invites/${link}`);
      if (!res.ok) throw new Error("Failed to load invitation");
      return res.json();
    },
  });

// Guest session mutation
export const useGuestSession = () =>
  useMutation<GuestSessionResponseDto, Error, CreateGuestSessionCommand>({
    mutationFn: async (cmd: CreateGuestSessionCommand) => {
      const res = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      if (!res.ok) throw new Error("Failed to create guest session");
      return res.json();
    },
  });

// Servers list hook
export const useServers = () =>
  useQuery<GetServerResponseDto[], Error>({
    queryKey: ["servers"],
    queryFn: async () => {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Failed to load servers");
      return res.json();
    },
  });

// Create server mutation
export const useCreateServer = () =>
  useMutation<CreateServerResponseDto, Error, CreateServerCommand>({
    mutationFn: async () => {
      const res = await fetch("/api/servers", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create server");
      return res.json();
    },
  });

// Rooms list hook
export const useRooms = () =>
  useQuery<GetRoomResponseDto[], Error>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed to load rooms");
      return res.json();
    },
  });

// Single room details hook
export const useRoom = (roomId: string) =>
  useQuery<GetRoomResponseDto, Error>({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) throw new Error("Failed to load room details");
      return res.json();
    },
  });

// Messages infinite query hook
export const useMessages = (roomId: string) =>
  useInfiniteQuery<ListMessagesResponseDto, Error>({
    queryKey: ["messages", roomId],
    queryFn: async (context) => {
      const url = context.pageParam
        ? `/api/rooms/${roomId}/messages?page=${context.pageParam}`
        : `/api/rooms/${roomId}/messages`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    getNextPageParam: (lastPage: ListMessagesResponseDto) => lastPage.nextPage,
    initialPageParam: undefined,
  });

// Send message mutation hook
export const useSendMessage = (roomId: string) =>
  useMutation<SendMessageResponseDto, Error, SendMessageCommand>({
    mutationFn: async (cmd: SendMessageCommand) => {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
  });

export const useVoiceToken = (roomId: string) =>
  useMutation<GenerateVoiceTokenResponseDto, Error, GenerateVoiceTokenCommand>({
    mutationFn: async (cmd: GenerateVoiceTokenCommand) => {
      const res = await fetch(`/api/rooms/${roomId}/voice-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmd),
      });
      if (!res.ok) throw new Error("Failed to generate voice token");
      return res.json();
    },
  });

export const useVoiceConnection = () => {
  // TODO: implement live voice connection hook
  return {} as Record<string, unknown>;
};

export const useRoomParticipants = (roomId: string) =>
  useQuery<VoiceParticipantVM[], Error>({
    queryKey: ["participants", roomId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${roomId}/members`);
      if (!res.ok) throw new Error("Failed to load participants");
      return res.json();
    },
  });

export const useAuditLogs = (serverId: string) =>
  useInfiniteQuery<ListAuditLogsResponseDto, Error>({
    queryKey: ["auditLogs", serverId],
    queryFn: async (context) => {
      const url = context.pageParam
        ? `/api/servers/${serverId}/logs?page=${context.pageParam}`
        : `/api/servers/${serverId}/logs`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
    getNextPageParam: (lastPage: ListAuditLogsResponseDto) => lastPage.nextPage,
    initialPageParam: undefined,
  });

export const useUpdateServerMemberRole = (serverId: string, userId: string) =>
  useMutation<undefined, Error, { role: string }>({
    mutationFn: async ({ role }: { role: string }) => {
      const res = await fetch(`/api/servers/${serverId}/members/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update member role");
      return;
    },
  });

export const useServerMembers = (serverId: string) =>
  useQuery<MemberVM[], Error>({
    queryKey: ["serverMembers", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/members`);
      if (!res.ok) throw new Error("Failed to load server members");
      return res.json();
    },
  });

export const useAppSettings = (userId: string) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const exportData = useMutation<DataExportResponseDto, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}/export`);
      if (!res.ok) throw new Error("Failed to export data");
      return res.json();
    },
  });

  const deleteUser = useMutation<undefined, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      return;
    },
  });

  return { theme, toggleTheme, exportData, deleteUser };
};

// TODO: PermissionsContext to be implemented separately
