import { Page, Locator } from "@playwright/test";
import { CreateServerModal } from "./CreateServerModal";

export class ServersDashboardPage {
  readonly page: Page;
  readonly createServerModal: CreateServerModal;
  readonly serversList: Locator;
  readonly serversEmptyState: Locator;
  readonly serverCards: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createServerModal = new CreateServerModal(page);
    this.serversList = page.getByTestId("servers-list");
    this.serversEmptyState = page.getByTestId("servers-empty-state");
    this.serverCards = page.getByTestId("server-card");
    this.refreshButton = page.locator('button:has-text("ODŚWIEŻ")');
  }

  async goto() {
    await this.page.goto("http://localhost:3000/servers");
  }

  getServerCardByIndex(index: number): Locator {
    return this.serverCards.nth(index);
  }

  async clickServerConnectButton(index: number) {
    const serverCard = this.getServerCardByIndex(index);
    const connectButton = serverCard.getByTestId("server-connect-button");
    await connectButton.click();
  }

  async getServerCardCount(): Promise<number> {
    return await this.serverCards.count();
  }

  async isServersListVisible(): Promise<boolean> {
    return await this.serversList.isVisible();
  }

  async isServersEmptyStateVisible(): Promise<boolean> {
    return await this.serversEmptyState.isVisible();
  }

  async waitForServerToAppear(serverName: string) {
    await this.page.waitForSelector(`[data-testid="server-card"]:has-text("${serverName}")`, {
      timeout: 10000,
    });
  }
}

