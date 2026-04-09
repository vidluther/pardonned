import { chromium, type Browser, type Page } from "playwright";

let browser: Browser | null = null;

export async function launchBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function fetchPageHtml(url: string): Promise<string> {
  const b = await launchBrowser();
  const page: Page = await b.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    return await page.content();
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
