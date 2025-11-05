// src/types.ts

import type { Tables, Json } from "./db/database.types.ts";

// 1. Authentication & User Management
export interface RegisterUserCommand {
  email: string;
  password: string;
  username: string;
}
export interface RegisterUserResponseDto {
  userId: string;
}

export interface ConfirmEmailCommand {
  token: string;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export type LogoutCommand = Record<string, never>;

export interface PasswordResetRequestCommand {
  email: string;
  captchaToken: string;
}

export interface PasswordResetConfirmCommand {
  token: string;
  newPassword: string;
}

// 2. Guest Session
export interface CreateGuestSessionCommand {
  serverInviteLink: string;
}
export interface GuestSessionResponseDto {
  sessionId: string;
  guestNick: string;
}

// 3. Servers
export interface GetServerResponseDto {
  serverId: string;
  name?: string;
  ttlExpiresAt: string;
}
export interface CreateServerCommand {
  name: string;
}
export interface CreateServerResponseDto {
  serverId: string;
  inviteLink: string;
}
export type DeleteServerCommand = Record<string, never>;

// 4. Rooms
export interface CreateRoomCommand {
  name: string;
  password?: string;
}
export interface CreateRoomResponseDto {
  roomId: string;
  inviteLink: string;
}
export interface GetRoomResponseDto {
  roomId: string;
  name: string;
  requiresPassword: boolean;
  serverInviteLink?: string;
}
export interface JoinRoomCommand {
  password?: string;
}
export type DeleteRoomCommand = Record<string, never>;
export interface UpdateRoomPasswordCommand {
  password: string;
}

// 5. Membership & Roles
export interface UpdateServerMemberRoleCommand {
  role: string;
}
export interface UpdateRoomMemberRoleCommand {
  role: string;
}

// 6. Messages & Chat
export interface MessageDto {
  id: Tables<"messages">["id"];
  userId: Tables<"messages">["user_id"];
  sessionId: Tables<"messages">["session_id"];
  content: Tables<"messages">["content"];
  metadata: Tables<"messages">["metadata"];
  createdAt: Tables<"messages">["created_at"];
  authorName?: string; // Display name for the author
}

export interface ListMessagesResponseDto {
  messages: MessageDto[];
  nextPage?: string;
}

// 7. Room Users
export interface RoomUserDto {
  id: string;
  username: string;
  email?: string;
  role: 'Owner' | 'Admin' | 'Moderator' | 'Member' | 'Guest';
  isOnline: boolean;
  joinedAt: string;
}

export interface ListRoomUsersResponseDto {
  users: RoomUserDto[];
  totalCount: number;
}

export interface SendMessageCommand {
  content: string;
}
export interface SendMessageResponseDto {
  messageId: number;
  createdAt: string;
}

export type DeleteMessageCommand = Record<string, never>;

// 7. Invitation Links
export interface GetInvitationResponseDto {
  type: "server" | "room";
  id: string;
  expiresAt: string | null;
  usesLeft: number;
}

export interface RevokeInvitationCommand {
  expiresAt?: string;
  maxUses?: number;
  revoked: boolean;
}

// 8. Admin Panel (Audit Logs)
export interface AuditLogDto {
  id: Tables<"audit_logs">["id"];
  action: Tables<"audit_logs">["action"];
  actorId: Tables<"audit_logs">["actor_id"];
  targetType: Tables<"audit_logs">["target_type"];
  targetId: Tables<"audit_logs">["target_id"];
  metadata: Tables<"audit_logs">["metadata"];
  createdAt: Tables<"audit_logs">["created_at"];
}

export interface ListAuditLogsResponseDto {
  logs: AuditLogDto[];
  nextPage?: string;
}

// 9. Voice Token
export interface GenerateVoiceTokenCommand {
  permissions: string[];
}
export interface GenerateVoiceTokenResponseDto {
  token: string;
}

// 10. Data Export & DSR
export interface DataExportResponseDto {
  data: Json;
}

export type DeleteUserCommand = Record<string, never>;
