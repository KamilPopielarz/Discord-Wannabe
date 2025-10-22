import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { verifyTurnstileToken } from "../../../lib/services/turnstile.service.ts";

export const prerender = false;

// Schema for password reset request
const ResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  captchaToken: z.string().min(1, "CAPTCHA token is required"),
});

// Schema for password reset confirmation
const ResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST: APIRoute = async ({ request, cookies, url }) => {
  try {
    const body = await request.json();
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if this is a reset request or confirmation
    const token = url.searchParams.get('token');
    
    if (token) {
      // Password reset confirmation
      const validationResult = ResetConfirmSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Validation failed",
            details: validationResult.error.errors,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { password } = validationResult.data;

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        message: "Password updated successfully" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Password reset request
      const validationResult = ResetRequestSchema.safeParse(body);
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${new URL(request.url).origin}/reset-password`,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        message: "Password reset email sent. Please check your inbox." 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
