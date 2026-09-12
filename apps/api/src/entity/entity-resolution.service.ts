import { Injectable, Logger, Optional } from '@nestjs/common';
import { CompanyEntity } from '@/analysis/analysis.types';
import { FetchService } from '@/providers/crawler/fetch.service';
import { CheerioService } from '@/providers/crawler/cheerio.service';
import { GithubProvider } from '@/providers/github/github.provider';

const FETCH_TIMEOUT_MS = 10_000;

const RESERVED_GITHUB_NAMES = new Set([
  'issues',
  'pulls',
  'actions',
  'releases',
  'wiki',
  'blob',
  'tree',
  'discussions',
  'projects',
  'settings',
  'sponsors',
  'site',
  'features',
  'pricing',
  'about',
  'topics',
  'marketplace',
  'login',
  'signup',
  'orgs',
  'search',
  'notifications',
  'trending',
  'collections',
  'stars',
  'watching',
  'followers',
  'following',
  'security',
  'explore',
  'apps',
  'codespaces',
  'copilot',
  'solutions',
  'organizations',
]);

/** Resolves raw target input (URL/domain/github-repo) to a canonical CompanyEntity. */
@Injectable()
export class EntityResolutionService {
  private readonly logger = new Logger(EntityResolutionService.name);

  constructor(
    private readonly fetchService: FetchService,
    private readonly cheerioService: CheerioService,
    @Optional() private readonly githubProvider?: GithubProvider,
  ) {}

  async resolve(target: string): Promise<CompanyEntity> {
    const rawTarget = target.trim();

    // Check if input is "owner/repo" format (e.g. "expressjs/express" or "stripe/stripe-node")
    const ownerRepoMatch = /^([a-z0-9_.-]+)\/([a-z0-9_.-]+)$/i.exec(rawTarget);
    if (
      ownerRepoMatch &&
      !RESERVED_GITHUB_NAMES.has(ownerRepoMatch[1].toLowerCase()) &&
      !RESERVED_GITHUB_NAMES.has(ownerRepoMatch[2].toLowerCase())
    ) {
      const org = ownerRepoMatch[1];
      const repo = ownerRepoMatch[2];
      return {
        domain: `${org}/${repo}`,
        canonicalUrl: `https://github.com/${org}/${repo}`,
        hostname: 'github.com',
        rawTarget,
        companyName: repo,
        githubOrg: org,
        githubRepo: repo,
      };
    }

    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawTarget)
      ? rawTarget
      : `https://${rawTarget}`;

    let urlObj: URL | null = null;
    let hostname: string;
    try {
      urlObj = new URL(withScheme);
      hostname = urlObj.hostname;
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

    // If target itself is github.com (e.g. "https://github.com/expressjs/express" or "github.com/stripe")
    if (domain === 'github.com' && urlObj) {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (
        parts.length >= 2 &&
        !RESERVED_GITHUB_NAMES.has(parts[0].toLowerCase()) &&
        !RESERVED_GITHUB_NAMES.has(parts[1].toLowerCase())
      ) {
        entity.githubOrg = parts[0];
        entity.githubRepo = parts[1];
        entity.companyName = parts[1];
        return entity;
      } else if (
        parts.length === 1 &&
        !RESERVED_GITHUB_NAMES.has(parts[0].toLowerCase())
      ) {
        entity.githubOrg = parts[0];
        entity.companyName = parts[0];
        if (this.githubProvider) {
          const topRepo = await this.githubProvider.getOrgTopRepository(parts[0]);
          if (topRepo) {
            entity.githubRepo = topRepo.name;
          }
        }
        return entity;
      }
    }

    // Crawl homepage for website metadata & github repo links
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
      let foundOrg: string | undefined;

      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, canonicalUrl);
          const linkDomain = absoluteUrl.hostname.toLowerCase().replace(/^www\./, '');
          if (linkDomain === 'github.com') {
            const parts = absoluteUrl.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
              const org = parts[0];
              const repo = parts[1];
              if (
                !RESERVED_GITHUB_NAMES.has(org.toLowerCase()) &&
                !RESERVED_GITHUB_NAMES.has(repo.toLowerCase())
              ) {
                repos.add(`${org}/${repo}`);
              }
            } else if (parts.length === 1) {
              const org = parts[0];
              if (!RESERVED_GITHUB_NAMES.has(org.toLowerCase())) {
                foundOrg = org;
              }
            }
          }
        } catch {
          // ignore invalid URLs
        }
      });

      if (repos.size > 0) {
        // Pick the first candidate (or primary repo)
        const candidateList = Array.from(repos);
        const [firstRepo] = candidateList;
        const [org, repo] = firstRepo.split('/');
        entity.githubOrg = org;
        entity.githubRepo = repo;
      } else if (foundOrg) {
        entity.githubOrg = foundOrg;
        if (this.githubProvider) {
          const topRepo = await this.githubProvider.getOrgTopRepository(foundOrg);
          if (topRepo) {
            entity.githubRepo = topRepo.name;
          }
        }
      }
    } catch (err) {
      this.logger.debug(
        `Failed to parse homepage for ${domain}: ${String(err)}`,
      );
    }

    return entity;
  }
}
