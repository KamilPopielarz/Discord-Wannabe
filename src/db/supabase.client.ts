import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";
import type { SupabaseClient as _SC } from "@supabase/supabase-js";
export type DatabaseSupabaseClient = _SC<Database>;

// Use PUBLIC_ variables for client-side, regular for server-side
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;

// Create Supabase client or null if not configured
export const supabaseClient =
  !supabaseUrl || !supabaseAnonKey ? null : createClient<Database>(supabaseUrl, supabaseAnonKey);

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  console.log("Supabase config:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl,
    client: !!supabaseClient,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing SUPABASE_URL or SUPABASE_KEY environment variables - using mock mode");
  }
}
