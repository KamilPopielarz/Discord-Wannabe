import type { APIRoute } from "astro";
import type { CreateServerCommand, CreateServerResponseDto } from "../../../types";
import { CreateServerSchema } from "../../../lib/validators/auth.validators";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
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

    // Get all servers (all users should see all servers)
    const { data: servers, error: serversError } = await supabase
      .from("servers")
      .select("id, invite_link, name, last_activity")
      .order("last_activity", { ascending: false });

    if (serversError) {
      console.error("Failed to load servers:", serversError);
      return new Response(JSON.stringify({ error: "Failed to load servers" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's memberships to determine which servers they belong to
    const { data: memberships } = await supabase
      .from("user_server")
      .select("server_id, role")
      .eq("user_id", userId);

    const membershipMap = new Map(
      (memberships ?? []).map((m) => [m.server_id, m.role])
    );

    const response = {
      servers: (servers ?? []).map((s) => ({
        serverId: s.id,
        inviteLink: s.invite_link,
        name: s.name || undefined,
        ttlExpiresAt: new Date(new Date(s.last_activity).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        isMember: membershipMap.has(s.id),
        role: membershipMap.get(s.id) || null,
      })),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Servers list error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    // Parse request body
    let body: CreateServerCommand;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input
    const validationResult = CreateServerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name } = validationResult.data;

    // Generate unique invite link
    const crypto = await import("crypto");
    const inviteLink = crypto.randomBytes(16).toString("hex");

    // Create server in database
    const { data: newServer, error: createError } = await supabase
      .from("servers")
      .insert({
        name,
        invite_link: inviteLink,
        last_activity: new Date().toISOString(),
      })
      .select("id, invite_link")
      .single();

    if (createError || !newServer) {
      console.error("Failed to create server:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create server",
          details: createError?.message || "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add creator as server owner
    const { error: memberError } = await supabase.from("user_server").insert({
      user_id: userId,
      server_id: newServer.id,
      role: "Owner",
    });

    if (memberError) {
      console.error("Failed to add server owner:", memberError);
      // Clean up created server
      await supabase.from("servers").delete().eq("id", newServer.id);
      return new Response(JSON.stringify({ error: "Failed to create server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create invitation link record
    const { error: inviteError } = await supabase.from("invitation_links").insert({
      link: inviteLink,
      server_id: newServer.id,
      expires_at: null, // Server invites don't expire by default
      max_uses: null, // Unlimited uses by default
      revoked: false,
    });

    if (inviteError) {
      console.error("Failed to create invitation link:", inviteError);
      // Clean up created server and membership
      await supabase.from("user_server").delete().eq("server_id", newServer.id);
      await supabase.from("servers").delete().eq("id", newServer.id);
      return new Response(JSON.stringify({ error: "Failed to create server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: CreateServerResponseDto = {
      serverId: newServer.id,
      inviteLink: newServer.invite_link,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Server creation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
