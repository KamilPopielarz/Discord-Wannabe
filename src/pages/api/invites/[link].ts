import type { APIRoute } from "astro";
import type { GetInvitationResponseDto, RevokeInvitationCommand } from "../../../types";
import { InviteLinkSchema, RevokeInvitationSchema } from "../../../lib/validators/auth.validators";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { link } = params;

    // Validate invite link parameter
    const validationResult = InviteLinkSchema.safeParse(link);
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

    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("invitation_links")
      .select("server_id, room_id, expires_at, max_uses, uses, revoked")
      .eq("link", link)
      .single();

    if (inviteError || !invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine invitation type and ID
    const type = invitation.server_id ? "server" : "room";
    const id = invitation.server_id || invitation.room_id;

    if (!id) {
      return new Response(JSON.stringify({ error: "Invalid invitation data" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate uses left
    const usesLeft = invitation.max_uses ? Math.max(0, invitation.max_uses - invitation.uses) : -1; // -1 means unlimited

    const response: GetInvitationResponseDto = {
      type,
      id,
      expiresAt: invitation.expires_at,
      usesLeft,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { link } = params;

    // Validate invite link parameter
    const linkValidation = InviteLinkSchema.safeParse(link);
    if (!linkValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid invite link format",
          details: linkValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: RevokeInvitationCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = RevokeInvitationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { expiresAt, maxUses, revoked } = validationResult.data;

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const userId = locals.userId;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("invitation_links")
      .select("id, server_id, room_id")
      .eq("link", link)
      .single();

    if (inviteError || !invitation) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions to modify invitation
    let hasPermission = false;

    if (invitation.server_id) {
      // Check server permissions
      const { data: serverMembership } = await supabase
        .from("user_server")
        .select("role")
        .eq("user_id", userId)
        .eq("server_id", invitation.server_id)
        .single();

      if (serverMembership && ["Owner", "Admin"].includes(serverMembership.role)) {
        hasPermission = true;
      }
    } else if (invitation.room_id) {
      // Check room permissions
      const { data: roomMembership } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", invitation.room_id)
        .single();

      if (roomMembership && ["Owner", "Admin"].includes(roomMembership.role)) {
        hasPermission = true;
      } else {
        // Check server permissions for room
        const { data: room } = await supabase.from("rooms").select("server_id").eq("id", invitation.room_id).single();

        if (room) {
          const { data: serverMembership } = await supabase
            .from("user_server")
            .select("role")
            .eq("user_id", userId)
            .eq("server_id", room.server_id)
            .single();

          if (serverMembership && ["Owner", "Admin"].includes(serverMembership.role)) {
            hasPermission = true;
          }
        }
      }
    }

    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Insufficient permissions to modify this invitation" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;
    if (maxUses !== undefined) updateData.max_uses = maxUses;
    if (revoked !== undefined) updateData.revoked = revoked;

    // Update invitation
    const { error: updateError } = await supabase.from("invitation_links").update(updateData).eq("id", invitation.id);

    if (updateError) {
      console.error("Failed to update invitation:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update invitation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      actor_id: userId,
      action: "invitation_modified",
      target_type: invitation.server_id ? "server" : "room",
      target_id: invitation.server_id || invitation.room_id,
      metadata: {
        invitation_link: link,
        changes: updateData,
      },
    });

    return new Response(JSON.stringify({ message: "Invitation updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update invitation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
