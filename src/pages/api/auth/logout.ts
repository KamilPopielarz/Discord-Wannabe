import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Get session ID from cookie
    const sessionId = cookies.get("session_id")?.value;

    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete session from database if we have one
    if (sessionId) {
      const { error: deleteError } = await supabase
        .from("auth_sessions")
        .delete()
        .eq("session_id", sessionId);

      if (deleteError) {
        console.error("Failed to delete session:", deleteError);
        // Continue with logout even if database deletion fails
      }
    }

    // Clear session cookie
    cookies.delete("session_id", {
      path: "/",
    });

    return new Response(JSON.stringify({ message: "Logout successful" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Logout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
