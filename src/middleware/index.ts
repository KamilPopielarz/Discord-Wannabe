import { createSupabaseServerInstance } from '../db/supabase.client.ts';
import { defineMiddleware } from 'astro:middleware';

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register", 
  "/reset-password",
  "/guest",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/guest",
  // Additional public endpoints for invites
  "/api/servers/invite/",
  "/api/invites/",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // Skip auth check for public paths
    if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
      return next();
    }

    // Special handling for room endpoints (GET by invite link)
    const isRoomByInviteLink = url.pathname.match(/^\/api\/rooms\/[^/]+$/) && request.method === "GET";
    if (isRoomByInviteLink) {
      return next();
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
      };
    } else {
      // For API routes, return 401
      if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // For pages, redirect to login
      return redirect('/login');
    }

    return next();
  },
);