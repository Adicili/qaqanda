import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly title: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);

    this.title = this.locator('home-title');
    this.registerLink = this.locator('home-register-link');
  }

  // --- ACTIONS ---
  async open(baseUrl: string) {
    await this.goto(baseUrl);
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }
}
