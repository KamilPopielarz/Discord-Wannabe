import React, { useEffect, useState } from "react";
import type { UpdateUserPreferencesCommand, UserPreferencesDto, UserPrivacyPreferences } from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

const DEFAULT_PRIVACY: UserPrivacyPreferences = {
  showPresence: true,
  autoMuteVoice: false,
  autoDeafenVoice: false,
  allowDmFromNonMutual: true,
  shareActivityInsights: false,
  twoFactorEnabled: false,
  twoFactorSecret: null,
};

interface PrivacySectionProps {
  preferences?: UserPreferencesDto;
  saving: boolean;
  onSubmit: (payload: UpdateUserPreferencesCommand) => Promise<void>;
}

export function PrivacySection({ preferences, saving, onSubmit }: PrivacySectionProps) {
  const [privacy, setPrivacy] = useState<UserPrivacyPreferences>(preferences?.privacy ?? DEFAULT_PRIVACY);

  useEffect(() => {
    if (preferences?.privacy) {
      setPrivacy(preferences.privacy);
    }
  }, [preferences]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({ privacy });
  };

  return (
    <Card className="retro-card">
      <CardHeader>
        <CardTitle>Prywatność i status</CardTitle>
        <CardDescription>Zarządzaj widocznością i zachowaniem konta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PrivacyToggle
            label="Pokazuj status online"
            description="Pozwól innym widzieć gdy jesteś aktywny/a"
            checked={privacy.showPresence}
            onChange={(checked) => setPrivacy((prev) => ({ ...prev, showPresence: checked }))}
          />
          <PrivacyToggle
            label="Automatycznie wycisz mikrofon"
            description="Dołączając do kanału, mikrofon startuje jako wyciszony"
            checked={privacy.autoMuteVoice}
            onChange={(checked) => setPrivacy((prev) => ({ ...prev, autoMuteVoice: checked }))}
          />
          <PrivacyToggle
            label="Automatycznie wyłącz odsłuch"
            description="Rozpoczynaj rozmowy z aktywnym wyciszeniem audio"
            checked={privacy.autoDeafenVoice}
            onChange={(checked) => setPrivacy((prev) => ({ ...prev, autoDeafenVoice: checked }))}
          />
          <PrivacyToggle
            label="Pozwól na wiadomości od obcych"
            description="Zezwalaj osobom spoza wspólnych serwerów pisać DM"
            checked={privacy.allowDmFromNonMutual}
            onChange={(checked) => setPrivacy((prev) => ({ ...prev, allowDmFromNonMutual: checked }))}
          />
          <PrivacyToggle
            label="Udostępniaj aktywność administratorom"
            description="Anonimowe statystyki pomagają w moderacji"
            checked={privacy.shareActivityInsights}
            onChange={(checked) => setPrivacy((prev) => ({ ...prev, shareActivityInsights: checked }))}
          />

          <CardFooter className="px-0">
            <Button type="submit" className="retro-button" disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz prywatność"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

interface PrivacyToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function PrivacyToggle({ label, description, checked, onChange }: PrivacyToggleProps) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
      <div className="pr-4">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </label>
  );
}

