import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  RegisterUserCommand,
  RegisterUserResponseDto,
  LoginCommand,
  ConfirmEmailCommand,
  PasswordResetRequestCommand,
  PasswordResetConfirmCommand,
} from "../../types";

export class AuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Register a new user
   */
  async registerUser(command: RegisterUserCommand): Promise<RegisterUserResponseDto> {
    const { email, password } = command;

    // Check if user already exists
    const { data: existingUser } = await this.supabase.from("users").select("id").eq("email", email).single();

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const bcrypt = await import("bcrypt");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error: createUserError } = await this.supabase
      .from("users")
      .insert({
        email,
        password_hash: passwordHash,
        email_confirmed: false,
      })
      .select("id")
      .single();

    if (createUserError || !newUser) {
      throw new DatabaseError("Failed to create user account");
    }

    // Generate and store confirmation token
    await this.generateEmailConfirmationToken(newUser.id);

    return { userId: newUser.id };
  }

  /**
   * Confirm user email
   */
  async confirmEmail(command: ConfirmEmailCommand): Promise<void> {
    const { token } = command;

    // Find and validate token
    const { data: confirmation, error: tokenError } = await this.supabase
      .from("email_confirmations")
      .select("user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !confirmation) {
      throw new ValidationError("Invalid confirmation token");
    }

    if (confirmation.used) {
      throw new ValidationError("Confirmation token has already been used");
    }

    if (new Date(confirmation.expires_at) < new Date()) {
      throw new TokenExpiredError("Confirmation token has expired");
    }

    // Mark token as used
    const { error: updateTokenError } = await this.supabase
      .from("email_confirmations")
      .update({ used: true })
      .eq("token", token);

    if (updateTokenError) {
      throw new DatabaseError("Failed to update confirmation token");
    }

    // Confirm user email
    const { error: confirmUserError } = await this.supabase
      .from("users")
      .update({ email_confirmed: true })
      .eq("id", confirmation.user_id);

    if (confirmUserError) {
      throw new DatabaseError("Failed to confirm user email");
    }
  }

  /**
   * Authenticate user login
   */
  async loginUser(command: LoginCommand): Promise<{ userId: string; sessionId: string }> {
    const { email, password } = command;

    // Find user
    const { data: user, error: userError } = await this.supabase
      .from("users")
      .select("id, email, password_hash, email_confirmed")
      .eq("email", email)
      .single();

    if (userError || !user) {
      throw new AuthenticationError("Invalid email or password");
    }

    if (!user.email_confirmed) {
      throw new AuthenticationError("Email not confirmed. Please check your email and confirm your account.");
    }

    // Verify password
    const bcrypt = await import("bcrypt");
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Create session
    const sessionId = await this.createUserSession(user.id);

    return { userId: user.id, sessionId };
  }

  /**
   * Logout user by destroying session
   */
  async logoutUser(sessionId: string): Promise<void> {
    const { error } = await this.supabase.from("auth_sessions").delete().eq("session_id", sessionId);

    if (error) {
      console.error("Failed to delete session:", error);
      // Don't throw error - logout should succeed even if DB deletion fails
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(command: PasswordResetRequestCommand): Promise<void> {
    const { email, captchaToken } = command;

    // TODO: Verify captcha token
    if (!captchaToken) {
      throw new ValidationError("Captcha token is required");
    }

    // Find user
    const { data: user, error: userError } = await this.supabase.from("users").select("id").eq("email", email).single();

    if (userError || !user) {
      // Don't reveal if user exists - return success anyway
      return;
    }

    // Generate reset token
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    const { error: tokenError } = await this.supabase.from("password_resets").insert({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (tokenError) {
      throw new DatabaseError("Failed to create password reset token");
    }

    // TODO: Send reset email
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(command: PasswordResetConfirmCommand): Promise<void> {
    const { token, newPassword } = command;

    // Find and validate token
    const { data: resetToken, error: tokenError } = await this.supabase
      .from("password_resets")
      .select("user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !resetToken) {
      throw new ValidationError("Invalid reset token");
    }

    if (resetToken.used) {
      throw new ValidationError("Reset token has already been used");
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new TokenExpiredError("Reset token has expired");
    }

    // Hash new password
    const bcrypt = await import("bcrypt");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const { error: updatePasswordError } = await this.supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", resetToken.user_id);

    if (updatePasswordError) {
      throw new DatabaseError("Failed to update password");
    }

    // Mark token as used
    const { error: updateTokenError } = await this.supabase
      .from("password_resets")
      .update({ used: true })
      .eq("token", token);

    if (updateTokenError) {
      console.error("Failed to mark reset token as used:", updateTokenError);
    }
  }

  /**
   * Generate email confirmation token
   */
  private async generateEmailConfirmationToken(userId: string): Promise<string> {
    const crypto = await import("crypto");
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error } = await this.supabase.from("email_confirmations").insert({
      user_id: userId,
      token: confirmationToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (error) {
      throw new DatabaseError("Failed to create confirmation token");
    }

    // TODO: Send confirmation email
    console.log(`Confirmation token for user ${userId}: ${confirmationToken}`);

    return confirmationToken;
  }

  /**
   * Create user session
   */
  private async createUserSession(userId: string): Promise<string> {
    const crypto = await import("crypto");
    const sessionId = crypto.randomUUID();
    const accessToken = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error } = await this.supabase.from("auth_sessions").insert({
      session_id: sessionId,
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      throw new DatabaseError("Failed to create session");
    }

    return sessionId;
  }
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenExpiredError";
  }
}
