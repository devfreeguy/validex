import { CompanyEntity } from '@/analysis/analysis.types';
import { PlaywrightService } from '@/providers/crawler/playwright.service';
import { CheerioService } from '@/providers/crawler/cheerio.service';

export type PageFinderStatus =
  'found_loaded' | 'found_unreachable' | 'not_found';

export interface PageFinderResult {
  status: PageFinderStatus;
  url: string | null;
}

function isOk(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Shared "locate a target page" routine for the full-tier website
 * validators (privacy, terms, about, ...): try known URL patterns, then a
 * subdomain, then fall back to scanning the homepage for a matching link.
 *
 * Each validator fetches independently rather than sharing one crawl result
 * - accepted duplication for this phase per the spec, to be optimized with
 * a shared crawl result later.
 */
export async function findTargetPage(
  playwright: PlaywrightService,
  cheerio: CheerioService,
  entity: CompanyEntity,
  candidatePaths: string[],
  linkPatterns: string[],
  subdomains: string[] = [],
): Promise<PageFinderResult> {
  for (const path of candidatePaths) {
    const url = `${entity.canonicalUrl}${path}`;
    const page = await playwright.fetchPage(url);
    if (page && isOk(page.statusCode)) {
      return { status: 'found_loaded', url };
    }
  }

  for (const subdomain of subdomains) {
    const url = `https://${subdomain}.${entity.domain}`;
    const page = await playwright.fetchPage(url);
    if (page && isOk(page.statusCode)) {
      return { status: 'found_loaded', url };
    }
  }

  const homepage = await playwright.fetchPage(entity.canonicalUrl);
  if (!homepage) {
    return { status: 'not_found', url: null };
  }

  const links = cheerio.findPageLinks(
    homepage.html,
    linkPatterns,
    entity.canonicalUrl,
  );
  if (links.length === 0) {
    return { status: 'not_found', url: null };
  }

  const candidateUrl = links[0];
  const page = await playwright.fetchPage(candidateUrl);
  if (page && isOk(page.statusCode)) {
    return { status: 'found_loaded', url: candidateUrl };
  }
  return { status: 'found_unreachable', url: candidateUrl };
}

export interface PageFinderScore {
  score: number;
  confidence: number;
  statement: string;
}

/** Maps the common found-loaded=10 / found-unreachable=5 / not-found=0 pattern. */
export function scoreFromPageFinderResult(
  result: PageFinderResult,
  notFoundConfidence = 90,
): PageFinderScore {
  switch (result.status) {
    case 'found_loaded':
      return {
        score: 10,
        confidence: 95,
        statement: `Found at ${result.url}.`,
      };
    case 'found_unreachable':
      return {
        score: 5,
        confidence: 80,
        statement: `Link found (${result.url}) but the page did not load.`,
      };
    case 'not_found':
    default:
      return {
        score: 0,
        confidence: notFoundConfidence,
        statement: 'No matching page found.',
      };
  }
}

/** Scans the homepage for links to external hostnames (e.g. an ATS provider). */
export async function findExternalLink(
  playwright: PlaywrightService,
  entity: CompanyEntity,
  hostPatterns: string[],
): Promise<string | null> {
  const homepage = await playwright.fetchPage(entity.canonicalUrl);
  if (!homepage) return null;

  for (const link of homepage.links) {
    if (!link.href) continue;
    const lowerHref = link.href.toLowerCase();
    const match = hostPatterns.find((host) => lowerHref.includes(host));
    if (match) return link.href;
  }
  return null;
}
