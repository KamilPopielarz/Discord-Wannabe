import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorBanner = page.locator('[role="alert"], .matrix-error').first();
  }

  async goto() {
    await this.page.goto("http://localhost:3000/login");
  }

  async fillEmail(email: string) {
    // Clear first, then type to trigger React onChange events
    await this.emailInput.clear();
    await this.emailInput.type(email, { delay: 50 });
    // Trigger blur to ensure validation runs
    await this.emailInput.blur();
  }

  async fillPassword(password: string) {
    // Clear first, then type to trigger React onChange events
    await this.passwordInput.clear();
    await this.passwordInput.type(password, { delay: 50 });
    // Trigger blur to ensure validation runs
    await this.passwordInput.blur();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    // Wait for React state updates and form validation
    await this.page.waitForTimeout(200); // Give React time to process
    
    // Wait for button to be enabled (form validation passes)
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    
    // Click button and wait for response
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes("/api/auth/login") && response.status() === 200,
        { timeout: 10000 }
      ).catch(() => null), // Don't fail if response doesn't come
      this.submitButton.click()
    ]);
    
    // Wait a bit for client-side redirect
    await this.page.waitForTimeout(500);
    
    // Check if we're already on /servers or wait for navigation
    const currentUrl = this.page.url();
    if (!currentUrl.includes("/servers")) {
      await this.page.waitForURL("**/servers", { timeout: 10000, waitUntil: "domcontentloaded" });
    }
  }

  async isEmailInputVisible(): Promise<boolean> {
    return await this.emailInput.isVisible();
  }

  async isPasswordInputVisible(): Promise<boolean> {
    return await this.passwordInput.isVisible();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  async waitForNavigation() {
    // Wait for navigation after login - use waitForURL with proper options
    await this.page.waitForURL("**/servers", { timeout: 10000, waitUntil: "networkidle" });
  }
}

