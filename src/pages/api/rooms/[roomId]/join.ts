import type { APIRoute } from "astro";
import type { JoinRoomCommand } from "../../../../types";
import { JoinRoomSchema, UUIDSchema } from "../../../../lib/validators/auth.validators";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
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

    // Parse request body
    let body: JoinRoomCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = JoinRoomSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = validationResult.data;

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

    // Get room information
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, password_hash, server_id")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is already a member of the room
    const { data: existingMembership } = await supabase
      .from("user_room")
      .select("role")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .single();

    if (existingMembership) {
      return new Response(JSON.stringify({ message: "Already a member of this room" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if room requires password
    if (room.password_hash) {
      if (!password) {
        return new Response(JSON.stringify({ error: "Room password is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify password
      const bcrypt = await import("bcrypt");
      const isValidPassword = await bcrypt.compare(password, room.password_hash);

      if (!isValidPassword) {
        // Track failed password attempts
        const clientIP = request.headers.get("x-forwarded-for") || "unknown";

        // Check current attempts
        const { data: attempts } = await supabase
          .from("room_password_attempts")
          .select("attempts, blocked_until")
          .eq("room_id", roomId)
          .eq("ip_address", clientIP)
          .single();

        if (attempts?.blocked_until && new Date(attempts.blocked_until) > new Date()) {
          return new Response(JSON.stringify({ error: "Too many failed attempts. Please try again later." }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          });
        }

        const newAttempts = (attempts?.attempts || 0) + 1;
        const blockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null; // 15 minutes block

        await supabase.from("room_password_attempts").upsert({
          room_id: roomId,
          ip_address: clientIP,
          attempts: newAttempts,
          blocked_until: blockedUntil?.toISOString() || null,
        });

        return new Response(JSON.stringify({ error: "Invalid room password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Clear failed attempts on successful password
      await supabase
        .from("room_password_attempts")
        .delete()
        .eq("room_id", roomId)
        .eq("ip_address", request.headers.get("x-forwarded-for") || "unknown");
    }

    // Check if user is a member of the server
    const { data: serverMembership } = await supabase
      .from("user_server")
      .select("role")
      .eq("user_id", userId)
      .eq("server_id", room.server_id)
      .single();

    if (!serverMembership) {
      return new Response(JSON.stringify({ error: "Must be a member of the server to join rooms" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add user to room as Member
    const { error: joinError } = await supabase.from("user_room").insert({
      user_id: userId,
      room_id: roomId,
      role: "Member",
    });

    if (joinError) {
      console.error("Failed to join room:", joinError);
      return new Response(JSON.stringify({ error: "Failed to join room" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update room activity
    await supabase.from("rooms").update({ last_activity: new Date().toISOString() }).eq("id", roomId);

    // Update server activity
    await supabase.from("servers").update({ last_activity: new Date().toISOString() }).eq("id", room.server_id);

    return new Response(JSON.stringify({ message: "Successfully joined room" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Room join error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
