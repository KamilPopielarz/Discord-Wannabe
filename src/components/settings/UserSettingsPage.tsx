import React, { useMemo, useState } from "react";
import type { UserSettingsResponseDto } from "../../types";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { ErrorBanner } from "../ui/ErrorBanner";
import { SettingsSidebar } from "./SettingsSidebar";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface UserSettingsPageProps {
  initialSettings?: UserSettingsResponseDto | null;
  initialSection?: string | null;
}

const SECTIONS = [
  { id: "profile", label: "Profil" },
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
              <button
                type="button"
                className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] text-[var(--retro-orange-bright)] hover:text-[var(--retro-orange)] md:mt-0"
                onClick={refresh}
              >
                Odśwież
              </button>
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

