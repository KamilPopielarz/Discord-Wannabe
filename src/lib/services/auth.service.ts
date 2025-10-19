import type { DatabaseSupabaseClient as SupabaseClient } from "../../db/supabase.client.ts";
import type {
  RegisterUserCommand,
  RegisterUserResponseDto,
  LoginCommand,
  ConfirmEmailCommand,
  PasswordResetRequestCommand,
  PasswordResetConfirmCommand,
} from "../../types";

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Register a new user
   */
  async registerUser(command: RegisterUserCommand): Promise<RegisterUserResponseDto> {
    const { email, password, username } = command;

    // Create user using normal Supabase Auth signUp (consistent with login)
    const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Skip email confirmation for now
        data: {
          username: username,
        },
      },
    });

    if (signUpError || !authData.user) {
      throw new DatabaseError("Failed to create user account");
    }

    const userId = authData.user.id;

    // Update user metadata with username using admin API
    try {
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(userId, {
        user_metadata: { username: username },
      });

      if (updateError) {
        // Don't throw error here, user is still created
      }
    } catch {
      // Don't throw error here, user is still created
    }

    // ✅ Skip email confirmation token generation - not needed anymore
    // await this.generateEmailConfirmationToken(userId);
    return { userId };
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
    // Confirm user email via Supabase Auth Admin API
    const { error: confirmUserError } = await this.supabase.auth.admin.updateUserById(confirmation.user_id, {
      email_confirm: true,
    });
    if (confirmUserError) {
      throw new DatabaseError("Failed to confirm user email");
    }
  }

  /**
   * Authenticate user login
   */
  async loginUser(command: LoginCommand): Promise<{ userId: string; sessionId: string }> {
    const { email, password } = command;

    // Authenticate via Supabase Auth
    const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signInData.session || !signInData.user) {
      throw new AuthenticationError("Invalid email or password");
    }
    const userId = signInData.user.id;

    // Create custom session in your auth_sessions table
    const sessionId = await this.createUserSession(userId);
    return { userId, sessionId };
  }

  /**
   * Logout user by destroying session
   */
  async logoutUser(sessionId: string): Promise<void> {
    await this.supabase.from("auth_sessions").delete().eq("session_id", sessionId);
    // Don't throw or log - logout succeeds regardless
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

    // Find user via Supabase Auth Admin API
    const { data: listResult } = await this.supabase.auth.admin.listUsers();
    const found = listResult.users.find((u) => u.email === email);
    if (!found) {
      // Don't reveal if user exists - return success anyway
      return;
    }
    const userId = found.id;

    // Generate reset token
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    const { error: tokenError } = await this.supabase.from("password_resets").insert({
      user_id: userId,
      token: resetToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (tokenError) {
      throw new DatabaseError("Failed to create password reset token");
    }
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

    // Update password via Supabase Auth
    // prettier-ignore
    const { error: updateError } = await this.supabase.auth.admin.updateUserById(resetToken.user_id, { password: newPassword });

    if (updateError) {
      throw new DatabaseError("Failed to update password");
    }

    // Mark token as used
    const { error: updateTokenError } = await this.supabase
      .from("password_resets")
      .update({ used: true })
      .eq("token", token);
    if (updateTokenError) {
      // failed to mark used, but ignore silently
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
