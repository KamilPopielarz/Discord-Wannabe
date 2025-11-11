import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4321"; // Astro default port
const TEST_TIMEOUT = 30000; // Increased timeout for server startup

let serverAvailable = false;

describe("API Integration Tests (HTTP)", () => {
  beforeAll(async () => {
    // Wait for server to be ready
    let retries = 10; // Quick check
    while (retries > 0) {
      try {
        const response = await fetch(`${BASE_URL}/api/me`, {
          signal: AbortSignal.timeout(2000),
        });
        // Server is responding (any status means server is up)
        serverAvailable = true;
        console.log(`Server is ready (status: ${response.status})`);
        return;
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries--;
    }
    // Skip tests if server is not available
    console.warn(
      `⚠️  Dev server not available at ${BASE_URL}. Skipping HTTP integration tests. ` +
        `To run these tests, start the dev server: npm run dev`
    );
  }, TEST_TIMEOUT);

  describe("POST /api/auth/register", () => {
    it.skipIf(!serverAvailable)(
      "should reject invalid email format",
      async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "invalid-email",
            password: "Test1234",
            username: "testuser",
            captchaToken: "test-token",
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject short password",
      async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "short",
            username: "testuser",
            captchaToken: "test-token",
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject missing captchaToken",
      async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "Test1234",
            username: "testuser",
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid JSON body",
      async () => {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json",
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid JSON");
      },
      TEST_TIMEOUT
    );
  });

  describe("GET /api/servers", () => {
    it.skipIf(!serverAvailable)(
      "should require authentication",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers`, {
          method: "GET",
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toContain("Authentication required");
      },
      TEST_TIMEOUT
    );
  });

  describe("POST /api/servers", () => {
    it.skipIf(!serverAvailable)(
      "should require authentication",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test Server" }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toContain("Authentication required");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid server name",
      async () => {
        // Note: This will fail auth first, but we test validation separately
        const response = await fetch(`${BASE_URL}/api/servers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "" }),
        });

        // Should fail at auth or validation
        expect([400, 401]).toContain(response.status);
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid JSON",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json",
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid JSON");
      },
      TEST_TIMEOUT
    );
  });

  describe("GET /api/servers/[serverId]/rooms", () => {
    it.skipIf(!serverAvailable)(
      "should reject invalid UUID format",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers/invalid-uuid/rooms`, {
          method: "GET",
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid server ID format");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should require authentication",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(`${BASE_URL}/api/servers/${validUUID}/rooms`, {
          method: "GET",
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toContain("Authentication required");
      },
      TEST_TIMEOUT
    );
  });

  describe("POST /api/servers/[serverId]/rooms", () => {
    it.skipIf(!serverAvailable)(
      "should reject invalid UUID format",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers/invalid-uuid/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Test Room" }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid server ID format");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid room name",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(`${BASE_URL}/api/servers/${validUUID}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "" }),
        });

        // Should fail at auth or validation
        expect([400, 401]).toContain(response.status);
      },
      TEST_TIMEOUT
    );
  });

  describe("GET /api/rooms/[roomId]/messages", () => {
    it.skipIf(!serverAvailable)(
      "should reject invalid UUID format",
      async () => {
        const response = await fetch(`${BASE_URL}/api/rooms/invalid-uuid/messages`, {
          method: "GET",
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid room ID format");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should accept valid query parameters",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(
          `${BASE_URL}/api/rooms/${validUUID}/messages?page=1&limit=20`,
          {
            method: "GET",
          }
        );

        // Should return 200 (mock mode) or 401 (auth required)
        expect([200, 401]).toContain(response.status);
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid page parameter",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(
          `${BASE_URL}/api/rooms/${validUUID}/messages?page=invalid&limit=20`,
          {
            method: "GET",
          }
        );

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid query parameters");
      },
      TEST_TIMEOUT
    );
  });

  describe("POST /api/rooms/[roomId]/messages", () => {
    it.skipIf(!serverAvailable)(
      "should reject invalid UUID format",
      async () => {
        const response = await fetch(`${BASE_URL}/api/rooms/invalid-uuid/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "Test message" }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid room ID format");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject empty message content",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(`${BASE_URL}/api/rooms/${validUUID}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: "" }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject message content exceeding max length",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const longContent = "a".repeat(2001);
        const response = await fetch(`${BASE_URL}/api/rooms/${validUUID}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: longContent }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should reject invalid JSON",
      async () => {
        const validUUID = "00000000-0000-0000-0000-000000000000";
        const response = await fetch(`${BASE_URL}/api/rooms/${validUUID}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "invalid json",
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain("Invalid JSON");
      },
      TEST_TIMEOUT
    );
  });

  describe("Error handling", () => {
    it.skipIf(!serverAvailable)(
      "should return JSON error responses",
      async () => {
        const response = await fetch(`${BASE_URL}/api/servers`, {
          method: "GET",
        });

        expect(response.headers.get("Content-Type")).toContain("application/json");
        const data = await response.json();
        expect(data).toHaveProperty("error");
      },
      TEST_TIMEOUT
    );

    it.skipIf(!serverAvailable)(
      "should handle non-existent endpoints gracefully",
      async () => {
        const response = await fetch(`${BASE_URL}/api/nonexistent`, {
          method: "GET",
        });

        // Astro returns 404 for non-existent routes
        expect(response.status).toBe(404);
      },
      TEST_TIMEOUT
    );
  });
});

