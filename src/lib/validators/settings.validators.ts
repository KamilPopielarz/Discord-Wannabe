import { z } from "zod";

export const SocialLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Etykieta jest wymagana")
    .max(30, "Etykieta może mieć maksymalnie 30 znaków"),
  url: z
    .string()
    .trim()
    .url("Nieprawidłowy adres URL")
    .max(255, "Adres URL jest za długi"),
});

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Nazwa użytkownika musi mieć co najmniej 3 znaki")
    .max(32, "Nazwa użytkownika może mieć maksymalnie 32 znaki")
    .regex(/^[a-zA-Z0-9_\-]+$/, "Dozwolone są tylko litery, cyfry, myślnik i podkreślenie"),
  displayName: z
    .string()
    .trim()
    .max(80, "Wyświetlana nazwa jest za długa")
    .optional()
    .nullable(),
  status: z
    .string()
    .trim()
    .max(140, "Status może mieć maksymalnie 140 znaków")
    .optional()
    .nullable(),
  bio: z
    .string()
    .trim()
    .max(500, "Opis jest za długi")
    .optional()
    .nullable(),
  timezone: z
    .string()
    .trim()
    .max(64, "Strefa czasowa jest za długa")
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .trim()
    .max(500, "Adres avatara jest za długi")
    .optional()
    .nullable()
    .refine(
      (value) => !value || value.includes("://") || value.startsWith("avatars/"),
      "Nieprawidłowy adres avatara",
    ),
  avatarData: z
    .string()
    .trim()
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/, "Nieprawidłowy format obrazu")
    .optional(),
  socialLinks: z.array(SocialLinkSchema).max(5, "Dodaj maksymalnie 5 linków").optional(),
});

const NotificationPreferencesSchema = z.object({
  push: z.boolean(),
  email: z.boolean(),
  mentions: z.boolean(),
  digest: z.enum(["never", "daily", "weekly"]),
});

const AppearancePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontScale: z.number().min(0.75).max(1.5),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
  chatDensity: z.enum(["comfortable", "compact"]),
});

const PrivacyPreferencesSchema = z.object({
  showPresence: z.boolean(),
  autoMuteVoice: z.boolean(),
  autoDeafenVoice: z.boolean(),
  allowDmFromNonMutual: z.boolean(),
  shareActivityInsights: z.boolean(),
  twoFactorEnabled: z.boolean().optional(),
  twoFactorSecret: z.string().nullable().optional(),
});

const SoundPreferencesSchema = z.object({
  enabled: z.boolean(),
  volume: z.number().min(0).max(1),
  messageSound: z.boolean(),
  typingSound: z.boolean(),
  userJoinSound: z.boolean(),
});

export const UpdatePreferencesSchema = z.object({
  notifications: NotificationPreferencesSchema.partial().optional(),
  appearance: AppearancePreferencesSchema.partial().optional(),
  privacy: PrivacyPreferencesSchema.partial().optional(),
  sound: SoundPreferencesSchema.partial().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Podaj obecne hasło"),
  newPassword: z
    .string()
    .min(8, "Nowe hasło musi mieć min. 8 znaków")
    .max(128, "Nowe hasło jest za długie")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą i dużą literę oraz cyfrę"),
});

export const ToggleTwoFactorSchema = z.object({
  enabled: z.boolean(),
});

export const RevokeSessionSchema = z.object({
  sessionId: z.string().uuid("Nieprawidłowy identyfikator sesji"),
});

export const DeleteAccountSchema = z.object({
  confirm: z
    .string()
    .trim()
    .min(1, "Wpisz tekst potwierdzający"),
});

