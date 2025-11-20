// Uvozimo samo tipove iz Playwright-a za Page i Locator
import type { Page, Locator } from '@playwright/test';

export class BasePage {
  // Sve POM klase imaju pristup ovom page objektu
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(pathOrUrl: string, baseUrl?: string) {
    const url = baseUrl && pathOrUrl.startsWith('/') ? `${baseUrl}${pathOrUrl}` : pathOrUrl;

    await this.page.goto(url);
  }

  protected locator(id: string): Locator {
    const selector = [
      `[data-testid="${id}"]`,
      `[data-test-id="${id}"]`,
      `[name="${id}"]`,
      `#${id}`,
    ].join(', ');

    return this.page.locator(selector);
  }

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  protected byRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1],
  ): Locator {
    return this.page.getByRole(role, options);
  }

  async click(id: string) {
    await this.locator(id).click();
  }

  async fill(id: string, value: string) {
    await this.locator(id).fill(value);
  }

  async type(id: string, value: string) {
    await this.locator(id).type(value);
  }

  async press(id: string, key: string) {
    await this.locator(id).press(key);
  }
}
