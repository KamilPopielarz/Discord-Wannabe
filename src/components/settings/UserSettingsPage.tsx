import React, { useMemo, useState } from "react";
import type { UserSettingsResponseDto } from "../../types";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { ErrorBanner } from "../ui/ErrorBanner";
import { SettingsSidebar } from "./SettingsSidebar";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { PreferencesSection } from "./PreferencesSection";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserSettingsPageProps {
  initialSettings?: UserSettingsResponseDto | null;
  initialSection?: string | null;
}

const SECTIONS = [
  { id: "profile", label: "Profil" },
  { id: "preferences", label: "Preferencje" },
  { id: "security", label: "Bezpieczeństwo" },
] as const;

export function UserSettingsPage({ initialSettings, initialSection }: UserSettingsPageProps) {
  const {
    settings,
    loading,
    error,
    successMessage,
    status,
    refresh,
    updateProfile,
    changePassword,
    updatePreferences,
  } = useUserSettings(initialSettings ?? undefined);

  const [activeSection, setActiveSection] = useState(
    initialSection && SECTIONS.some((section) => section.id === initialSection)
      ? initialSection
      : "profile",
  );

  const sidebarSections = useMemo(
    () => SECTIONS.map((section) => ({ id: section.id, label: section.label })),
    [],
  );

  return (
    <>
      <RetroGridBackground />
      <div className="relative z-10 min-h-screen bg-background/95">
        <header className="border-b border-[var(--border)] bg-background/70 backdrop-blur">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-[var(--retro-orange-bright)]">
                  Panel użytkownika
                </p>
                <h1 className="text-3xl font-bold text-[var(--retro-orange-bright)]">
                  Ustawienia konta
                </h1>
                <p className="text-sm text-muted-foreground">
                  Zarządzaj swoim profilem i bezpieczeństwem.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-4 md:mt-0 md:flex-row md:items-center">
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--retro-orange-bright)] hover:text-[var(--retro-orange)]"
                  onClick={refresh}
                >
                  Odśwież
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--retro-orange-bright)] hover:text-[var(--retro-orange)]"
                  onClick={() => window.history.back()}
                >
                  Wyjdź z ustawień
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-[240px_1fr]">
          <SettingsSidebar
            sections={sidebarSections}
            activeSection={activeSection}
            onSelect={setActiveSection}
          />

          <div className="space-y-6">
            <ErrorBanner error={error ?? undefined} />
            {successMessage && (
              <div className="rounded-md border border-[var(--retro-orange)]/40 bg-[var(--retro-orange-soft)]/30 px-4 py-2 text-sm text-[var(--retro-orange-bright)]">
                {successMessage}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!loading && settings && (
              <>
                {activeSection === "profile" && (
                  <ProfileSection
                    profile={settings.profile}
                    saving={status.profile}
                    onSubmit={updateProfile}
                  />
                )}

                {activeSection === "preferences" && (
                  <PreferencesSection
                    preferences={settings.preferences}
                    saving={status.preferences}
                    onSubmit={updatePreferences}
                  />
                )}

                {activeSection === "security" && (
                  <SecuritySection
                    passwordBusy={status.password}
                    onChangePassword={changePassword}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

