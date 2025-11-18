import type { APIRoute } from "astro";
import { UserService } from "../../../lib/services/user.service.ts";

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
    const data = await service.exportData(locals.userId);

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="discord-wannabe-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("[api/settings/export] Failed to export data:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

