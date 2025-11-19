import React, { useMemo, useState } from "react";
import type { SocialLinkDto, UpdateUserProfileCommand, UserProfileDto } from "../../types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

const TIMEZONES = [
  "Europe/Warsaw",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
];

interface ProfileSectionProps {
  profile?: UserProfileDto;
  saving: boolean;
  onSubmit: (payload: UpdateUserProfileCommand & { avatarData?: string }) => Promise<void>;
}

export function ProfileSection({ profile, saving, onSubmit }: ProfileSectionProps) {
  const [formState, setFormState] = useState({
    username: profile?.username ?? "",
    displayName: profile?.displayName ?? "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl ?? null);
  const [avatarData, setAvatarData] = useState<string | undefined>(undefined);

  const canSubmit = useMemo(() => formState.username.trim().length >= 3, [formState.username]);

  const handleChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      setAvatarData(undefined);
      return;
    }

    const base64 = await fileToBase64(file);
    setAvatarData(base64);
    setAvatarPreview(base64);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    await onSubmit({
      ...formState,
      avatarData,
      avatarUrl: profile?.avatarUrl ?? null,
    });
    setAvatarData(undefined);
  };

  return (
    <Card className="retro-card">
      <CardHeader>
        <CardTitle>Profil i tożsamość</CardTitle>
        <CardDescription>Aktualizuj widoczny profil użytkownika oraz awatar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="space-y-4 md:w-1/3">
              <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center">
                <div className="mb-3 h-28 w-28 overflow-hidden rounded-full border border-[var(--retro-orange)]/40 bg-[var(--retro-orange-soft)]/30 mx-auto flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Podgląd avatara"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Brak avatara</span>
                  )}
                </div>
                <Label
                  htmlFor="avatar-upload"
                  className="retro-link inline-flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[var(--border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.3em]"
                >
                  Wgraj plik
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => handleAvatarUpload(event.target.files?.[0] ?? null)}
                />
                <p className="mt-2 text-xs text-muted-foreground">PNG, JPG lub WEBP do 5MB.</p>
              </div>
            </div>
            <div className="space-y-4 md:w-2/3">
              <Field
                name="username"
                label="Nazwa użytkownika"
                value={formState.username}
                onChange={(value) => handleChange("username", value)}
                required
                helper="Widoczna nazwa w systemie (tylko litery, cyfry, myślnik i podkreślenie)"
              />
              <Field
                name="displayName"
                label="Nick (Wyświetlana nazwa)"
                value={formState.displayName ?? ""}
                onChange={(value) => handleChange("displayName", value)}
                helper="Nazwa widoczna na czacie"
              />
            </div>
          </div>

          <CardFooter className="px-0">
            <Button className="retro-button" type="submit" disabled={!canSubmit || saving}>
              {saving ? "Zapisywanie..." : "Zapisz profil"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

interface FieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  required?: boolean;
}

function Field({ name, label, value, onChange, helper, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="retro-text text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="retro-input"
      />
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

