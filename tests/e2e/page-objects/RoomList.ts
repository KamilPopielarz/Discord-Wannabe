import { Page, Locator } from "@playwright/test";

export class RoomList {
  readonly page: Page;
  readonly title: Locator;
  readonly roomsList: Locator;
  readonly roomsEmptyState: Locator;
  readonly roomCards: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId("rooms-list-title");
    this.roomsList = page.getByTestId("rooms-list");
    this.roomsEmptyState = page.getByTestId("rooms-empty-state");
    this.roomCards = page.getByTestId("room-card");
    this.refreshButton = page.locator('button:has-text("ODŚWIEŻ")');
  }

  getRoomCardByIndex(index: number): Locator {
    return this.roomCards.nth(index);
  }

  getRoomCardByName(roomName: string): Locator {
    return this.roomCards.filter({
      has: this.page.getByTestId("room-card-name").filter({ hasText: roomName.toUpperCase() }),
    });
  }

  async getRoomCardCount(): Promise<number> {
    return await this.roomCards.count();
  }

  async isTitleVisible(): Promise<boolean> {
    return await this.title.isVisible();
  }

  async isRoomsListVisible(): Promise<boolean> {
    return await this.roomsList.isVisible();
  }

  async isRoomsEmptyStateVisible(): Promise<boolean> {
    return await this.roomsEmptyState.isVisible();
  }

  async waitForRoomToAppear(roomName: string) {
    await this.page.waitForSelector(
      `[data-testid="room-card"]:has([data-testid="room-card-name"]:has-text("${roomName.toUpperCase()}"))`,
      {
        timeout: 10000,
      }
    );
  }

  async refresh() {
    await this.refreshButton.click();
  }
}

