import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service.ts";
import { DeleteAccountSchema } from "../../../lib/validators/settings.validators.ts";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.supabase || !locals.userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    DeleteAccountSchema.parse(body);

    const service = new UserService(locals.supabase);
    await service.deleteAccount(locals.userId, body);

    await locals.supabase.auth.signOut();

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[api/settings/account] Failed to delete account:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

