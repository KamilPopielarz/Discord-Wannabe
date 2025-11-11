// Global test setup: testing-library matchers + fetch polyfill if needed
import "@testing-library/jest-dom";
// Polyfill fetch for node environment if missing (Vitest/node may provide it)
import "whatwg-fetch";

// Placeholder for MSW server startup if project adds handlers later
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { server } = require("./mocks/server");
  if (server && server.listen) {
    server.listen({ onUnhandledRequest: "warn" });
  }
} catch (e) {
  // No-op if MSW not yet configured
}




