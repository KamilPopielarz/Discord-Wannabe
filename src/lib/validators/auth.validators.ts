import { z } from "zod";

// Authentication validation schemas
export const RegisterUserSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail").max(255, "Adres e-mail musi mieć mniej niż 255 znaków"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .max(128, "Hasło musi mieć mniej niż 128 znaków")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
    ),
});

export const ConfirmEmailSchema = z.object({
  token: z.string().min(1, "Token jest wymagany").max(255, "Token jest zbyt długi"),
});

export const LoginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail").max(255, "Adres e-mail musi mieć mniej niż 255 znaków"),
  password: z.string().min(1, "Hasło jest wymagane").max(128, "Hasło musi mieć mniej niż 128 znaków"),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu e-mail").max(255, "Adres e-mail musi mieć mniej niż 255 znaków"),
  captchaToken: z.string().min(1, "Token Captcha jest wymagany"),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token jest wymagany").max(255, "Token jest zbyt długi"),
  newPassword: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .max(128, "Hasło musi mieć mniej niż 128 znaków")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Hasło musi zawierać co najmniej jedną małą literę, jedną dużą literę i jedną cyfrę"
    ),
});


// Server validation schemas
export const CreateServerSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa serwera jest wymagana")
    .max(32, "Nazwa serwera musi mieć mniej niż 32 znaki")
    // Allow unicode letters, numbers, spaces, hyphens, and underscores
    .regex(/^[\p{L}\p{N}\s\-_]+$/u, "Nazwa serwera może zawierać tylko litery, cyfry, spacje, myślniki i podkreślenia"),
});

export const DeleteServerSchema = z.object({});

// Room validation schemas
export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa pokoju jest wymagana")
    .max(32, "Nazwa pokoju musi mieć mniej niż 32 znaki")
    // Allow unicode letters, numbers, spaces, hyphens, and underscores
    .regex(/^[\p{L}\p{N}\s\-_]+$/u, "Nazwa pokoju może zawierać tylko litery, cyfry, spacje, myślniki i podkreślenia"),
  password: z
    .string()
    .min(4, "Hasło pokoju musi mieć co najmniej 4 znaki")
    .max(50, "Hasło pokoju musi mieć mniej niż 50 znaków")
    .optional(),
});

export const JoinRoomSchema = z.object({
  password: z.string().max(50, "Hasło musi mieć mniej niż 50 znaków").optional(),
});

export const UpdateRoomPasswordSchema = z.object({
  password: z
    .string()
    .min(4, "Hasło pokoju musi mieć co najmniej 4 znaki")
    .max(50, "Hasło pokoju musi mieć mniej niż 50 znaków"),
});

// Role management validation
export const UpdateServerMemberRoleSchema = z.object({
  role: z.enum(["Owner", "Admin", "Moderator", "Member"], {
    errorMap: () => ({ message: "Rola musi być jedną z: Owner, Admin, Moderator, Member" }),
  }),
});

export const UpdateRoomMemberRoleSchema = z.object({
  role: z.enum(["Owner", "Admin", "Moderator", "Member"], {
    errorMap: () => ({ message: "Rola musi być jedną z: Owner, Admin, Moderator, Member" }),
  }),
});

// Message validation
export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Treść wiadomości jest wymagana")
    .max(2000, "Treść wiadomości musi mieć mniej niż 2000 znaków")
    .trim(),
});

// Invitation validation
export const RevokeInvitationSchema = z.object({
  expiresAt: z.string().datetime("Nieprawidłowy format daty").optional(),
  maxUses: z.number().int("Maksymalna liczba użyć musi być liczbą całkowitą").min(0, "Maksymalna liczba użyć nie może być ujemna").optional(),
  revoked: z.boolean(),
});

// Voice token validation
export const GenerateVoiceTokenSchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, "Wymagane jest co najmniej jedno uprawnienie")
    .max(10, "Podano zbyt wiele uprawnień"),
});

// Query parameter validation schemas
export const PaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Strona musi być liczbą całkowitą dodatnią")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Strona musi być większa od 0")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit musi być liczbą całkowitą dodatnią")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, "Limit musi wynosić od 1 do 100")
    .optional()
    .default("20"),
});

export const MessageQuerySchema = PaginationSchema.extend({
  since: z
    .string()
    .regex(/^\d+$/, "Since musi być liczbą całkowitą dodatnią (ID wiadomości)")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Since musi być większe od 0")
    .optional(),
});

// UUID validation helper
export const UUIDSchema = z.string().uuid("Nieprawidłowy format UUID");

// Invite link validation helper
export const InviteLinkSchema = z
  .string()
  .min(1, "Link zaproszeniowy jest wymagany")
  .max(255, "Link zaproszeniowy jest zbyt długi")
  .regex(/^[a-zA-Z0-9\-_]+$/, "Nieprawidłowy format linku zaproszeniowego");
