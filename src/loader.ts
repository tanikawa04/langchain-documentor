import { JSDOM } from 'jsdom';
import { Document } from 'langchain/document';
import { BaseDocumentLoader, DocumentLoader } from 'langchain/document_loaders/base';
import { Readability } from '@mozilla/readability';
import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

function patch(html: string): string {
  return html
    .replace(/<h([1-6])([^>]*)>/gi, (_match, level, attrs) => {
      const hashes = '#'.repeat(parseInt(level));
      return `\n<h${level}${attrs}>${hashes} `;
    });
}

export class SeleniumWebBaseLoader extends BaseDocumentLoader implements DocumentLoader {
  constructor(public url: string) {
    super();
  }

  async getHtml() {
    const driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(new Options().addArguments('--headless=new'))
      .build();
    await driver.get(this.url);
    await driver.manage().setTimeouts({ implicit: 1000 });
    const source = await driver.getPageSource();
    await driver.quit();
    return patch(source);
  }

  async scrape() {
    const html = await this.getHtml();
    const article = new Readability(new JSDOM(html).window.document).parse();
    if (!article) {
      throw new Error('Failed to parse article');
    }
    return article.textContent;
  }

  async load(): Promise<Document[]> {
    const pageContent = await this.scrape();
    return [new Document({ pageContent, metadata: { source: this.url } })];
  }
}
