import type { APIRoute } from "astro";
import { UserService } from "../../../../../lib/services/user.service.ts";
import { RevokeSessionSchema } from "../../../../../lib/validators/settings.validators.ts";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    if (!locals.supabase || !locals.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionId = params?.sessionId;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = RevokeSessionSchema.parse({ sessionId });
    const service = new UserService(locals.supabase);
    await service.revokeSession(locals.userId, payload, locals.sessionId);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api/settings/sessions/:id] Failed to revoke session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

