import type { APIRoute } from "astro";
import type { ListAuditLogsResponseDto } from "../../../../types";
import { UUIDSchema, PaginationSchema } from "../../../../lib/validators/auth.validators";

export const prerender = false;

export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // Parse query parameters
    const searchParams = new URLSearchParams(url.search);
    const queryValidation = PaginationSchema.safeParse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit } = queryValidation.data;

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

    // Check if user has permission to view audit logs (Owner or Admin)
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

    if (!["Owner", "Admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions to view audit logs" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch audit logs for the server
    const offset = (page - 1) * limit;
    
    const { data: logs, error: logsError } = await supabase
      .from("audit_logs")
      .select("id, actor_id, action, target_type, target_id, metadata, created_at")
      .eq("target_id", serverId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error("Failed to fetch audit logs:", logsError);
      return new Response(JSON.stringify({ error: "Failed to fetch audit logs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Also fetch logs for rooms in this server
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("server_id", serverId);

    const roomIds = rooms?.map(room => room.id) || [];
    
    let roomLogs: any[] = [];
    if (roomIds.length > 0) {
      const { data: roomLogsData } = await supabase
        .from("audit_logs")
        .select("id, actor_id, action, target_type, target_id, metadata, created_at")
        .in("target_id", roomIds)
        .eq("target_type", "room_member")
        .order("created_at", { ascending: false })
        .range(0, limit - 1); // Limit room logs to avoid too much data

      roomLogs = roomLogsData || [];
    }

    // Combine and sort all logs
    const allLogs = [...(logs || []), ...roomLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    // Check if there are more logs (for pagination)
    const { count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("target_id", serverId);

    const totalLogs = (count || 0) + roomLogs.length;
    const hasNextPage = offset + limit < totalLogs;

    const response: ListAuditLogsResponseDto = {
      logs: allLogs,
      nextPage: hasNextPage ? (page + 1).toString() : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
