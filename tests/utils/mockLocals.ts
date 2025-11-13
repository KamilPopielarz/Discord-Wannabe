import type { Request as NodeRequest } from "node-fetch";

export function createMockLocals({ supabase, userId, sessionId }: { supabase?: any; userId?: string | null; sessionId?: string | null } = {}) {
  return {
    supabase: supabase ?? null,
    userId: userId ?? null,
    sessionId: sessionId ?? null,
  };
}







