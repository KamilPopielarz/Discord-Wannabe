import type { AstroCookies } from 'astro';
import { createServerClient, createBrowserClient, type CookieOptionsWithName } from '@supabase/ssr';
import { createClient, type SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import type { Database } from './database.types.ts';

export type DatabaseSupabaseClient = BaseSupabaseClient<Database>;

export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabase;
};

// Legacy clients for backward compatibility (will be removed)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseClient =
  !supabaseUrl || !supabaseAnonKey ? null : createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseAdminClient =
  !supabaseUrl || !supabaseServiceKey ? null : createClient<Database>(supabaseUrl, supabaseServiceKey);

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

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  // Development logging disabled for cleaner console
  // Configuration can be checked via browser dev tools if needed
}
