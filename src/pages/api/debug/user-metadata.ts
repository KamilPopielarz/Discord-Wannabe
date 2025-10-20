import type { APIRoute } from "astro";
import { supabaseAdminClient } from "../../../db/supabase.client.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const userId = locals.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdminClient) {
      return new Response(JSON.stringify({ error: "Admin client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user data from auth.users
    const { data: userData, error } = await supabaseAdminClient.auth.admin.getUserById(userId);
    
    if (error) {
      return new Response(JSON.stringify({ error: "Failed to get user data", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      userId: userId,
      email: userData.user?.email,
      user_metadata: userData.user?.user_metadata,
      raw_user_meta_data: userData.user?.user_metadata,
      created_at: userData.user?.created_at,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Debug user metadata error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
