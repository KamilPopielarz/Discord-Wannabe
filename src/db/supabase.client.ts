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
  // Development logging disabled for cleaner console
  // Configuration can be checked via browser dev tools if needed
}
