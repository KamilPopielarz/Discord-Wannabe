import type { APIRoute } from "astro";
import { UserService } from "../../../../lib/services/user.service.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.supabase || !locals.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const service = new UserService(locals.supabase);
    const sessions = await service.listSessions(locals.userId, locals.sessionId);

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api/settings/sessions] Failed to list sessions:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

