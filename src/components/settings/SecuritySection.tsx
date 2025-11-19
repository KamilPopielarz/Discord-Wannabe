import React, { useState } from "react";
import type {
  ChangePasswordCommand,
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

interface SecuritySectionProps {
  passwordBusy: boolean;
  onChangePassword: (payload: ChangePasswordCommand) => Promise<void>;
}

export function SecuritySection({
  passwordBusy,
  onChangePassword,
}: SecuritySectionProps) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  return (
    <div className="space-y-6">
      <Card className="retro-card">
        <CardHeader>
          <CardTitle>Bezpieczeństwo</CardTitle>
          <CardDescription>Zadbaj o silne hasło.</CardDescription>
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

