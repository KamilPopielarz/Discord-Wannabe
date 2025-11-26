import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance, supabaseAdminClient } from "../../../db/supabase.client.ts";
import { verifyTurnstileToken } from "../../../lib/services/turnstile.service.ts";

export const prerender = false;

// Zod schema for validation
const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
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
    const validationResult = RegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email, password, username, captchaToken } = validationResult.data;

    // Temporarily disabled CAPTCHA verification
    // TODO: Re-enable CAPTCHA verification in production
    /*
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
    */

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const siteUrl = import.meta.env.PROD
      ? "https://discord-wannabe.pages.dev"
      : new URL(request.url).origin;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/login?confirmed=true`,
        data: {
          username: username,
        },
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure username is properly saved in user_metadata and user_profiles
    if (data.user && supabaseAdminClient) {
      try {
        // Update user_metadata with username using admin API
        const { error: updateError } = await supabaseAdminClient.auth.admin.updateUserById(data.user.id, {
          user_metadata: { username: username },
        });

        if (updateError) {
          console.error("[Register] Warning: Failed to update user metadata:", updateError.message);
          // Don't fail registration, but log the error
        } else {
          console.log(`[Register] Successfully updated user_metadata for user ${data.user.id}`);
        }

        // Also create/update user_profiles record (more reliable source)
        try {
          const { error: profileError } = await supabaseAdminClient
            .from("user_profiles")
            .upsert({
              user_id: data.user.id,
              username: username,
              social: {},
            }, {
              onConflict: "user_id"
            });

          if (profileError) {
            // Table might not exist, log but continue
            if (profileError.code === '42P01' || profileError.message?.includes('does not exist')) {
              console.warn("[Register] user_profiles table not available, skipping profile creation");
            } else {
              console.error("[Register] Warning: Failed to create user_profiles:", profileError.message);
            }
          } else {
            console.log(`[Register] Successfully created user_profiles for user ${data.user.id}`);
          }
        } catch (profileError) {
          console.warn("[Register] Error creating user_profiles:", (profileError as Error).message);
          // Don't fail registration if profile creation fails
        }

        // Verify username was saved (check both sources)
        const { data: verifyUser } = await supabaseAdminClient.auth.admin.getUserById(data.user.id);
        if (verifyUser?.user) {
          const savedUsername = verifyUser.user.user_metadata?.username;
          if (savedUsername !== username) {
            console.warn(`[Register] Username mismatch: expected ${username}, got ${savedUsername}`);
          } else {
            console.log(`[Register] Verified username saved correctly: ${username}`);
          }
        }
      } catch (metadataError) {
        console.error("[Register] Warning: Error updating user metadata:", (metadataError as Error).message);
        // Don't fail registration, but log the error
      }
    }

    return new Response(JSON.stringify({ 
      message: "Registration successful. Please check your email to confirm your account.",
      user: data.user 
    }), {
      status: 200,
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