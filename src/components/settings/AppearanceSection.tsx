import React, { useEffect, useState } from "react";
import type { UpdateUserPreferencesCommand, UserAppearancePreferences, UserPreferencesDto } from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const DEFAULT_APPEARANCE: UserAppearancePreferences = {
  theme: "system",
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  chatDensity: "comfortable",
};

interface AppearanceSectionProps {
  preferences?: UserPreferencesDto;
  saving: boolean;
  onSubmit: (payload: UpdateUserPreferencesCommand) => Promise<void>;
}

export function AppearanceSection({ preferences, saving, onSubmit }: AppearanceSectionProps) {
  const [appearance, setAppearance] = useState<UserAppearancePreferences>(
    preferences?.appearance ?? DEFAULT_APPEARANCE,
  );

  useEffect(() => {
    if (preferences?.appearance) {
      setAppearance(preferences.appearance);
    }
  }, [preferences]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({ appearance });
  };

  return (
    <Card className="retro-card">
      <CardHeader>
        <CardTitle>Wygląd i dostępność</CardTitle>
        <CardDescription>Spersonalizuj interfejs aplikacji i ułatwienia dostępu.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--retro-orange-bright)]">
              Motyw
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {["light", "dark", "system"].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setAppearance((prev) => ({ ...prev, theme: mode as typeof prev.theme }))}
                  className={`rounded-lg border px-3 py-4 text-center text-sm font-semibold transition ${
                    appearance.theme === mode
                      ? "border-[var(--retro-orange)] text-[var(--retro-orange-bright)]"
                      : "border-[var(--border)] text-muted-foreground hover:border-[var(--retro-orange-soft)]"
                  }`}
                >
                  {mode === "light" ? "Jasny" : mode === "dark" ? "Ciemny" : "System"}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-semibold">Skala czcionki</Label>
              <Input
                type="range"
                min={0.9}
                max={1.2}
                step={0.05}
                value={appearance.fontScale}
                onChange={(event) =>
                  setAppearance((prev) => ({ ...prev, fontScale: Number(event.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(appearance.fontScale * 100)}% rozmiaru tekstu
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Gęstość konwersacji</Label>
              <div className="mt-2 flex gap-2">
                {["comfortable", "compact"].map((density) => (
                  <Button
                    key={density}
                    type="button"
                    variant={appearance.chatDensity === density ? "default" : "outline"}
                    onClick={() =>
                      setAppearance((prev) => ({ ...prev, chatDensity: density as typeof prev.chatDensity }))
                    }
                  >
                    {density === "comfortable" ? "Standard" : "Kompakt"}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <ToggleOption
              label="Tryb wysokiego kontrastu"
              description="Popraw widoczność i czytelność interfejsu"
              checked={appearance.highContrast}
              onChange={(checked) => setAppearance((prev) => ({ ...prev, highContrast: checked }))}
            />
            <ToggleOption
              label="Ogranicz animacje"
              description="Wyłącz zbędne animacje i efekty"
              checked={appearance.reducedMotion}
              onChange={(checked) => setAppearance((prev) => ({ ...prev, reducedMotion: checked }))}
            />
          </section>

          <CardFooter className="px-0">
            <Button className="retro-button" type="submit" disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz wygląd"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
      <div className="mr-4">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </label>
  );
}

