import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class KbPage extends BasePage {
  readonly kbTitle: Locator;
  readonly kbSubTitle: Locator;
  readonly kbHomeLink: Locator;
  readonly kbAddInput: Locator;
  readonly kbAddButton: Locator;
  readonly kbIdInput: Locator;
  readonly kbUpdateInput: Locator;
  readonly kbUpdateButton: Locator;
  readonly kbForbidden: Locator;
  readonly kbAddId: Locator;
  readonly kbAddError: Locator;
  readonly kbUpdateId: Locator;
  readonly kbUpdateError: Locator;

  constructor(page: Page) {
    super(page);

    this.kbTitle = this.locator('kb-title');
    this.kbSubTitle = this.locator('kb-subtitle');
    this.kbHomeLink = this.locator('kb-home-link');
    this.kbAddInput = this.locator('kb-add-prompt');
    this.kbAddButton = this.locator('kb-add-submit');
    this.kbIdInput = this.locator('kb-update-id');
    this.kbUpdateInput = this.locator('kb-update-prompt');
    this.kbUpdateButton = this.locator('kb-update-submit');
    this.kbForbidden = this.locator('kb-forbidden');
    this.kbAddId = this.locator('kb-add-id');
    this.kbAddError = this.locator('kb-add-error');
    this.kbUpdateId = this.locator('kb-update-id-value');
    this.kbUpdateError = this.locator('kb-update-error');
  }

  // ---ACTIONS---

  async open(baseUrl: string) {
    await this.goto(baseUrl);
  }

  async addNewEntry(text: string) {
    await this.kbAddInput.fill(text);
    await this.kbAddButton.click();
  }

  async updateEntry(id: string, text: string) {
    await this.kbIdInput.fill(id);
    await this.kbUpdateInput.fill(text);
    await this.kbUpdateButton.click();
  }

  async goBackToHomePage() {
    await this.kbHomeLink.click();
  }
}
