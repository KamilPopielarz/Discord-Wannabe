import { test, expect } from "@playwright/test";

test("guest join flow - basic smoke", async ({ page }) => {
  // This test assumes a running dev server at localhost:3000.
  await page.goto("http://localhost:3000/guest");
  // Basic presence checks for fields/buttons
  const inviteLinkInput = page.locator('input[id="invite-link"]');
  const joinButton = page.locator('button:has-text("Dołącz jako gość"), button:has-text("Dołącz")');
  await expect(inviteLinkInput).toBeVisible();
  await expect(joinButton).toBeVisible();
});


