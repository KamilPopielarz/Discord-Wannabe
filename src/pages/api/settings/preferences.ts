import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service.ts";
import { UpdatePreferencesSchema } from "../../../lib/validators/settings.validators.ts";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.supabase || !locals.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const payload = UpdatePreferencesSchema.parse(body);

    const service = new UserService(locals.supabase);
    const preferences = await service.updatePreferences(locals.userId, payload);

    return new Response(JSON.stringify(preferences), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api/settings/preferences] Failed to update preferences:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

