import { type Locator, type Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class AskPage extends BasePage {
  readonly title: Locator;
  readonly askInput: Locator;
  readonly askSubmit: Locator;
  readonly askAnswer: Locator;
  readonly askError: Locator;

  constructor(page: Page) {
    super(page);

    this.title = this.locator('ask-title');
    this.askInput = this.locator('ask-input');
    this.askSubmit = this.locator('ask-submit');
    this.askAnswer = this.locator('ask-answer');
    this.askError = this.locator('ask-error');
  }

  // --- ACTIONS ---
  async open(baseUrl: string) {
    await this.goto(baseUrl);
  }

  async enterQuestion(question: string) {
    await this.askInput.fill(question);
  }

  async submit() {
    await this.askSubmit.click();
  }

  async askAnswerText() {
    return this.askAnswer.textContent();
  }

  async askErrorText() {
    return this.askError.textContent();
  }

  async submitButtonText() {
    return this.askSubmit.textContent();
  }
}
