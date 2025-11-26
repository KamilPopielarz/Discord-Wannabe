import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

export const prerender = false;

// Schema for password reset confirmation
const ResetConfirmSchema = z.object({
  token: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST: APIRoute = async ({ request, cookies, url }) => {
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

    // Get token from query params or body
    const tokenFromQuery = url.searchParams.get('token');
    const tokenFromBody = body.token;
    const token = tokenFromQuery || tokenFromBody;

    // Validate input
    const validationResult = ResetConfirmSchema.safeParse({
      token,
      newPassword: body.newPassword
    });
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { newPassword } = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Update user password using the token
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      let errorMessage = "Failed to update password";
      
      if (error.message.includes("invalid") || error.message.includes("expired")) {
        errorMessage = "Reset link is invalid or has expired";
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
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
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
