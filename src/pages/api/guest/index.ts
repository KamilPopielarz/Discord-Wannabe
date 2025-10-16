import type { APIRoute } from "astro";
import type { CreateGuestSessionCommand, GuestSessionResponseDto } from "../../../types";
import { CreateGuestSessionSchema } from "../../../lib/validators/auth.validators";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse request body
    let body: CreateGuestSessionCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = CreateGuestSessionSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { serverInviteLink } = validationResult.data;

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify server invite link exists and is valid
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id, invite_link")
      .eq("invite_link", serverInviteLink)
      .single();

    if (serverError || !server) {
      return new Response(JSON.stringify({ error: "Invalid server invite link" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation is still valid
    const { data: invitation, error: inviteError } = await supabase
      .from("invitation_links")
      .select("expires_at, max_uses, uses, revoked")
      .eq("link", serverInviteLink)
      .eq("server_id", server.id)
      .single();

    if (inviteError || !invitation) {
      return new Response(JSON.stringify({ error: "Invalid invitation" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation is revoked
    if (invitation.revoked) {
      return new Response(JSON.stringify({ error: "Invitation has been revoked" }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation has expired" }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation has reached max uses
    if (invitation.max_uses && invitation.uses >= invitation.max_uses) {
      return new Response(JSON.stringify({ error: "Invitation has reached maximum uses" }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate guest nickname and session
    const crypto = await import("crypto");
    const sessionId = crypto.randomUUID();
    const guestNick = `Guest_${crypto.randomBytes(4).toString("hex")}`;

    // Create guest session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const { error: sessionError } = await supabase.from("sessions").insert({
      session_id: sessionId,
      user_id: null, // Guest sessions don't have user_id
      guest_nick: guestNick,
      expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      console.error("Failed to create guest session:", sessionError);
      return new Response(JSON.stringify({ error: "Failed to create guest session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Increment invitation uses
    await supabase
      .from("invitation_links")
      .update({ uses: invitation.uses + 1 })
      .eq("link", serverInviteLink)
      .eq("server_id", server.id);

    // Update server activity
    await supabase
      .from("servers")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", server.id);

    // Set guest session cookie
    cookies.set("guest_session_id", sessionId, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    const response: GuestSessionResponseDto = {
      sessionId,
      guestNick,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Guest session creation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
