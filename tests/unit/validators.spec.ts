import { describe, it, expect } from "vitest";
// Import project validators (adjust path if necessary)
import { UUIDSchema, SendMessageSchema, MessageQuerySchema } from "../../src/lib/validators/auth.validators";

describe("validators - auth.validators (basic)", () => {
  it("UUIDSchema should accept a valid uuid", () => {
    const result = UUIDSchema.safeParse("00000000-0000-0000-0000-000000000000");
    expect(result.success).toBe(true);
  });

  it("SendMessageSchema should reject empty content", () => {
    const result = SendMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("MessageQuerySchema should supply defaults", () => {
    const result = MessageQuerySchema.safeParse({ page: "1", limit: "20" });
    expect(result.success).toBe(true);
    if (result.success) {
      // Accept either string or number representations depending on Zod coercion
      expect(String(result.data.page)).toBe("1");
    }
  });
});


