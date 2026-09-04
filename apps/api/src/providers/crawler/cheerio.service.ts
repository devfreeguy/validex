import { Injectable } from '@nestjs/common';
import { load, type CheerioAPI } from 'cheerio';

/** Stateless, synchronous HTML parsing helper - no network access. */
@Injectable()
export class CheerioService {
  parse(html: string): CheerioAPI {
    return load(html);
  }

  /**
   * Absolute URLs from <a> tags whose href or text content matches any of
   * `patterns` (case-insensitive substring match). `baseUrl` resolves
   * relative hrefs (e.g. "/privacy") to absolute - not in the original spec
   * signature, but required for it to actually work: real-world homepages
   * link to their own pages with relative paths, and without a base there
   * would be nothing to resolve them against.
   */
  findPageLinks(html: string, patterns: string[], baseUrl: string): string[] {
    const $ = this.parse(html);
    const lowerPatterns = patterns.map((p) => p.toLowerCase());
    const matches = new Set<string>();

    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const text = $(el).text().trim().toLowerCase();
      const lowerHref = href.toLowerCase();

      const isMatch = lowerPatterns.some(
        (pattern) => lowerHref.includes(pattern) || text.includes(pattern),
      );
      if (!isMatch) return;

      try {
        matches.add(new URL(href, baseUrl).toString());
      } catch {
        // Unresolvable href (e.g. "javascript:void(0)") - skip it.
      }
    });

    return Array.from(matches);
  }

  extractText(html: string, selector: string): string | null {
    const $ = this.parse(html);
    const text = $(selector).first().text().trim();
    return text.length > 0 ? text : null;
  }
}
