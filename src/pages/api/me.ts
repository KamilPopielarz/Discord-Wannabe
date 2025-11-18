import type { APIRoute } from "astro";
import { UserService } from "../../lib/services/user.service.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.userId || !locals.supabase) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const service = new UserService(locals.supabase);
    const profile = await service.getProfile(locals.userId, {
      fallbackUsername: locals.username,
      email: locals.user?.email ?? undefined,
    });
    const preferences = await service.getPreferences(locals.userId);

    return new Response(
      JSON.stringify({
        userId: locals.userId,
        email: locals.user?.email,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        preferences,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};


