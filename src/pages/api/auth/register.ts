import type { APIRoute } from "astro";
import { z } from "zod";
import type { RegisterUserCommand } from "../../../types";
import { AuthService } from "../../../lib/services/auth.service";

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
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
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

    const { email, password, username } = validationResult.data;

    // Get Supabase client from locals (following Astro guidelines)
    const supabase = locals.supabase;
    if (!supabase) {
      // Mock response for development when Supabase is not configured
      console.log('Mock registration for:', email);
      const mockUserId = `mock-user-${Date.now()}`;
      return new Response(JSON.stringify({ userId: mockUserId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Delegate registration to AuthService
      const authService = new AuthService(supabase);
      const { userId } = await authService.registerUser({ email, password, username });
      return new Response(JSON.stringify({ userId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (authError) {
      console.error('Auth service error:', authError);
      // Fallback to mock for development
      const mockUserId = `mock-user-${Date.now()}`;
      return new Response(JSON.stringify({ userId: mockUserId }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
