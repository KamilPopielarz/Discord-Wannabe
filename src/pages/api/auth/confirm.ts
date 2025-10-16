import type { APIRoute } from "astro";
import type { ConfirmEmailCommand } from "../../../types";
import { ConfirmEmailSchema } from "../../../lib/validators/auth.validators";

export const prerender = false;

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

    // Find and validate token
    const { data: confirmation, error: tokenError } = await supabase
      .from("email_confirmations")
      .select("user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !confirmation) {
      return new Response(JSON.stringify({ error: "Invalid confirmation token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (confirmation.used) {
      return new Response(JSON.stringify({ error: "Confirmation token has already been used" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (new Date(confirmation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Confirmation token has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from("email_confirmations")
      .update({ used: true })
      .eq("token", token);

    if (updateTokenError) {
      console.error("Failed to update confirmation token:", updateTokenError);
      return new Response(JSON.stringify({ error: "Failed to confirm email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Confirm user email in Supabase Auth
    const { error: confirmUserError } = await supabase.auth.admin.updateUserById(confirmation.user_id, {
      email_confirm: true,
    });

    if (confirmUserError) {
      console.error("Failed to confirm user email:", confirmUserError);
      return new Response(JSON.stringify({ error: "Failed to confirm email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Email confirmed successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email confirmation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
