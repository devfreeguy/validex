import { Injectable, Logger } from '@nestjs/common';
import { CompanyEntity } from '@/analysis/analysis.types';
import { FetchService } from '@/providers/crawler/fetch.service';
import { CheerioService } from '@/providers/crawler/cheerio.service';

const FETCH_TIMEOUT_MS = 10_000;
const GITHUB_REPO_PATTERN =
  /^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)\/([^/?#]+)/i;

/** Resolves raw target input (URL/domain) to a canonical CompanyEntity. */
@Injectable()
export class EntityResolutionService {
  private readonly logger = new Logger(EntityResolutionService.name);

  constructor(
    private readonly fetchService: FetchService,
    private readonly cheerioService: CheerioService,
  ) {}

  async resolve(target: string): Promise<CompanyEntity> {
    const rawTarget = target.trim();
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawTarget)
      ? rawTarget
      : `https://${rawTarget}`;

    let hostname: string;
    try {
      hostname = new URL(withScheme).hostname;
    } catch {
      // Not a parseable URL even with a scheme prepended - fall back to
      // treating the raw input as the hostname itself.
      hostname = rawTarget;
    }

    const domain = hostname.toLowerCase().replace(/^www\./, '');
    const canonicalUrl = `https://${domain}`;

    const entity: CompanyEntity = {
      domain,
      canonicalUrl,
      hostname,
      rawTarget,
    };

    const page = await this.fetchService
      .get(canonicalUrl, FETCH_TIMEOUT_MS)
      .catch(() => null);

    if (!page || !page.body) {
      return entity;
    }

    try {
      const $ = this.cheerioService.parse(page.body);

      const companyName =
        $('meta[property="og:site_name"]').attr('content')?.trim() ||
        $('title').first().text().trim() ||
        undefined;

      if (companyName) {
        entity.companyName = companyName;
      }

      const repos = new Set<string>();
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const match = GITHUB_REPO_PATTERN.exec(href);
        if (match) {
          repos.add(`${match[1]}/${match[2]}`);
        }
      });

      if (repos.size === 1) {
        const [orgRepo] = Array.from(repos);
        const [org, repo] = orgRepo.split('/');
        entity.githubOrg = org;
        entity.githubRepo = repo;
      }
    } catch (err) {
      this.logger.debug(
        `Failed to parse homepage for ${domain}: ${String(err)}`,
      );
    }

    return entity;
  }
}
