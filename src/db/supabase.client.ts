import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";
import type { SupabaseClient as _SC } from "@supabase/supabase-js";
export type DatabaseSupabaseClient = _SC<Database>;

// Use PUBLIC_ variables for client-side, regular for server-side
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Create regular Supabase client with anon key
export const supabaseClient =
  !supabaseUrl || !supabaseAnonKey ? null : createClient<Database>(supabaseUrl, supabaseAnonKey);

// Create admin client with service role key for admin operations
export const supabaseAdminClient =
  !supabaseUrl || !supabaseServiceKey ? null : createClient<Database>(supabaseUrl, supabaseServiceKey);

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  console.log("Supabase config:", {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    url: supabaseUrl,
    serviceKey: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : "missing",
    client: !!supabaseClient,
    adminClient: !!supabaseAdminClient,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing SUPABASE_URL or SUPABASE_KEY environment variables - using mock mode");
  }
  if (!supabaseServiceKey) {
    console.warn("Missing SUPABASE_SERVICE_ROLE_KEY - admin operations will not work");
  } else {
    console.log("Admin client should be available for user metadata operations");
  }
}
