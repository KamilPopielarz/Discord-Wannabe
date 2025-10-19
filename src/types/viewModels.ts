// src/types/viewModels.ts

import type { MessageDto, AuditLogDto } from '../types';

// Auth ViewModels
export interface AuthViewModel {
  email: string;
  password: string;
  loading: boolean;
  error?: string;
}

export interface RegisterViewModel extends AuthViewModel {
  username: string;
  confirmPassword: string;
  captchaToken: string;
}

// Guest ViewModels
export interface GuestJoinViewModel {
  inviteLink: string;
  loading: boolean;
  error?: string;
  guestNick?: string;
}

// Servers ViewModels
export interface ServersViewModel {
  servers: Array<{
    serverId: string;
    inviteLink: string;
    name?: string;
    ttlExpiresAt: string;
  }>;
  loading: boolean;
  error?: string;
}

// Rooms ViewModels
export interface RoomsViewModel {
  rooms: Array<{
    roomId: string;
    name: string;
    inviteLink: string;
    requiresPassword: boolean;
    isPermanent?: boolean;
    createdAt?: string;
    lastActivity?: string;
  }>;
  loading: boolean;
  error?: string;
}

// Chat ViewModels
export interface ChatViewModel {
  messages: MessageDto[];
  nextPage?: string;
  sending: boolean;
  error?: string;
}

// Voice ViewModels
export interface VoiceViewModel {
  connected: boolean;
  token?: string;
  permissions?: string[];
  error?: string;
}

// Admin ViewModels
export interface AdminLogsViewModel {
  logs: AuditLogDto[];
  nextPage?: string;
  loading: boolean;
  error?: string;
}