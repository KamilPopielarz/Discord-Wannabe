import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";
import type { SupabaseClient as _SC } from "@supabase/supabase-js";
export type DatabaseSupabaseClient = _SC<Database>;

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Create Supabase client or null if not configured
export const supabaseClient =
  !supabaseUrl || !supabaseAnonKey ? null : createClient<Database>(supabaseUrl, supabaseAnonKey);

// Log warning if not configured (only in development)
if ((!supabaseUrl || !supabaseAnonKey) && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn("Missing SUPABASE_URL or SUPABASE_KEY environment variables - using mock mode");
}
