import type { APIRoute } from "astro";
import { supabaseAdminClient } from "../../db/supabase.client.ts";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    if (!locals.userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use admin client to get full user data with user_metadata
    let username = locals.username || 
                   (locals.user?.email ? locals.user.email.split("@")[0] : undefined) || 
                   "Użytkownik";
    let email: string | undefined = locals.user?.email;

    // Always try to get username from admin API to ensure we have the latest data
    if (supabaseAdminClient) {
      try {
        const { data: authUser } = await supabaseAdminClient.auth.admin.getUserById(locals.userId);
        
        if (authUser.user) {
          // Extract username from metadata - this is the most reliable source
          const metadataUsername = authUser.user.user_metadata?.username;
          if (metadataUsername) {
            username = metadataUsername;
          } else if (authUser.user.email) {
            username = authUser.user.email.split('@')[0];
          }
          email = authUser.user.email || email;
          
          // Debug logging
          console.log('[api/me] User metadata:', {
            userId: locals.userId,
            metadataUsername,
            finalUsername: username,
            email: authUser.user.email
          });
        }
      } catch (error) {
        // Fall back to locals.username or email-based username if admin API fails
        console.error(`Failed to get user details for ${locals.userId}:`, error);
        // Keep the fallback values already set above
      }
    } else {
      console.warn('[api/me] supabaseAdminClient not available, using fallback username');
    }

    return new Response(
      JSON.stringify({
        userId: locals.userId,
        email: email,
        username: username,
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


