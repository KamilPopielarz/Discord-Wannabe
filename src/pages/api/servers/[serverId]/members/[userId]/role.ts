import type { APIRoute } from "astro";
import type { UpdateServerMemberRoleCommand } from "../../../../../../types";
import { UpdateServerMemberRoleSchema, UUIDSchema } from "../../../../../../lib/validators/auth.validators";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    const { serverId, userId: targetUserId } = params;

    // Validate parameters
    const serverIdValidation = UUIDSchema.safeParse(serverId);
    const userIdValidation = UUIDSchema.safeParse(targetUserId);

    if (!serverIdValidation.success || !userIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid server ID or user ID format",
          details: [...(serverIdValidation.error?.errors || []), ...(userIdValidation.error?.errors || [])],
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: UpdateServerMemberRoleCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = UpdateServerMemberRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { role: newRole } = validationResult.data;

    // Get Supabase client and user info from locals
    const supabase = locals.supabase;
    const currentUserId = locals.userId;

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user's role in the server
    const { data: currentMembership, error: currentMemberError } = await supabase
      .from("user_server")
      .select("role")
      .eq("user_id", currentUserId)
      .eq("server_id", serverId)
      .single();

    if (currentMemberError || !currentMembership) {
      return new Response(JSON.stringify({ error: "Server not found or access denied" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get target user's current role
    const { data: targetMembership, error: targetMemberError } = await supabase
      .from("user_server")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("server_id", serverId)
      .single();

    if (targetMemberError || !targetMembership) {
      return new Response(JSON.stringify({ error: "Target user is not a member of this server" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Define role hierarchy
    const roleHierarchy = { Owner: 4, Admin: 3, Moderator: 2, Member: 1 };
    const currentUserLevel = roleHierarchy[currentMembership.role as keyof typeof roleHierarchy] || 0;
    const targetUserLevel = roleHierarchy[targetMembership.role as keyof typeof roleHierarchy] || 0;
    const newRoleLevel = roleHierarchy[newRole as keyof typeof roleHierarchy] || 0;

    // Permission checks
    if (currentUserId === targetUserId) {
      return new Response(JSON.stringify({ error: "Cannot change your own role" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only Owners and Admins can change roles
    if (!["Owner", "Admin"].includes(currentMembership.role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions to change roles" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cannot promote someone to a role higher than your own
    if (newRoleLevel >= currentUserLevel) {
      return new Response(JSON.stringify({ error: "Cannot promote user to a role equal or higher than your own" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cannot modify someone with equal or higher role
    if (targetUserLevel >= currentUserLevel) {
      return new Response(JSON.stringify({ error: "Cannot modify role of user with equal or higher permissions" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only Owners can create other Owners
    if (newRole === "Owner" && currentMembership.role !== "Owner") {
      return new Response(JSON.stringify({ error: "Only server owners can promote users to Owner" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update role
    const { error: updateError } = await supabase
      .from("user_server")
      .update({ role: newRole })
      .eq("user_id", targetUserId)
      .eq("server_id", serverId);

    if (updateError) {
      console.error("Failed to update server member role:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update role" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      actor_id: currentUserId,
      action: "role_change",
      target_type: "server_member",
      target_id: serverId,
      metadata: {
        target_user_id: targetUserId,
        old_role: targetMembership.role,
        new_role: newRole,
      },
    });

    // Update server activity
    await supabase.from("servers").update({ last_activity: new Date().toISOString() }).eq("id", serverId);

    return new Response(
      JSON.stringify({
        message: "Role updated successfully",
        userId: targetUserId,
        newRole,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update server member role error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
