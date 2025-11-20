import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  // --- LOCATORS ---

  readonly title: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly emailErrors: Locator;
  readonly passwordErrors: Locator;
  readonly confirmPasswordErrors: Locator;

  constructor(page: Page) {
    super(page);

    this.title = this.locator('register-title');
    this.emailInput = this.locator('register-email');
    this.passwordInput = this.locator('register-password');
    this.confirmPasswordInput = this.locator('register-confirmPassword');
    this.submitButton = this.locator('register-submit');
    this.emailErrors = this.locator('register-email-errors');
    this.passwordErrors = this.locator('register-password-errors');
    this.confirmPasswordErrors = this.locator('register-confirmPassword-errors');
  }

  // --- ACTIONS ---

  async open(baseUrl: string) {
    await this.goto('/register', baseUrl);
  }

  async fillForm(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  async submit() {
    await this.submitButton.click();
  }

  async emailErrorText() {
    return this.emailErrors.textContent();
  }

  async passwordErrorText() {
    return this.passwordErrors.textContent();
  }

  async confirmPasswordErrorText() {
    return this.confirmPasswordErrors.textContent();
  }
}
