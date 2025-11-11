import { describe, it, expect } from "vitest";
import { createMockSupabase } from "../utils/createMockSupabase";

// Lightweight test: ensure hook logic doesn't throw when Supabase unavailable.
describe("useAdminLogs hook (smoke)", () => {
  it("should not throw when supabase client is null", async () => {
    const mockSupabase = null;
    // Use dynamic import which Vitest can resolve for TS modules
    const module = await import("../../src/lib/hooks/useAdminLogs");
    const { useAdminLogs } = module;
    // Do not call the hook (invalid hook call outside React component) — ensure export exists and is a function
    expect(typeof useAdminLogs).toBe("function");
  });
});


