import type { APIRoute } from "astro";
import { z } from "zod";
import type { LoginCommand } from "../../../types";

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

    // Get user from Supabase Auth
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === email);

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify password using Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if email is confirmed using our custom table
    const { data: confirmation } = await supabase
      .from("email_confirmations")
      .select("used")
      .eq("user_id", user.id)
      .eq("used", true)
      .single();

    if (!confirmation) {
      return new Response(
        JSON.stringify({ error: "Email not confirmed. Please check your email and confirm your account." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create custom session
    const crypto = await import("crypto");
    const sessionId = crypto.randomUUID();
    const accessToken = crypto.randomBytes(32).toString("hex");
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const { error: sessionError } = await supabase.from("auth_sessions").insert({
      session_id: sessionId,
      user_id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      return new Response(JSON.stringify({ error: "Failed to create session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set HTTP-only cookie for session
    cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return new Response(
      JSON.stringify({
        message: "Login successful",
        userId: user.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
