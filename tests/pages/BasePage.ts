import { Page, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  protected baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = (page.context() as any)._options.baseUrl ?? 'http://localhost:3000';
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async expectTitleContains(text: string) {
    await expect(this.page).toHaveTitle(new RegExp(text, 'i'));
  }
}
