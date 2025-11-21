import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // --- LOCATORS ---

  readonly title: Locator;
  readonly pageError: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.title = this.locator('login-title');
    this.pageError = this.locator('login-error');
    this.emailInput = this.locator('login-email');
    this.passwordInput = this.locator('login-password');
    this.emailError = this.locator('login-emailError');
    this.passwordError = this.locator('login-passwordError');
    this.submitButton = this.locator('login-submit');
  }

  // --- ACTIONS ---

  async open(baseUrl: string) {
    await this.goto('/login', baseUrl);
  }

  async fillFields(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async pageErrorText() {
    return this.pageError.textContent();
  }

  async emailErrorText() {
    return this.emailError.textContent();
  }

  async passwordErrorText() {
    return this.passwordError.textContent();
  }
}
