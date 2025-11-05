import type { APIRoute } from "astro";
import type { GetServerResponseDto } from "../../../../types";
import { InviteLinkSchema } from "../../../../lib/validators/auth.validators";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { inviteLink } = params;

    // Validate invite link parameter
    const validationResult = InviteLinkSchema.safeParse(inviteLink);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid invite link format",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find server by invite link
    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("id, invite_link, last_activity")
      .eq("invite_link", inviteLink)
      .single();

    if (serverError || !server) {
      return new Response(JSON.stringify({ error: "Server not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation is still valid
    const { data: invitation, error: inviteError } = await supabase
      .from("invitation_links")
      .select("expires_at, max_uses, uses, revoked")
      .eq("link", inviteLink)
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

    // Auto-join user to server if authenticated
    const userId = locals.userId;
    if (userId) {
      // Check if user is already a member of the server
      const { data: serverMembership } = await supabase
        .from("user_server")
        .select("role")
        .eq("user_id", userId)
        .eq("server_id", server.id)
        .single();

      // Add user to server if not already a member
      if (!serverMembership) {
        const { error: serverJoinError } = await supabase
          .from("user_server")
          .insert({
            user_id: userId,
            server_id: server.id,
            role: "Member",
          });

        if (serverJoinError) {
          console.error("Failed to join user to server:", serverJoinError);
          // Don't fail the request, just log the error
        } else {
          console.log("User successfully joined server");
          
          // Increment invitation uses
          await supabase
            .from("invitation_links")
            .update({ uses: (invitation.uses || 0) + 1 })
            .eq("link", inviteLink)
            .eq("server_id", server.id);
        }
      }
    }

    // Calculate TTL (servers are temporary and expire after 24 hours of inactivity)
    const lastActivity = new Date(server.last_activity);
    const ttlExpiresAt = new Date(lastActivity.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const response: GetServerResponseDto = {
      serverId: server.id,
      name: undefined, // Servers don't have names in this implementation
      ttlExpiresAt: ttlExpiresAt.toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get server error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
