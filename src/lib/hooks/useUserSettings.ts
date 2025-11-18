import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChangePasswordCommand,
  UpdateUserPreferencesCommand,
  UpdateUserProfileCommand,
  UserSettingsResponseDto,
} from "../../types";
import { useSoundNotifications } from "./useSoundNotifications";

type StatusMap = {
  profile: boolean;
  preferences: boolean;
  password: boolean;
  twoFactor: boolean;
  sessions: boolean;
  dataExport: boolean;
  deleteAccount: boolean;
};

const DEFAULT_STATUS: StatusMap = {
  profile: false,
  preferences: false,
  password: false,
  twoFactor: false,
  sessions: false,
  dataExport: false,
  deleteAccount: false,
};

export function useUserSettings(initial?: UserSettingsResponseDto) {
  const [settings, setSettings] = useState<UserSettingsResponseDto | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMap>(DEFAULT_STATUS);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    updateSettings: updateSoundSettings,
    settings: soundSettings,
  } = useSoundNotifications();

  useEffect(() => {
    if (settings?.preferences?.sound) {
      updateSoundSettings(settings.preferences.sound);
    }
  }, [settings?.preferences?.sound, updateSoundSettings]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Nie udało się załadować ustawień");
      }
      const data: UserSettingsResponseDto = await response.json();
      setSettings(data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }, []);

  const withStatus = useCallback(
    async <T,>(key: keyof StatusMap, action: () => Promise<T>): Promise<T> => {
      setStatus((prev) => ({ ...prev, [key]: true }));
      setError(null);
      setSuccessMessage(null);
      try {
        const result = await action();
        return result;
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Operacja nie powiodła się");
        throw actionError;
      } finally {
        setStatus((prev) => ({ ...prev, [key]: false }));
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (payload: UpdateUserProfileCommand & { avatarData?: string }) => {
      return withStatus("profile", async () => {
        const response = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zapisać profilu");
        }

        const profile = await response.json();
        setSettings((prev) => (prev ? { ...prev, profile } : { profile } as UserSettingsResponseDto));
        setSuccessMessage("Profil został zaktualizowany");
        return profile;
      });
    },
    [withStatus],
  );

  const updatePreferences = useCallback(
    async (payload: UpdateUserPreferencesCommand) => {
      return withStatus("preferences", async () => {
        const response = await fetch("/api/settings/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zapisać preferencji");
        }

        const preferences = await response.json();
        setSettings((prev) =>
          prev ? { ...prev, preferences } : ({ preferences } as UserSettingsResponseDto),
        );
        updateSoundSettings(preferences.sound ?? soundSettings);
        setSuccessMessage("Preferencje zapisane");
        return preferences;
      });
    },
    [withStatus, updateSoundSettings, soundSettings],
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordCommand) => {
      return withStatus("password", async () => {
        const response = await fetch("/api/settings/security", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zmienić hasła");
        }

        setSuccessMessage("Hasło zostało zmienione");
      });
    },
    [withStatus],
  );

  const toggleTwoFactor = useCallback(
    async (enabled: boolean) => {
      return withStatus("twoFactor", async () => {
        const response = await fetch("/api/settings/security", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zmienić ustawień 2FA");
        }

        const data = await response.json();
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                preferences: {
                  ...prev.preferences,
                  privacy: {
                    ...prev.preferences.privacy,
                    twoFactorEnabled: enabled,
                    twoFactorSecret: data.secret ?? prev.preferences.privacy.twoFactorSecret,
                  },
                },
              }
            : prev,
        );
        setSuccessMessage(enabled ? "2FA aktywne" : "2FA wyłączone");
        return data;
      });
    },
    [withStatus],
  );

  const revokeSession = useCallback(
    async (sessionId: string) => {
      return withStatus("sessions", async () => {
        const response = await fetch(`/api/settings/sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Nie udało się zakończyć sesji");
        }

        setSettings((prev) =>
          prev
            ? {
                ...prev,
                sessions: prev.sessions.filter((session) => session.sessionId !== sessionId),
              }
            : prev,
        );
      });
    },
    [withStatus],
  );

  const exportData = useCallback(async () => {
    return withStatus("dataExport", async () => {
      const response = await fetch("/api/settings/export");
      if (!response.ok) {
        throw new Error("Eksport danych nie powiódł się");
      }
      const payload = await response.json();
      return payload.data;
    });
  }, [withStatus]);

  const deleteAccount = useCallback(async (confirm: string) => {
    return withStatus("deleteAccount", async () => {
      const response = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się usunąć konta");
      }
    });
  }, [withStatus]);

  const currentPreferences = useMemo(() => settings?.preferences, [settings]);

  return {
    settings,
    loading,
    error,
    successMessage,
    status,
    refresh,
    updateProfile,
    updatePreferences,
    changePassword,
    toggleTwoFactor,
    revokeSession,
    exportData,
    deleteAccount,
    soundSettings: currentPreferences?.sound,
  };
}

