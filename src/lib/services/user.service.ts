import { Buffer } from "node:buffer";
import type { PostgrestError } from "@supabase/supabase-js";
import type { DatabaseSupabaseClient } from "../../db/supabase.client.ts";
import { supabaseAdminClient, supabaseClient } from "../../db/supabase.client.ts";
import type { Json } from "../../db/database.types.ts";
import type {
  ChangePasswordCommand,
  DeleteAccountCommand,
  RevokeSessionCommand,
  ToggleTwoFactorCommand,
  UpdateUserPreferencesCommand,
  UpdateUserProfileCommand,
  UserPreferencesDto,
  UserProfileDto,
  UserSessionSummaryDto,
  UserSettingsResponseDto,
} from "../../types";

const DEFAULT_PROFILE = (username: string): UserProfileDto => ({
  username,
  displayName: username,
  status: null,
  bio: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  avatarUrl: null,
  socialLinks: [],
});

const DEFAULT_PREFERENCES: UserPreferencesDto = {
  notifications: {
    push: true,
    email: true,
    mentions: true,
    digest: "daily",
  },
  appearance: {
    theme: "system",
    fontScale: 1,
    highContrast: false,
    reducedMotion: false,
    chatDensity: "comfortable",
  },
  privacy: {
    showPresence: true,
    autoMuteVoice: false,
    autoDeafenVoice: false,
    allowDmFromNonMutual: true,
    shareActivityInsights: false,
    twoFactorEnabled: false,
    twoFactorSecret: null,
  },
  sound: {
    enabled: true,
    volume: 0.5,
    messageSound: true,
    typingSound: false,
    userJoinSound: true,
  },
};

const mergePreferences = (
  base: UserPreferencesDto,
  patch: UpdateUserPreferencesCommand,
): UserPreferencesDto => ({
  notifications: { ...base.notifications, ...(patch.notifications ?? {}) },
  appearance: { ...base.appearance, ...(patch.appearance ?? {}) },
  privacy: { ...base.privacy, ...(patch.privacy ?? {}) },
  sound: { ...base.sound, ...(patch.sound ?? {}) },
});

const serializeProfilePayload = (userId: string, payload: UpdateUserProfileCommand) => ({
  user_id: userId,
  username: payload.username,
  display_name: payload.displayName ?? null,
  status: payload.status ?? null,
  bio: payload.bio ?? null,
  timezone: payload.timezone ?? null,
  avatar_url: payload.avatarUrl ?? null,
  social: payload.socialLinks ?? [],
});

export class UserService {
  constructor(
    private readonly supabase: DatabaseSupabaseClient,
    private readonly adminClient = supabaseAdminClient,
  ) {}

  async getSettings(
    userId: string,
    options?: { fallbackUsername?: string; currentSessionId?: string; email?: string },
  ): Promise<UserSettingsResponseDto> {
    const [profile, preferences, sessions] = await Promise.all([
      this.getProfile(userId, options),
      this.getPreferences(userId),
      this.listSessions(userId, options?.currentSessionId),
    ]);

    return { profile, preferences, sessions };
  }

  async getProfile(
    userId: string,
    options?: { fallbackUsername?: string; email?: string },
  ): Promise<UserProfileDto> {
    const fallback =
      options?.fallbackUsername ||
      options?.email?.split("@")[0] ||
      `user-${userId.slice(-6).toLowerCase()}`;

    try {
      const { data, error } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (this.isMissingTableError(error, "user_profiles")) {
          console.warn("[UserService] user_profiles table missing, loading from metadata");
          return await this.getProfileFromMetadata(userId, fallback);
        }
        throw new Error(`Failed to load profile: ${error.message}`);
      }

      if (!data) {
        const defaults = DEFAULT_PROFILE(fallback);
        try {
          await this.supabase
            .from("user_profiles")
            .insert({ user_id: userId, username: defaults.username, social: [] })
            .throwOnError();
        } catch (insertError) {
          if (this.isMissingTableError(insertError, "user_profiles")) {
            console.warn("[UserService] user_profiles table missing during insert, using metadata");
            return await this.getProfileFromMetadata(userId, fallback);
          }
          throw insertError;
        }

        await this.saveProfileToMetadata(userId, defaults);
        return defaults;
      }

      const mapped = await this.mapProfileRow(data);
      await this.saveProfileToMetadata(userId, mapped);
      return mapped;
    } catch (error) {
      if (this.isMissingTableError(error, "user_profiles")) {
        return await this.getProfileFromMetadata(userId, fallback);
      }
      throw error;
    }
  }

  async updateProfile(userId: string, payload: UpdateUserProfileCommand): Promise<UserProfileDto> {
    const upsertPayload = serializeProfilePayload(userId, payload);
    try {
      const { data, error } = await this.supabase
        .from("user_profiles")
        .upsert(upsertPayload, { onConflict: "user_id" })
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (this.isMissingTableError(error, "user_profiles")) {
          console.warn("[UserService] user_profiles table missing, skipping persistence");
          const fallbackProfile = {
            username: payload.username,
            displayName: payload.displayName ?? payload.username,
            status: payload.status ?? null,
            bio: payload.bio ?? null,
            timezone: payload.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
            avatarUrl: payload.avatarUrl ?? null,
            socialLinks: payload.socialLinks ?? [],
            updatedAt: new Date().toISOString(),
          };
          await this.saveProfileToMetadata(userId, fallbackProfile);
          return fallbackProfile;
        }
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      const mapped = await this.mapProfileRow(data);
      await this.saveProfileToMetadata(userId, mapped);
      return mapped;
    } catch (error) {
      if (this.isMissingTableError(error, "user_profiles")) {
        console.warn("[UserService] user_profiles table missing while updating, returning payload");
        const fallbackProfile = {
          username: payload.username,
          displayName: payload.displayName ?? payload.username,
          status: payload.status ?? null,
          bio: payload.bio ?? null,
          timezone: payload.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          avatarUrl: payload.avatarUrl ?? null,
          socialLinks: payload.socialLinks ?? [],
          updatedAt: new Date().toISOString(),
        };
        await this.saveProfileToMetadata(userId, fallbackProfile);
        return fallbackProfile;
      }
      throw error;
    }
  }

  async getPreferences(userId: string): Promise<UserPreferencesDto> {
    try {
      const { data, error } = await this.supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        if (this.isMissingTableError(error, "user_preferences")) {
          console.warn("[UserService] user_preferences table missing, returning metadata/defaults");
          return (await this.getPreferencesFromMetadata(userId)) ?? DEFAULT_PREFERENCES;
        }
        throw new Error(`Failed to load preferences: ${error.message}`);
      }

      if (!data) {
        try {
          await this.supabase.from("user_preferences").insert({ user_id: userId }).throwOnError();
        } catch (insertError) {
          if (this.isMissingTableError(insertError, "user_preferences")) {
            console.warn("[UserService] user_preferences table missing during insert, returning defaults");
            return (await this.getPreferencesFromMetadata(userId)) ?? DEFAULT_PREFERENCES;
          }
          throw insertError;
        }
        return DEFAULT_PREFERENCES;
      }

      return this.mapPreferencesRow(data);
    } catch (error) {
      if (this.isMissingTableError(error, "user_preferences")) {
        return (await this.getPreferencesFromMetadata(userId)) ?? DEFAULT_PREFERENCES;
      }
      throw error;
    }
  }

  async updatePreferences(
    userId: string,
    payload: UpdateUserPreferencesCommand,
  ): Promise<UserPreferencesDto> {
    const existing = await this.getPreferences(userId);
    const merged = mergePreferences(existing, payload);

    try {
      const { error } = await this.supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          notifications: merged.notifications,
          appearance: merged.appearance,
          privacy: merged.privacy,
          sound: merged.sound,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        if (this.isMissingTableError(error, "user_preferences")) {
          console.warn("[UserService] user_preferences table missing, storing metadata instead");
          await this.savePreferencesToMetadata(userId, merged);
          return merged;
        }
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      await this.savePreferencesToMetadata(userId, merged);
      return merged;
    } catch (error) {
      if (this.isMissingTableError(error, "user_preferences")) {
        console.warn("[UserService] user_preferences table missing while updating, storing metadata");
        await this.savePreferencesToMetadata(userId, merged);
        return merged;
      }
      throw error;
    }
  }

  async listSessions(userId: string, currentSessionId?: string): Promise<UserSessionSummaryDto[]> {
    const { data, error } = await this.supabase
      .from("auth_sessions")
      .select("session_id, created_at, last_seen, ip_address, user_agent")
      .eq("user_id", userId)
      .order("last_seen", { ascending: false });

    if (error) {
      throw new Error(`Failed to load sessions: ${error.message}`);
    }

    return (data ?? []).map((session) => ({
      sessionId: session.session_id,
      createdAt: session.created_at,
      lastSeen: session.last_seen,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      current: currentSessionId ? session.session_id === currentSessionId : false,
    }));
  }

  async revokeSession(
    userId: string,
    { sessionId }: RevokeSessionCommand,
    currentSessionId?: string,
  ): Promise<void> {
    if (currentSessionId && sessionId === currentSessionId) {
      throw new Error("Nie możesz zakończyć bieżącej sesji.");
    }

    const { error } = await this.supabase
      .from("auth_sessions")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to revoke session: ${error.message}`);
    }
  }

  async changePassword(
    userId: string,
    command: ChangePasswordCommand,
    userEmail?: string | null,
  ): Promise<void> {
    if (userEmail && supabaseClient) {
      const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
        email: userEmail,
        password: command.currentPassword,
      });

      if (verifyError) {
        throw new Error("Obecne hasło jest nieprawidłowe");
      }
    }

    const { error } = await this.supabase.auth.updateUser({ password: command.newPassword });

    if (error) {
      throw new Error(`Nie udało się zmienić hasła: ${error.message}`);
    }

    if (this.adminClient) {
      await this.adminClient.from("auth_sessions").delete().eq("user_id", userId);
    }
  }

  async toggleTwoFactor(userId: string, command: ToggleTwoFactorCommand): Promise<string | null> {
    const preferences = await this.getPreferences(userId);
    const nextSecret =
      command.enabled && !preferences.privacy.twoFactorSecret
        ? await this.generateTotpSecret()
        : preferences.privacy.twoFactorSecret ?? null;

    const updated = await this.updatePreferences(userId, {
      privacy: {
        ...preferences.privacy,
        twoFactorEnabled: command.enabled,
        twoFactorSecret: nextSecret,
      },
    });

    return command.enabled ? updated.privacy.twoFactorSecret ?? nextSecret : null;
  }

  async exportData(userId: string): Promise<Json> {
    const [profile, preferences, servers, rooms] = await Promise.all([
      this.getProfile(userId),
      this.getPreferences(userId),
      this.supabase.from("user_server").select("server_id, role").eq("user_id", userId),
      this.supabase
        .from("user_room")
        .select("room_id, role, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      preferences,
      memberships: servers.data ?? [],
      rooms: rooms.data ?? [],
    };
  }

  async deleteAccount(userId: string, _command: DeleteAccountCommand): Promise<void> {
    await this.supabase.from("user_profiles").delete().eq("user_id", userId);
    await this.supabase.from("user_preferences").delete().eq("user_id", userId);
    await this.supabase.from("auth_sessions").delete().eq("user_id", userId);

    if (this.adminClient) {
      await this.adminClient.auth.admin.deleteUser(userId);
    }
  }

  async uploadAvatarFromBase64(userId: string, dataUrl: string): Promise<string> {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Nieprawidłowy format obrazu");
    }
    const [, mime, base64] = matches;
    const buffer = Buffer.from(base64, "base64");
    return await this.uploadAvatarBuffer(userId, buffer, mime);
  }

  async uploadAvatarFromFile(userId: string, file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    return await this.uploadAvatarBuffer(
      userId,
      Buffer.from(arrayBuffer),
      file.type || "image/png",
    );
  }

  private async uploadAvatarBuffer(
    userId: string,
    buffer: Buffer,
    contentType?: string,
  ): Promise<string> {
    if (!this.adminClient) {
      throw new Error("Admin client nie jest dostępny. Skontaktuj się z administratorem.");
    }

    const extension = contentType?.split("/")[1] ?? "png";
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    
    // Use admin client to bypass RLS - admin client has full access
    const { error } = await this.adminClient.storage
      .from("avatars")
      .upload(path, buffer, {
        upsert: true,
        contentType: contentType ?? "image/png",
      });

    if (error) {
      console.error("[UserService] Failed to upload avatar buffer", error);
      const message = error.message ?? "";

      if (message.toLowerCase().includes("row-level security")) {
        throw new Error(
          "Brak uprawnień do przesłania avatara. Skontaktuj się z administratorem.",
        );
      }

      throw new Error(`Nie udało się przesłać avatara: ${message || "nieznany błąd"}`);
    }

    // Set owner after upload so RLS policies work correctly for read operations
    // Admin client bypasses RLS, but we set owner so regular client can read the file
    if (this.adminClient) {
      try {
        // Use PostgREST to update storage.objects directly
        const { error: updateError } = await (this.adminClient as any)
          .schema("storage")
          .from("objects")
          .update({ owner: userId })
          .eq("bucket_id", "avatars")
          .eq("name", path);

        if (updateError) {
          console.warn("[UserService] Failed to set avatar owner:", updateError);
          // Don't throw - file was uploaded successfully, owner is optional
          // Admin client can still access the file for read operations
        }
      } catch (error) {
        console.warn("[UserService] Could not set avatar owner, but file uploaded successfully:", error);
        // Don't throw - file was uploaded successfully, owner is optional
      }
    }

    return path;
  }

  private async mapProfileRow(row: {
    username: string;
    display_name: string | null;
    status: string | null;
    bio: string | null;
    timezone: string | null;
    avatar_url: string | null;
    social: unknown;
    updated_at: string;
  }): Promise<UserProfileDto> {
    const socialLinks = Array.isArray(row.social)
      ? (row.social as UserProfileDto["socialLinks"])
      : [];
    const avatarUrl = await this.resolveAvatarUrl(row.avatar_url);

    return {
      username: row.username,
      displayName: row.display_name,
      status: row.status,
      bio: row.bio,
      timezone: row.timezone,
      avatarUrl,
      socialLinks: socialLinks ?? [],
      updatedAt: row.updated_at,
    };
  }

  private mapPreferencesRow(row: {
    notifications: UserPreferencesDto["notifications"];
    appearance: UserPreferencesDto["appearance"];
    privacy: UserPreferencesDto["privacy"];
    sound: UserPreferencesDto["sound"];
    updated_at: string;
  }): UserPreferencesDto {
    return {
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...row.notifications },
      appearance: { ...DEFAULT_PREFERENCES.appearance, ...row.appearance },
      privacy: { ...DEFAULT_PREFERENCES.privacy, ...row.privacy },
      sound: { ...DEFAULT_PREFERENCES.sound, ...row.sound },
      updatedAt: row.updated_at,
    };
  }

  private async generateTotpSecret(): Promise<string> {
    const crypto = await import("node:crypto");
    return crypto.randomBytes(10).toString("hex").toUpperCase();
  }

  private async resolveAvatarUrl(avatarPath?: string | null): Promise<string | null> {
    if (!avatarPath) {
      return null;
    }

    if (avatarPath.includes("://")) {
      return avatarPath;
    }

    try {
      // Use admin client if available to bypass RLS when signing URL
      // This ensures we can display the avatar even if the user doesn't own the file record
      const client = this.adminClient || this.supabase;
      const { data, error } = await client.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 60 * 60 * 24 * 7);
      if (error) {
        console.warn("[UserService] Failed to sign avatar url:", error);
        return null;
      }
      return data?.signedUrl ?? null;
    } catch (storageError) {
      console.error("[UserService] Storage error:", storageError);
      return null;
    }
  }

  private isMissingTableError(error: unknown, table: string): boolean {
    if (typeof error !== "object" || !error) return false;
    const maybeError = error as Partial<PostgrestError>;
    return (
      typeof maybeError.code === "string" &&
      maybeError.code === "42P01" &&
      (maybeError.message?.includes(table) ?? false)
    );
  }

  private async getProfileFromMetadata(
    userId: string,
    fallbackUsername: string,
  ): Promise<UserProfileDto> {
    const metadata = await this.getUserMetadata(userId);
    const profile = (metadata?.profile as UserProfileDto | undefined) ?? null;
    if (!profile) {
      return DEFAULT_PROFILE(fallbackUsername);
    }
    return {
      username: profile.username || fallbackUsername,
      displayName: profile.displayName || profile.username || fallbackUsername,
      status: profile.status ?? null,
      bio: profile.bio ?? null,
      timezone: profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatarUrl: profile.avatarUrl ?? (metadata?.avatar_url as string | null) ?? null,
      socialLinks: profile.socialLinks ?? [],
      updatedAt: profile.updatedAt ?? new Date().toISOString(),
    };
  }

  private async saveProfileToMetadata(userId: string, profile: UserProfileDto): Promise<void> {
    await this.updateUserMetadata(userId, {
      profile,
      username: profile.username,
      avatar_url: profile.avatarUrl ?? null,
    });
  }

  private async getPreferencesFromMetadata(userId: string): Promise<UserPreferencesDto | null> {
    const metadata = await this.getUserMetadata(userId);
    const stored = metadata?.preferences as UserPreferencesDto | undefined;
    if (!stored) return null;
    return {
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...stored.notifications },
      appearance: { ...DEFAULT_PREFERENCES.appearance, ...stored.appearance },
      privacy: { ...DEFAULT_PREFERENCES.privacy, ...stored.privacy },
      sound: { ...DEFAULT_PREFERENCES.sound, ...stored.sound },
      updatedAt: stored.updatedAt ?? new Date().toISOString(),
    };
  }

  private async savePreferencesToMetadata(
    userId: string,
    preferences: UserPreferencesDto,
  ): Promise<void> {
    await this.updateUserMetadata(userId, {
      preferences: {
        ...preferences,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  private async getUserMetadata(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.adminClient) return null;
    try {
      const { data, error } = await this.adminClient.auth.admin.getUserById(userId);
      if (error || !data.user) {
        return null;
      }
      return (data.user.user_metadata as Record<string, unknown>) ?? {};
    } catch {
      return null;
    }
  }

  private async updateUserMetadata(
    userId: string,
    metadataPatch: Record<string, unknown>,
  ): Promise<void> {
    if (!this.adminClient) return;
    const existing = await this.getUserMetadata(userId);
    try {
      await this.adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(existing ?? {}),
          ...metadataPatch,
        },
      });
    } catch (error) {
      console.error("[UserService] Failed to update user metadata:", error);
    }
  }
}

