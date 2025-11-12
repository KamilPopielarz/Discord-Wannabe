import { Page, Locator } from "@playwright/test";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomList } from "./RoomList";

export class ServerDetailPage {
  readonly page: Page;
  readonly createRoomModal: CreateRoomModal;
  readonly roomList: RoomList;
  readonly title: Locator;
  readonly roomsSection: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createRoomModal = new CreateRoomModal(page);
    this.roomList = new RoomList(page);
    this.title = page.getByTestId("server-detail-title");
    this.roomsSection = page.getByTestId("server-rooms-section");
    this.backButton = page.locator('button:has-text("SERWERY")');
  }

  async goto(inviteLink: string) {
    await this.page.goto(`http://localhost:3000/servers/${inviteLink}`);
  }

  async isTitleVisible(): Promise<boolean> {
    return await this.title.isVisible();
  }

  async isRoomsSectionVisible(): Promise<boolean> {
    return await this.roomsSection.isVisible();
  }

  async waitForPageLoad() {
    await this.title.waitFor({ state: "visible", timeout: 10000 });
    await this.roomsSection.waitFor({ state: "visible", timeout: 10000 });
  }

  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL("**/servers");
  }
}



