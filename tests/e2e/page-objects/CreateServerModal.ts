import { Page, Locator } from "@playwright/test";

export class CreateServerModal {
  readonly page: Page;
  readonly triggerButton: Locator;
  readonly nameInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggerButton = page.getByTestId("create-server-trigger-button");
    this.nameInput = page.getByTestId("create-server-name-input");
    this.submitButton = page.getByTestId("create-server-submit-button");
    this.cancelButton = page.getByTestId("create-server-cancel-button");
    this.dialog = page.locator('text=Utwórz nowy serwer').locator('..');
  }

  async open() {
    await this.triggerButton.click();
    await this.dialog.waitFor({ state: "visible" });
  }

  async fillServerName(name: string) {
    await this.nameInput.fill(name);
  }

  async create(name: string) {
    await this.open();
    await this.fillServerName(name);
    await this.submitButton.click();
    await this.dialog.waitFor({ state: "hidden" });
  }

  async cancel() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: "hidden" });
  }

  async isDialogVisible(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }
}













