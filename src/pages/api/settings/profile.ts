import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service.ts";
import { UpdateProfileSchema } from "../../../lib/validators/settings.validators.ts";

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
    const { avatarData, ...payload } = UpdateProfileSchema.parse(body);

    const service = new UserService(locals.supabase);
    let avatarUrl = payload.avatarUrl ?? null;

    if (avatarData) {
      avatarUrl = await service.uploadAvatarFromBase64(locals.userId, avatarData);
    }

    const profile = await service.updateProfile(locals.userId, {
      ...payload,
      avatarUrl,
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api/settings/profile] Failed to update profile:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

