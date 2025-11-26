import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export type DatabaseSupabaseClient = import("@supabase/supabase-js").SupabaseClient<Database>;

// Helper function to parse cookies from document.cookie
function getCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") return [];
  
  return document.cookie.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name: name.trim(), value: rest.join('=') };
  }).filter(cookie => cookie.name);
}

// Singleton instance
let browserClientInstance: DatabaseSupabaseClient | null = null;

// Create browser client for client-side real-time subscriptions
// This client handles cookies properly for authentication
export const createSupabaseBrowserClient = () => {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;
  
  if (!url || !key) {
    console.error("Supabase URL or key not configured");
    return null;
  }

  // Only create browser client on client side
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing instance if available
  if (browserClientInstance) {
    return browserClientInstance;
  }

  browserClientInstance = createBrowserClient<Database>(url, key, {
    cookies: {
      getAll() {
        return getCookies();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Build cookie string
          let cookieString = `${name}=${value}`;
          
          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`;
          }
          if (options?.domain) {
            cookieString += `; Domain=${options.domain}`;
          }
          if (options?.path) {
            cookieString += `; Path=${options.path}`;
          }
          if (options?.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookieString += `; Secure`;
          }
          if (options?.httpOnly) {
            // httpOnly cookies cannot be set from JavaScript
            // This is handled by the server
            return;
          }
          
          document.cookie = cookieString;
        });
      },
    },
  });

  return browserClientInstance;
};

