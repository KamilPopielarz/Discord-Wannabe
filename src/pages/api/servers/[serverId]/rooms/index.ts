import type { APIRoute } from "astro";
import type { CreateRoomCommand, CreateRoomResponseDto } from "../../../../../types";
import { CreateRoomSchema, UUIDSchema } from "../../../../../lib/validators/auth.validators";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const { serverId } = params;

    // Validate server ID parameter
    const serverIdValidation = UUIDSchema.safeParse(serverId);
    if (!serverIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid server ID format",
          details: serverIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: CreateRoomCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = CreateRoomSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, password } = validationResult.data;

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

    // Check if user has permission to create rooms in this server
    const { data: membership, error: memberError } = await supabase
      .from("user_server")
      .select("role")
      .eq("user_id", userId)
      .eq("server_id", serverId)
      .single();

    if (memberError || !membership) {
      return new Response(JSON.stringify({ error: "Server not found or access denied" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only Owners, Admins, and Moderators can create rooms
    if (!["Owner", "Admin", "Moderator"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions to create rooms" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate unique invite link for room
    const crypto = await import("crypto");
    const inviteLink = crypto.randomBytes(16).toString("hex");

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const bcrypt = await import("bcrypt");
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create room in database
    const { data: newRoom, error: createError } = await supabase
      .from("rooms")
      .insert({
        name,
        server_id: serverId,
        invite_link: inviteLink,
        password_hash: passwordHash,
        is_permanent: false, // Rooms are temporary by default
        last_activity: new Date().toISOString(),
      })
      .select("id, invite_link")
      .single();

    if (createError || !newRoom) {
      console.error("Failed to create room:", createError);
      return new Response(JSON.stringify({ error: "Failed to create room" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add creator as room owner
    const { error: roomMemberError } = await supabase.from("user_room").insert({
      user_id: userId,
      room_id: newRoom.id,
      role: "Owner",
    });

    if (roomMemberError) {
      console.error("Failed to add room owner:", roomMemberError);
      // Clean up created room
      await supabase.from("rooms").delete().eq("id", newRoom.id);
      return new Response(JSON.stringify({ error: "Failed to create room" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create invitation link record
    const { error: inviteError } = await supabase.from("invitation_links").insert({
      link: inviteLink,
      room_id: newRoom.id,
      expires_at: null, // Room invites don't expire by default
      max_uses: null, // Unlimited uses by default
      revoked: false,
    });

    if (inviteError) {
      console.error("Failed to create invitation link:", inviteError);
      // Clean up created room and membership
      await supabase.from("user_room").delete().eq("room_id", newRoom.id);
      await supabase.from("rooms").delete().eq("id", newRoom.id);
      return new Response(JSON.stringify({ error: "Failed to create room" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update server activity
    await supabase.from("servers").update({ last_activity: new Date().toISOString() }).eq("id", serverId);

    const response: CreateRoomResponseDto = {
      roomId: newRoom.id,
      inviteLink: newRoom.invite_link,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Room creation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
