import { Page, Locator } from "@playwright/test";

export class CreateRoomModal {
  readonly page: Page;
  readonly triggerButton: Locator;
  readonly nameInput: Locator;
  readonly passwordCheckbox: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggerButton = page.getByTestId("create-room-trigger-button");
    this.nameInput = page.getByTestId("create-room-name-input");
    this.passwordCheckbox = page.getByTestId("create-room-password-checkbox");
    this.passwordInput = page.getByTestId("create-room-password-input");
    this.submitButton = page.getByTestId("create-room-submit-button");
    this.cancelButton = page.getByTestId("create-room-cancel-button");
    this.dialog = page.locator('text=Utwórz nowy pokój').locator('..');
  }

  async open() {
    await this.triggerButton.click();
    await this.dialog.waitFor({ state: "visible" });
  }

  async fillRoomName(name: string) {
    await this.nameInput.fill(name);
  }

  async enablePassword() {
    await this.passwordCheckbox.check();
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async create(name: string, password?: string) {
    await this.open();
    await this.fillRoomName(name);
    
    if (password) {
      await this.enablePassword();
      await this.fillPassword(password);
    }
    
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

  async isPasswordInputVisible(): Promise<boolean> {
    return await this.passwordInput.isVisible();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }
}




