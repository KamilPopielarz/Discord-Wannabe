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
    // Always attach Supabase client to locals so public API routes can use it
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });
    locals.supabase = supabase;

    // Skip auth check for public paths
    if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
      return next();
    }

    // Special handling for room endpoints (GET by invite link)
    const isRoomByInviteLink = url.pathname.match(/^\/api\/rooms\/[^/]+$/) && request.method === "GET";
    if (isRoomByInviteLink) {
      return next();
    }

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
      };
      locals.userId = user.id;
      // Derive username from user metadata (fallback to email local-part, then "Użytkownik")
      const metadataUsername = (user.user_metadata as any)?.username as string | undefined;
      const emailFallback = user.email ? user.email.split("@")[0] : undefined;
      // Ensure we always have a username - use metadata first, then email, then generic fallback
      locals.username = metadataUsername || emailFallback || "Użytkownik";
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