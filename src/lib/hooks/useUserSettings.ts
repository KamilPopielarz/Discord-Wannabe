import { useCallback, useEffect, useState } from "react";
import type {
  ChangePasswordCommand,
  UpdateUserPreferencesCommand,
  UpdateUserProfileCommand,
  UserSettingsResponseDto,
} from "../../types";

type StatusMap = {
  profile: boolean;
  password: boolean;
  preferences: boolean;
};

const DEFAULT_STATUS: StatusMap = {
  profile: false,
  password: false,
  preferences: false,
};

export function useUserSettings(initial?: UserSettingsResponseDto) {
  const [settings, setSettings] = useState<UserSettingsResponseDto | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMap>(DEFAULT_STATUS);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!initial) {
      refresh();
    }
  }, [initial, refresh]);

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

  const updatePreferences = useCallback(
    async (payload: UpdateUserPreferencesCommand) => {
      return withStatus("preferences", async () => {
        const response = await fetch("/api/settings/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zapisać ustawień");
        }

        const preferences = await response.json();
        setSettings((prev) =>
          prev
            ? { ...prev, preferences }
            : ({ preferences } as UserSettingsResponseDto),
        );
        setSuccessMessage("Ustawienia zostały zaktualizowane");
        return preferences;
      });
    },
    [withStatus],
  );

  return {
    settings,
    loading,
    error,
    successMessage,
    status,
    refresh,
    updateProfile,
    changePassword,
    updatePreferences,
  };
}

