export interface RoomInfoVM {
  roomId: string;
  requiresPassword: boolean;
}

export interface ChatMessageVM {
  id: number;
  userId: string;
  sessionId: string;
  content: string;
  metadata: unknown;
  createdAt: string;
}

export interface VoiceParticipantVM {
  userId: string;
  participantId: string;
  status: "connected" | "disconnected";
}

export interface MemberVM {
  userId: string;
  role: string;
}

export interface ServerVM {
  serverId: string;
  name?: string;
  ttlExpiresAt: string;
  inviteLink?: string;
}

export interface InvitationVM {
  type: "server" | "room";
  id: string;
  expiresAt: string | null;
  usesLeft: number;
}

export interface AuditLogVM {
  id: number;
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
}
