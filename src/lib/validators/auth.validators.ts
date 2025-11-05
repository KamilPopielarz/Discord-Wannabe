import { z } from "zod";

// Authentication validation schemas
export const RegisterUserSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
});

export const ConfirmEmailSchema = z.object({
  token: z.string().min(1, "Token is required").max(255, "Token is too long"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  password: z.string().min(1, "Password is required").max(128, "Password must be less than 128 characters"),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  captchaToken: z.string().min(1, "Captcha token is required"),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token is required").max(255, "Token is too long"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
});

// Guest session validation
export const CreateGuestSessionSchema = z.object({
  serverInviteLink: z.string().min(1, "Server invite link is required").max(255, "Invite link is too long"),
});

// Server validation schemas
export const CreateServerSchema = z.object({
  name: z
    .string()
    .min(1, "Server name is required")
    .max(100, "Server name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Server name can only contain letters, numbers, spaces, hyphens, and underscores"),
});

export const DeleteServerSchema = z.object({});

// Room validation schemas
export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(100, "Room name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Room name can only contain letters, numbers, spaces, hyphens, and underscores"),
  password: z
    .string()
    .min(4, "Room password must be at least 4 characters")
    .max(50, "Room password must be less than 50 characters")
    .optional(),
});

export const JoinRoomSchema = z.object({
  password: z.string().max(50, "Password must be less than 50 characters").optional(),
});

export const UpdateRoomPasswordSchema = z.object({
  password: z
    .string()
    .min(4, "Room password must be at least 4 characters")
    .max(50, "Room password must be less than 50 characters"),
});

// Role management validation
export const UpdateServerMemberRoleSchema = z.object({
  role: z.enum(["Owner", "Admin", "Moderator", "Member"], {
    errorMap: () => ({ message: "Role must be one of: Owner, Admin, Moderator, Member" }),
  }),
});

export const UpdateRoomMemberRoleSchema = z.object({
  role: z.enum(["Owner", "Admin", "Moderator", "Member"], {
    errorMap: () => ({ message: "Role must be one of: Owner, Admin, Moderator, Member" }),
  }),
});

// Message validation
export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(2000, "Message content must be less than 2000 characters")
    .trim(),
});

// Invitation validation
export const RevokeInvitationSchema = z.object({
  expiresAt: z.string().datetime("Invalid datetime format").optional(),
  maxUses: z.number().int("Max uses must be an integer").min(0, "Max uses must be non-negative").optional(),
  revoked: z.boolean(),
});

// Voice token validation
export const GenerateVoiceTokenSchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required")
    .max(10, "Too many permissions specified"),
});

// Query parameter validation schemas
export const PaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Page must be greater than 0")
    .optional()
    .default("1"),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100")
    .optional()
    .default("20"),
});

export const MessageQuerySchema = PaginationSchema.extend({
  since: z
    .string()
    .regex(/^\d+$/, "Since must be a positive integer (message ID)")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Since must be greater than 0")
    .optional(),
});

// UUID validation helper
export const UUIDSchema = z.string().uuid("Invalid UUID format");

// Invite link validation helper
export const InviteLinkSchema = z
  .string()
  .min(1, "Invite link is required")
  .max(255, "Invite link is too long")
  .regex(/^[a-zA-Z0-9\-_]+$/, "Invalid invite link format");
