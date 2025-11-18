import React, { useState } from "react";
import type {
  ChangePasswordCommand,
  UserPreferencesDto,
  UserSessionSummaryDto,
} from "../../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface SecuritySectionProps {
  preferences?: UserPreferencesDto;
  sessions?: UserSessionSummaryDto[];
  passwordBusy: boolean;
  twoFactorBusy: boolean;
  sessionsBusy: boolean;
  onChangePassword: (payload: ChangePasswordCommand) => Promise<void>;
  onToggleTwoFactor: (enabled: boolean) => Promise<{ secret?: string | null } | void>;
  onRevokeSession: (sessionId: string) => Promise<void>;
}

export function SecuritySection({
  preferences,
  sessions = [],
  passwordBusy,
  twoFactorBusy,
  sessionsBusy,
  onChangePassword,
  onToggleTwoFactor,
  onRevokeSession,
}: SecuritySectionProps) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(
    preferences?.privacy.twoFactorSecret ?? null,
  );

  const passwordsMatch =
    passwordForm.newPassword.length >= 8 && passwordForm.newPassword === passwordForm.confirmPassword;

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordsMatch) return;
    await onChangePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleTwoFactorToggle = async (enabled: boolean) => {
    const response = await onToggleTwoFactor(enabled);
    if (response && "secret" in response) {
      setTwoFactorSecret(response.secret ?? null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="retro-card">
        <CardHeader>
          <CardTitle>Bezpieczeństwo</CardTitle>
          <CardDescription>Zadbaj o silne hasło i dodatkowe zabezpieczenia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePasswordSubmit}>
            <PasswordField
              label="Obecne hasło"
              value={passwordForm.currentPassword}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
            />
            <PasswordField
              label="Nowe hasło"
              value={passwordForm.newPassword}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
            />
            <PasswordField
              label="Powtórz nowe hasło"
              value={passwordForm.confirmPassword}
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
              error={!passwordsMatch && passwordForm.confirmPassword.length > 0}
            />
            <CardFooter className="col-span-full px-0">
              <Button
                className="retro-button"
                type="submit"
                disabled={!passwordsMatch || passwordBusy}
              >
                {passwordBusy ? "Zmiana..." : "Zmień hasło"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <Card className="retro-card">
        <CardHeader>
          <CardTitle>Uwierzytelnianie dwuskładnikowe</CardTitle>
          <CardDescription>Wymagaj dodatkowego kodu przy logowaniu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
            <div className="pr-4">
              <p className="text-sm font-semibold">Włącz 2FA</p>
              <p className="text-xs text-muted-foreground">
                Zeskanuj kod w aplikacji TOTP i potwierdź logowanie
              </p>
            </div>
            <Checkbox
              checked={preferences?.privacy.twoFactorEnabled ?? false}
              onCheckedChange={(value) => handleTwoFactorToggle(Boolean(value))}
              disabled={twoFactorBusy}
            />
          </label>
          {twoFactorSecret && (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-background/40 p-4 text-center text-sm">
              <p className="text-muted-foreground">Sekret TOTP:</p>
              <p className="font-mono text-lg tracking-widest text-[var(--retro-orange-bright)]">
                {twoFactorSecret}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="retro-card">
        <CardHeader>
          <CardTitle>Aktywne sesje</CardTitle>
          <CardDescription>Wyloguj urządzenia, które już nie są potrzebne.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zarejestrowanych sesji</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {session.current ? "Bieżące urządzenie" : session.userAgent ?? "Nieznane urządzenie"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ostatnia aktywność: {new Date(session.lastSeen).toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={session.current || sessionsBusy}
                  onClick={() => onRevokeSession(session.sessionId)}
                >
                  Zakończ
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

function PasswordField({ label, value, onChange, error }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      <Input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={error ? "border-destructive" : undefined}
      />
      {error && <p className="text-xs text-destructive">Hasła muszą być identyczne</p>}
    </div>
  );
}

