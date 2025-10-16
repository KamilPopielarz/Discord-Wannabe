import type { APIRoute } from "astro";
import { z } from "zod";
import type { RegisterUserCommand, RegisterUserResponseDto } from "../../../types";

export const prerender = false;

// Zod schema for validation
const RegisterUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body: RegisterUserCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = RegisterUserSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password } = validationResult.data;

    // Get Supabase client from locals (following Astro guidelines)
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user already exists (using Supabase Auth users table)
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === email);

    if (userExists) {
      return new Response(JSON.stringify({ error: "User with this email already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create user using Supabase Auth (this will create entry in auth.users)
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll handle confirmation manually
    });

    if (signUpError || !authData.user) {
      console.error("Sign up error:", signUpError);
      return new Response(JSON.stringify({ error: "Failed to create user account" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newUser = authData.user;

    // Generate email confirmation token
    const crypto = await import("crypto");
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store confirmation token in our custom table
    const { error: tokenError } = await supabase.from("email_confirmations").insert({
      user_id: newUser.id,
      token: confirmationToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (tokenError) {
      console.error("Failed to create confirmation token:", tokenError);
      // Clean up created user
      await supabase.auth.admin.deleteUser(newUser.id);
      return new Response(JSON.stringify({ error: "Failed to create user account" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Send confirmation email
    console.log(`User registered successfully: ${email}, confirmation token: ${confirmationToken}`);

    const response: RegisterUserResponseDto = {
      userId: newUser.id,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
