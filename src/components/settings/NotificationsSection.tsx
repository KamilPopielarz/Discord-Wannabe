import React, { useEffect, useState } from "react";
import type {
  UpdateUserPreferencesCommand,
  UserNotificationPreferences,
  UserPreferencesDto,
  UserSoundPreferences,
} from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";

const DEFAULT_NOTIFICATIONS: UserNotificationPreferences = {
  push: true,
  email: true,
  mentions: true,
  digest: "daily",
};

const DEFAULT_SOUND: UserSoundPreferences = {
  enabled: true,
  volume: 0.5,
  messageSound: true,
  typingSound: false,
  userJoinSound: true,
};

interface NotificationsSectionProps {
  preferences?: UserPreferencesDto;
  saving: boolean;
  onSubmit: (payload: UpdateUserPreferencesCommand) => Promise<void>;
}

export function NotificationsSection({ preferences, saving, onSubmit }: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState<UserNotificationPreferences>(
    preferences?.notifications ?? DEFAULT_NOTIFICATIONS,
  );
  const [sound, setSound] = useState<UserSoundPreferences>(preferences?.sound ?? DEFAULT_SOUND);

  useEffect(() => {
    if (preferences?.notifications) {
      setNotifications(preferences.notifications);
    }
    if (preferences?.sound) {
      setSound(preferences.sound);
    }
  }, [preferences]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({ notifications, sound });
  };

  return (
    <Card className="retro-card">
      <CardHeader>
        <CardTitle>Powiadomienia i dźwięki</CardTitle>
        <CardDescription>Kontroluj alerty w aplikacji oraz dźwięki systemowe.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--retro-orange-bright)]">
              Powiadomienia
            </h3>
            <div className="space-y-3">
              <ToggleRow
                label="Powiadomienia push"
                description="Włącz alerty w przeglądarce"
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: !!checked }))}
              />
              <ToggleRow
                label="Powiadomienia e-mail"
                description="Otrzymuj podsumowania na maila"
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: !!checked }))}
              />
              <ToggleRow
                label="Wzmianki"
                description="Podbij alerty gdy ktoś użyje @TwojaNazwa"
                checked={notifications.mentions}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, mentions: !!checked }))
                }
              />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-sm font-semibold">Częstotliwość raportów</Label>
              <Select
                value={notifications.digest}
                onValueChange={(value) =>
                  setNotifications((prev) => ({ ...prev, digest: value as typeof prev.digest }))
                }
              >
                <SelectTrigger className="retro-input">
                  <SelectValue placeholder="Wybierz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Codziennie</SelectItem>
                  <SelectItem value="weekly">Co tydzień</SelectItem>
                  <SelectItem value="never">Nigdy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--retro-orange-bright)]">
              Ustawienia dźwięku
            </h3>
            <div className="space-y-3">
              <ToggleRow
                label="Dźwięki powiadomień"
                description="Włącz/wyłącz wszystkie dźwięki"
                checked={sound.enabled}
                onCheckedChange={(checked) => setSound((prev) => ({ ...prev, enabled: !!checked }))}
              />
              <ToggleRow
                label="Wiadomości"
                description="Odtwarzaj dźwięk nowej wiadomości"
                checked={sound.messageSound}
                onCheckedChange={(checked) =>
                  setSound((prev) => ({ ...prev, messageSound: !!checked }))
                }
              />
              <ToggleRow
                label="Wpisywanie"
                description="Subtelny dźwięk gdy ktoś pisze"
                checked={sound.typingSound}
                onCheckedChange={(checked) =>
                  setSound((prev) => ({ ...prev, typingSound: !!checked }))
                }
              />
              <ToggleRow
                label="Wejście użytkownika"
                description="Sygnalizuj gdy ktoś dołącza"
                checked={sound.userJoinSound}
                onCheckedChange={(checked) =>
                  setSound((prev) => ({ ...prev, userJoinSound: !!checked }))
                }
              />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-sm font-semibold">Głośność</Label>
              <Input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sound.volume}
                onChange={(event) =>
                  setSound((prev) => ({ ...prev, volume: Number(event.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(sound.volume * 100)}% poziomu głośności
              </p>
            </div>
          </section>

          <CardFooter className="px-0">
            <Button type="submit" className="retro-button" disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({ label, description, checked, onCheckedChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
    </div>
  );
}

