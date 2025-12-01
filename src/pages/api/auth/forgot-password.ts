import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance, supabaseAdminClient } from "../../../db/supabase.client.ts";
import { verifyTurnstileToken } from "../../../lib/services/turnstile.service.ts";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types.ts";

export const prerender = false;

// Schema for password reset request
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  captchaToken: z.string().min(1, "CAPTCHA token is required"),
});

export const POST: APIRoute = async ({ request, cookies, locals }) => {
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

    // Attempt to get Supabase Service Role Key from various sources
    let serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Try getting from Cloudflare runtime context if not available in import.meta.env
    // This is crucial for Cloudflare Pages where secrets are in the request context
    if (!serviceRoleKey && (locals as any).runtime?.env?.SUPABASE_SERVICE_ROLE_KEY) {
      serviceRoleKey = (locals as any).runtime.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    // Construct admin client dynamically if needed
    let adminClient = supabaseAdminClient;
    
    if (!adminClient && serviceRoleKey) {
      const supabaseUrl = import.meta.env.SUPABASE_URL || 
                          import.meta.env.PUBLIC_SUPABASE_URL || 
                          (locals as any).runtime?.env?.PUBLIC_SUPABASE_URL;
                          
      if (supabaseUrl) {
        adminClient = createClient<Database>(supabaseUrl, serviceRoleKey);
      }
    }

    // Check if user exists (security vs usability trade-off requested by user)
    if (adminClient) {
      // NOTE: fetching all users is not scalable for large user bases.
      // However, Supabase Admin API currently doesn't support filtering listUsers by email directly.
      // A better approach in the future would be a dedicated RPC function or a public profile table check.
      const { data: listResult, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (listError) {
        console.error("Error listing users:", listError);
        return new Response(JSON.stringify({ error: "Internal server error checking user" }), { status: 500 });
      }

      const found = listResult.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!found) {
        return new Response(JSON.stringify({ 
          message: "Nie znaleziono użytkownika z tym adresem e-mail" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      console.error("supabaseAdminClient is not available - cannot check user existence. Missing SUPABASE_SERVICE_ROLE_KEY?");
      return new Response(JSON.stringify({ 
        message: "Błąd konfiguracji serwera: Brak klucza Service Role Key. Skontaktuj się z administratorem." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
