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

    // Auto-join user to server and room if authenticated
    const userId = locals.userId;
    if (userId) {
      console.log("Auto-joining user to server and room:", { userId, serverId: room.server_id, roomId: room.id });
      
      // Check if user is already a member of the server
      const { data: serverMembership } = await supabase
        .from("user_server")
        .select("role")
        .eq("user_id", userId)
        .eq("server_id", room.server_id)
        .single();

      // Add user to server if not already a member
      if (!serverMembership) {
        const { error: serverJoinError } = await supabase
          .from("user_server")
          .insert({
            user_id: userId,
            server_id: room.server_id,
            role: "Member",
          });

        if (serverJoinError) {
          console.error("Failed to join user to server:", serverJoinError);
        } else {
          console.log("User successfully joined server");
        }
      }

      // Check if user is already a member of the room
      const { data: roomMembership } = await supabase
        .from("user_room")
        .select("role")
        .eq("user_id", userId)
        .eq("room_id", room.id)
        .single();

      // Add user to room if not already a member
      if (!roomMembership) {
        const { error: roomJoinError } = await supabase
          .from("user_room")
          .insert({
            user_id: userId,
            room_id: room.id,
            role: "Member",
          });

        if (roomJoinError) {
          console.error("Failed to join user to room:", roomJoinError);
        } else {
          console.log("User successfully joined room");
          
          // Increment invitation uses
          await supabase
            .from("invitation_links")
            .update({ uses: invitation.uses + 1 })
            .eq("link", inviteLink)
            .eq("room_id", room.id);
        }
      }
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
