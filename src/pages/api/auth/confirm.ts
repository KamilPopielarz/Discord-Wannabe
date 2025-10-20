import type { APIRoute } from "astro";
import { z } from "zod";
import type { ConfirmEmailCommand } from "../../../types";
import { AuthService, ValidationError, TokenExpiredError } from "../../../lib/services/auth.service";

export const prerender = false;

// Zod schema for validation
const ConfirmEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// GET handler for easy link-based confirmation
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        `<html><body><h1>❌ Missing Token</h1><p>No confirmation token provided in URL.</p></body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        `<html><body><h1>❌ Database Error</h1><p>Database connection not available.</p></body></html>`,
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    const authService = new AuthService(supabase);
    try {
      await authService.confirmEmail({ token });
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">✅ Email Confirmed!</h1>
          <p>Your email has been successfully confirmed. You can now log in.</p>
          <a href="/login" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Login</a>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    } catch (err) {
      let errorMessage = "Unknown error occurred";
      if (err instanceof ValidationError) {
        errorMessage = err.message;
      } else if (err instanceof TokenExpiredError) {
        errorMessage = "Confirmation token has expired";
      }

      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">❌ Confirmation Failed</h1>
          <p>${errorMessage}</p>
          <a href="/register" style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Back to Register</a>
        </body></html>`,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (error) {
    console.error("Email confirmation error:", error);
    return new Response(`<html><body><h1>❌ Server Error</h1><p>Internal server error occurred.</p></body></html>`, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    let body: ConfirmEmailCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = ConfirmEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { token } = validationResult.data;

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delegate confirmation to AuthService
    const authService = new AuthService(supabase);
    try {
      await authService.confirmEmail({ token });
      return new Response(JSON.stringify({ message: "Email confirmed successfully" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (err instanceof ValidationError || err instanceof TokenExpiredError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.error("Email confirmation error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Email confirmation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
