import type { APIRoute } from "astro";
import type { GetRoomResponseDto } from "../../../../types";
import { UUIDSchema, InviteLinkSchema } from "../../../../lib/validators/auth.validators";
import { z } from "zod";

export const prerender = false;

// Zod schema for password verification
const VerifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// Helper to check if string is UUID
const isUUID = (str: string) => UUIDSchema.safeParse(str).success;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { roomId: param } = params;
    const inviteLink = param;

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
        name: `Mock Room ${inviteLink?.slice(-6)}`,
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

      // If room requires password and user is NOT a member, do NOT auto-join
      if (room.password_hash && !roomMembership) {
          // Just return the info, let frontend handle the password prompt
      } else {
          // Add user to room if not already a member (and no password required OR already member)
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { roomId } = params;

    // Validate room ID parameter
    const roomIdValidation = UUIDSchema.safeParse(roomId);
    if (!roomIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid room ID format",
          details: roomIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // Get room info to check permissions
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("server_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions
    // 1. Check if user is the owner of the room (if user_room has Owner role)
    // 2. Check if user is Owner/Admin of the server

    // Check room membership for ownership
    const { data: roomMembership } = await supabase
      .from("user_room")
      .select("role")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .single();

    const isRoomOwner = roomMembership?.role === "Owner";

    // Check server membership for admin rights
    const { data: serverMembership } = await supabase
        .from("user_server")
        .select("role")
        .eq("user_id", userId)
        .eq("server_id", room.server_id)
        .single();

    const isServerAdmin = ["Owner", "Admin"].includes(serverMembership?.role || "");

    if (!isRoomOwner && !isServerAdmin) {
       return new Response(JSON.stringify({ error: "Insufficient permissions to delete room" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete room
    const { error: deleteError } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);

    if (deleteError) {
      console.error("Failed to delete room:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete room" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Room deletion error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { roomId: param } = params;
    const inviteLink = param;

    // If it's a UUID, we don't support POST for now (or implement UpdateRoom?)
    if (isUUID(param!)) {
         return new Response(JSON.stringify({ error: "Method not allowed for Room ID" }), { 
             status: 405,
             headers: { "Content-Type": "application/json" }
         });
    }

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

    // Validate password input
    const passwordValidation = VerifyPasswordSchema.safeParse(body);
    if (!passwordValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: passwordValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = passwordValidation.data;

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find room by invite link
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, password_hash")
      .eq("invite_link", inviteLink)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if room requires password
    if (!room.password_hash) {
      return new Response(JSON.stringify({ error: "Room does not require password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify password
    const { verifyPassword } = await import("../../../../lib/utils/crypto");
    const isValid = await verifyPassword(password, room.password_hash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Password is valid

    // Add user to room as Member
    const userId = locals.userId;
    if (userId) {
        // Check if already member
        const { data: membership } = await supabase
            .from("user_room")
            .select("role")
            .eq("user_id", userId)
            .eq("room_id", room.id)
            .single();

        if (!membership) {
             const { error: joinError } = await supabase
              .from("user_room")
              .insert({
                user_id: userId,
                room_id: room.id,
                role: "Member",
              });
            
            if (joinError) {
                console.error("Failed to join room after password verification:", joinError);
                // Even if join fails, return success so client can try to navigate? 
                // Or fail? Better to fail if we can't persist access.
                return new Response(JSON.stringify({ error: "Failed to join room" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Password verification error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
