import type { APIRoute } from "astro";
import { z } from "zod";
import type { LoginCommand } from "../../../types";
import { AuthService, AuthenticationError } from "../../../lib/services/auth.service";

export const prerender = false;

// Zod schema for validation
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse request body
    let body: LoginCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = LoginSchema.safeParse(body);
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

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delegate login to AuthService
    const authService = new AuthService(supabase);
    try {
      const { userId, sessionId } = await authService.loginUser({ email, password });
      // Set HTTP-only cookie for session
      cookies.set("session_id", sessionId, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "strict",
        maxAge: 24 * 60 * 60,
        path: "/",
      });
      return new Response(JSON.stringify({ message: "Login successful", userId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (err instanceof AuthenticationError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.error("Login error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
