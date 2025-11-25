import { createSupabaseServerInstance } from '../db/supabase.client.ts';
import { defineMiddleware } from 'astro:middleware';
import { UserService } from '../lib/services/user.service.ts';

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register", 
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  // Additional public endpoints for invites
  "/api/servers/invite/",
  "/api/invites/",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    // ---------------------------------------------------------
    // OPTYMALIZACJA: Ignoruj pliki statyczne i assets
    // Zapobiega zbędnym zapytaniom do bazy dla obrazków, CSS, JS itp.
    // ---------------------------------------------------------
    const isStaticAsset = 
      url.pathname.startsWith("/_astro/") ||
      url.pathname.startsWith("/assets/") ||
      url.pathname.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/);

    if (isStaticAsset) {
      return next();
    }

    // ---------------------------------------------------------
    // TRYB KONSERWACJI (MAINTENANCE MODE)
    // ---------------------------------------------------------
    const runtimeEnv = (locals as any).runtime?.env || {};
    const isMaintenanceMode = 
      runtimeEnv.MAINTENANCE_MODE === "true" || 
      import.meta.env.MAINTENANCE_MODE === "true";

    if (isMaintenanceMode) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="pl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Przerwa techniczna | Discord-Wannabe</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #e4e4e7; display: flex; height: 100vh; align-items: center; justify-content: center; text-align: center; margin: 0; padding: 20px; }
            .container { max-width: 500px; padding: 2rem; border: 1px solid #27272a; border-radius: 1rem; background: #18181b; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            h1 { color: #f97316; margin-top: 0; font-size: 1.5rem; letter-spacing: -0.025em; }
            p { line-height: 1.6; color: #a1a1aa; margin-bottom: 0; }
            .icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="icon">🚧</span>
            <h1>Aplikacja tymczasowo niedostępna</h1>
            <p>Przeprowadzamy planowane prace konserwacyjne. <br>Discord-Wannabe wróci do działania już wkrótce.</p>
          </div>
        </body>
        </html>`,
        {
          status: 503,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

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

      locals.profile = {
        username: locals.username,
      };

      try {
        const userService = new UserService(supabase);
        const profile = await userService.getProfile(user.id, {
          fallbackUsername: locals.username,
          email: user.email ?? undefined,
        });
        locals.profile = {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl ?? null,
        };
      } catch (profileError) {
        console.error('[middleware] Failed to hydrate profile', profileError);
      }
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