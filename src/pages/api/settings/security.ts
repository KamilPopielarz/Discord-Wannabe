import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service.ts";
import {
  ChangePasswordSchema,
  ToggleTwoFactorSchema,
} from "../../../lib/validators/settings.validators.ts";

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
    const service = new UserService(locals.supabase);

    if ("newPassword" in body) {
      const payload = ChangePasswordSchema.parse(body);
      await service.changePassword(locals.userId, payload, locals.user?.email);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof body.enabled === "boolean") {
      const payload = ToggleTwoFactorSchema.parse(body);
      const secret = await service.toggleTwoFactor(locals.userId, payload);
      return new Response(
        JSON.stringify({ twoFactorEnabled: payload.enabled, secret }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Unsupported payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[api/settings/security] Failed to update security:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

