import type { APIRoute } from "astro";
import type { GetRoomResponseDto } from "../../../types";
import { InviteLinkSchema } from "../../../lib/validators/auth.validators";

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
      // Mock mode - simulate room info
      console.log("Mock mode: Returning mock room info for invite:", inviteLink);
      const response: GetRoomResponseDto = {
        roomId: `mock-room-${inviteLink}`,
        name: `Mock Room ${inviteLink.slice(-6)}`,
        requiresPassword: false,
        serverInviteLink: `mock-server-${inviteLink}`,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find room by invite link and get server info
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select(
        `
        id, name, password_hash, last_activity, server_id,
        servers!inner(invite_link)
      `
      )
      .eq("invite_link", inviteLink)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if invitation is still valid
    const { data: invitation, error: inviteError } = await supabase
      .from("invitation_links")
      .select("expires_at, max_uses, uses, revoked")
      .eq("link", inviteLink)
      .eq("room_id", room.id)
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

    const response: GetRoomResponseDto = {
      roomId: room.id,
      name: room.name,
      requiresPassword: !!room.password_hash,
      serverInviteLink: room.servers.invite_link,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get room error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
