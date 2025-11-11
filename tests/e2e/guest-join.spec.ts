// Avoid importing Playwright when running under Vitest to prevent runner conflicts.
if (!process.env.VITEST) {
  const { test, expect } = require("@playwright/test");
  test("guest join flow - basic smoke", async ({ page }) => {
    // This test assumes a running dev server at localhost:3000.
    await page.goto("http://localhost:3000/guest");
    // Basic presence checks for fields/buttons
    const nickInput = await page.locator('input[name=\"nick\"], input#nick');
    const joinButton = await page.locator('button:has-text(\"Join\"), button:has-text(\"Dołącz\")');
    await expect(nickInput).toBeVisible();
    await expect(joinButton).toBeVisible();
  });
}


