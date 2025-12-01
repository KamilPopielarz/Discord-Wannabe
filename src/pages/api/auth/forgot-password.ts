import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance, supabaseAdminClient } from "../../../db/supabase.client.ts";
import { verifyTurnstileToken } from "../../../lib/services/turnstile.service.ts";

export const prerender = false;

// Schema for password reset request
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  captchaToken: z.string().min(1, "CAPTCHA token is required"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = ForgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, captchaToken } = validationResult.data;

    // Verify Turnstile CAPTCHA token
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     request.headers.get('X-Real-IP') || 
                     undefined;
                     
    const isCaptchaValid = await verifyTurnstileToken(captchaToken, clientIP);
    if (!isCaptchaValid) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user exists (security vs usability trade-off requested by user)
    if (supabaseAdminClient) {
      const { data: listResult } = await supabaseAdminClient.auth.admin.listUsers();
      const found = listResult.users.find((u) => u.email === email);
      
      if (!found) {
        return new Response(JSON.stringify({ 
          message: "Nie znaleziono użytkownika z tym adresem e-mail" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("supabaseAdminClient is not available - skipping user existence check");
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Send password reset email
    const siteUrl = import.meta.env.DEV
      ? new URL(request.url).origin
      : "https://discord-wannabe.pages.dev";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      // If we verified user exists, this error is likely a system error
      return new Response(JSON.stringify({ 
        message: "Wystąpił błąd podczas wysyłania e-maila. Spróbuj ponownie później." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Password reset email sent. Please check your inbox." 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
