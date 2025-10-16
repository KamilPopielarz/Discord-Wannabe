import type { APIRoute } from "astro";
import { UUIDSchema } from "../../../../lib/validators/auth.validators";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { serverId } = params;

    // Validate server ID parameter
    const validationResult = UUIDSchema.safeParse(serverId);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid server ID format",
          details: validationResult.error.errors,
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

    // Check if user has permission to delete server (must be Owner)
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

    if (membership.role !== "Owner") {
      return new Response(JSON.stringify({ error: "Only server owners can delete servers" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete server (cascade will handle related records)
    const { error: deleteError } = await supabase.from("servers").delete().eq("id", serverId);

    if (deleteError) {
      console.error("Failed to delete server:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Server deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Server deletion error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
