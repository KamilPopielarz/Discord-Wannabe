import type { APIRoute } from "astro";
import { UUIDSchema } from "../../../../lib/validators/auth.validators";

export const prerender = false;

// Update user presence in a room (heartbeat)
export const POST: APIRoute = async ({ params, locals }) => {
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

    // Check if user has access to this room
    const { data: membership } = await supabase
      .from("user_room")
      .select("role")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Access denied to this room" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update or insert presence record
    const { error: presenceError } = await supabase
      .from("user_presence")
      .upsert({
        user_id: userId,
        room_id: roomId,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "user_id,room_id"
      });

    if (presenceError) {
      console.error("Failed to update user presence:", presenceError);
      // Check if table doesn't exist (migration not applied)
      if (presenceError.code === '42P01' || presenceError.message?.includes('does not exist')) {
        return new Response(JSON.stringify({ 
          error: "Presence table not found. Please apply database migration.",
          details: presenceError.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ 
        error: "Failed to update presence",
        details: presenceError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update presence error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Remove user presence from a room (when leaving)
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

    // Remove presence record (ignore error if table doesn't exist)
    const { error: presenceError } = await supabase
      .from("user_presence")
      .delete()
      .eq("user_id", userId)
      .eq("room_id", roomId);

    if (presenceError) {
      // Don't fail if table doesn't exist - just log it
      if (presenceError.code === '42P01' || presenceError.message?.includes('does not exist')) {
        console.warn("Presence table not found, skipping delete:", presenceError.message);
      } else {
        console.error("Failed to remove user presence:", presenceError);
        return new Response(JSON.stringify({ 
          error: "Failed to remove presence",
          details: presenceError.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Remove presence error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

