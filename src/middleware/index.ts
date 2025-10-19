import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Supabase client to locals (can be null in development)
  context.locals.supabase = supabaseClient;
  const supabase = context.locals.supabase;

  // Authentication middleware for API routes
  if (context.url.pathname.startsWith("/api/")) {
    // Skip auth for public endpoints
    const publicEndpoints = [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/confirm",
      "/api/auth/password-reset/request",
      "/api/auth/password-reset/confirm",
      "/api/guest",
      "/api/servers/invite/", // GET server by invite link and POST join server
      "/api/rooms/", // GET room by invite link and membership check
      "/api/invites/", // GET invitation info
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) => {
      const pathMatches = context.url.pathname.startsWith(endpoint);

      if (!pathMatches) return false;

      // Allow all methods for auth and guest endpoints
      if (endpoint.includes("auth") || endpoint.includes("guest")) {
        return true;
      }

      // Allow only GET for other endpoints (servers, rooms, invites)
      return context.request.method === "GET";
    });

    if (!isPublicEndpoint) {
      // Skip auth if Supabase is not configured (development mode)
      if (!supabase) {
        // In development mode without Supabase, create mock user session
        const sessionId = context.cookies.get("session_id")?.value;
        if (sessionId) {
          // Extract mock user ID from session ID (created in login endpoint)
          context.locals.userId = `mock-user-${sessionId.split("-").pop()}`;
          context.locals.sessionId = sessionId;
        }
        return next();
      }

      // Check for custom session tokens
      const sessionId = context.cookies.get("session_id")?.value;
      const guestSessionId = context.cookies.get("guest_session_id")?.value;

      let isAuthenticated = false;

      // Try user session first
      if (sessionId) {
        const { data: userSession, error: sessionError } = await supabase
          .from("auth_sessions")
          .select("user_id, expires_at")
          .eq("session_id", sessionId)
          .single();

        if (!sessionError && userSession) {
          // Check if session is expired
          if (new Date(userSession.expires_at) > new Date()) {
            context.locals.userId = userSession.user_id;
            context.locals.sessionId = sessionId;
            isAuthenticated = true;
          } else {
            // Clean up expired session
            await supabase.from("auth_sessions").delete().eq("session_id", sessionId);
            context.cookies.delete("session_id", { path: "/" });
          }
        } else {
          // Clear invalid session cookie
          context.cookies.delete("session_id", { path: "/" });
        }
      }

      // If user auth failed, try guest session
      if (!isAuthenticated && guestSessionId) {
        const { data: guestSession, error: guestError } = await supabase
          .from("sessions")
          .select("session_id, guest_nick, expires_at")
          .eq("session_id", guestSessionId)
          .single();

        if (!guestError && guestSession) {
          // Check if guest session is expired
          if (new Date(guestSession.expires_at) > new Date()) {
            // Add guest info to locals
            context.locals.userId = undefined; // Guests don't have user_id
            context.locals.sessionId = guestSession.session_id;
            context.locals.guestNick = guestSession.guest_nick ?? undefined;
            isAuthenticated = true;
          } else {
            // Clean up expired guest session
            await supabase.from("sessions").delete().eq("session_id", guestSessionId);
            context.cookies.delete("guest_session_id", { path: "/" });
          }
        } else {
          // Clear invalid guest session cookie
          context.cookies.delete("guest_session_id", { path: "/" });
        }
      }

      if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // CORS headers for API routes
    const response = await next();

    if (context.request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Add CORS headers to API responses
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return response;
  }

  return next();
});
