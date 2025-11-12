import { test, expect } from "@playwright/test";
import { LoginPage, ServersDashboardPage, ServerDetailPage } from "./page-objects";

test.describe("Create Room Flow", () => {
  test("should create a room after login and server creation", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const serversPage = new ServersDashboardPage(page);
    const serverDetailPage = new ServerDetailPage(page);

    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "testpassword";
    const serverName = `Test Server ${Date.now()}`;
    const roomName = `Test Room ${Date.now()}`;

    // Act - Login
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await loginPage.login(testEmail, testPassword);
    // Navigation is handled inside login() method

    // Act - Create Server (if needed)
    await serversPage.goto();
    const hasServers = await serversPage.getServerCardCount() > 0;
    
    if (!hasServers) {
      await serversPage.createServerModal.create(serverName);
      await serversPage.waitForServerToAppear(serverName);
    }

    // Act - Open Server
    await serversPage.clickServerConnectButton(0);
    await serverDetailPage.waitForPageLoad();

    // Assert - Server Detail Page loaded
    await expect(serverDetailPage.title).toBeVisible();
    await expect(serverDetailPage.roomList.title).toBeVisible();

    // Act - Create Room
    await serverDetailPage.createRoomModal.create(roomName);

    // Assert - Room appears in list
    await serverDetailPage.roomList.waitForRoomToAppear(roomName);
    const roomCard = serverDetailPage.roomList.getRoomCardByName(roomName);
    await expect(roomCard).toBeVisible();
    await expect(roomCard.locator('[data-testid="room-card-name"]')).toContainText(roomName.toUpperCase());
  });

  test("should create a room with password", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const serversPage = new ServersDashboardPage(page);
    const serverDetailPage = new ServerDetailPage(page);

      const testEmail = process.env.E2E_USERNAME || "test@example.com";
      const testPassword = process.env.E2E_PASSWORD || "testpassword";
      const roomName = `Secure Room ${Date.now()}`;
    const roomPassword = "securepass123";

    // Act - Login and navigate to server
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    // Navigation is handled inside login() method

    await serversPage.goto();
    if ((await serversPage.getServerCardCount()) === 0) {
      await serversPage.createServerModal.create(`Test Server ${Date.now()}`);
    }
    await serversPage.clickServerConnectButton(0);
    await serverDetailPage.waitForPageLoad();

    // Act - Create Room with Password
    await serverDetailPage.createRoomModal.create(roomName, roomPassword);

    // Assert - Room appears with password indicator
    await serverDetailPage.roomList.waitForRoomToAppear(roomName);
    const roomCard = serverDetailPage.roomList.getRoomCardByName(roomName);
    await expect(roomCard).toBeVisible();
    await expect(roomCard.locator('text=SECURED')).toBeVisible();
  });
});

