import React, { useState } from "react";
import type { UpdateUserPreferencesCommand, UserPreferencesDto } from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface PreferencesSectionProps {
  preferences: UserPreferencesDto;
  saving: boolean;
  onSubmit: (payload: UpdateUserPreferencesCommand) => Promise<UserPreferencesDto>;
}

export function PreferencesSection({ preferences, saving, onSubmit }: PreferencesSectionProps) {
  const [confirmations, setConfirmations] = useState({
    deleteMessage: preferences.confirmations?.deleteMessage ?? true,
    createRoom: preferences.confirmations?.createRoom ?? true,
    createServer: preferences.confirmations?.createServer ?? true,
  });

  const [isDirty, setIsDirty] = useState(false);

  const handleConfirmationChange = (key: keyof typeof confirmations, checked: boolean) => {
    setConfirmations((prev) => ({ ...prev, [key]: checked }));
    setIsDirty(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      confirmations: confirmations,
    });
    setIsDirty(false);
  };

  return (
    <Card className="retro-card">
      <CardHeader>
        <CardTitle>Preferencje aplikacji</CardTitle>
        <CardDescription>Dostosuj zachowanie aplikacji i powiadomienia.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide text-[var(--retro-orange-bright)]">
              Powiadomienia i Potwierdzenia
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-delete-msg"
                  checked={confirmations.deleteMessage}
                  onCheckedChange={(checked) => handleConfirmationChange("deleteMessage", checked as boolean)}
                />
                <Label htmlFor="confirm-delete-msg" className="text-sm font-normal cursor-pointer">
                  Potwierdzaj usuwanie wiadomości
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-create-room"
                  checked={confirmations.createRoom}
                  onCheckedChange={(checked) => handleConfirmationChange("createRoom", checked as boolean)}
                />
                <Label htmlFor="confirm-create-room" className="text-sm font-normal cursor-pointer">
                  Pokazuj komunikat sukcesu po utworzeniu pokoju
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-create-server"
                  checked={confirmations.createServer}
                  onCheckedChange={(checked) => handleConfirmationChange("createServer", checked as boolean)}
                />
                <Label htmlFor="confirm-create-server" className="text-sm font-normal cursor-pointer">
                  Pokazuj komunikat sukcesu po utworzeniu serwera
                </Label>
              </div>
            </div>
          </div>

          <CardFooter className="px-0 pt-4">
            <Button className="retro-button" type="submit" disabled={!isDirty || saving}>
              {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

