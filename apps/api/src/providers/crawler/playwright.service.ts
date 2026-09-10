import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { chromium, type Browser } from 'playwright';

export interface PageContent {
  html: string;
  title: string;
  metaDescription: string | null;
  links: Array<{ href: string; text: string }>;
  statusCode: number;
}

const PAGE_TIMEOUT_MS = 15_000;

/**
 * Full tier only. Reuses one browser instance across requests instead of
 * launching per call - launching Chromium is expensive and this service is
 * a singleton for the process lifetime.
 */
@Injectable()
export class PlaywrightService implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightService.name);
  private browserPromise: Promise<Browser> | null = null;

  async launch(): Promise<Browser> {
    if (!this.browserPromise) {
      const executablePath =
        process.env.CHROMIUM_EXECUTABLE_PATH ??
        (process.platform === 'linux' && existsSync('/usr/bin/chromium')
          ? '/usr/bin/chromium'
          : undefined);

      this.browserPromise = chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
    }
    return this.browserPromise;
  }

  async fetchPage(url: string): Promise<PageContent | null> {
    try {
      const browser = await this.launch();
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        const response = await page.goto(url, {
          timeout: PAGE_TIMEOUT_MS,
          waitUntil: 'domcontentloaded',
        });
        if (!response) return null;

        const html = await page.content();
        const title = await page.title();
        const metaDescription = await page
          .getAttribute('meta[name="description"]', 'content')
          .catch(() => null);
        const links = await page.$$eval('a', (anchors) =>
          anchors.map((a) => ({
            href: a.getAttribute('href') ?? '',
            text: (a.textContent ?? '').trim(),
          })),
        );

        return {
          html,
          title,
          metaDescription,
          links,
          statusCode: response.status(),
        };
      } finally {
        await context.close();
      }
    } catch (err) {
      this.logger.debug(`fetchPage failed for ${url}: ${String(err)}`);
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise;
    await browser.close();
  }
}
