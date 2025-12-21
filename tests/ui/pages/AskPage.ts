import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class AskPage extends BasePage {
  readonly title: Locator;

  constructor(page: Page) {
    super(page);

    this.title = this.locator('ask-title');
  }
}
