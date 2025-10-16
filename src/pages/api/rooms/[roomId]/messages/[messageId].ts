import type { APIRoute } from "astro";
import { z } from "zod";
import { UUIDSchema } from "../../../../../lib/validators/auth.validators";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { roomId, messageId } = params;

    // Validate parameters
    const roomIdValidation = UUIDSchema.safeParse(roomId);
    const messageIdValidation = z.string().regex(/^\d+$/).safeParse(messageId); // Messages have BIGSERIAL id

    if (!roomIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid room ID format",
          details: roomIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!messageIdValidation.success) {
      return new Response(JSON.stringify({ error: "Invalid message ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const userId = locals.userId;
    const sessionId = locals.sessionId;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId && !sessionId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("id, user_id, session_id, room_id")
      .eq("id", parseInt(messageId))
      .eq("room_id", roomId)
      .single();

    if (messageError || !message) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions to delete message
    let canDelete = false;

    if (userId) {
      // User can delete their own messages
      if (message.user_id === userId) {
        canDelete = true;
      } else {
        // Or if they have admin/moderator role in the room
        const { data: membership } = await supabase
          .from("user_room")
          .select("role")
          .eq("user_id", userId)
          .eq("room_id", roomId)
          .single();

        if (membership && ["Owner", "Admin", "Moderator"].includes(membership.role)) {
          canDelete = true;
        }
      }
    } else if (sessionId) {
      // Guests can only delete their own messages
      if (message.session_id === sessionId) {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return new Response(JSON.stringify({ error: "Insufficient permissions to delete this message" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete message
    const { error: deleteError } = await supabase
      .from("messages")
      .delete()
      .eq("id", parseInt(messageId))
      .eq("room_id", roomId);

    if (deleteError) {
      console.error("Failed to delete message:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update room activity
    await supabase
      .from("rooms")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", roomId);

    return new Response(JSON.stringify({ message: "Message deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
