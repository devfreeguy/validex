import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosHeaders, type RawAxiosResponseHeaders } from 'axios';
import { CacheService } from '@/cache/cache.service';
import {
  GithubContributor,
  GithubIssue,
  GithubPR,
  GithubRelease,
  GithubRepo,
  GithubWeeklyCommit,
} from './github.types';

const GITHUB_API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_TTL_SECONDS = 6 * 60 * 60;
const RATE_LIMIT_WARN_THRESHOLD = 10;
const COMMIT_ACTIVITY_RETRY_DELAY_MS = 3_000;

type ResponseHeaders =
  RawAxiosResponseHeaders | InstanceType<typeof AxiosHeaders>;

interface RawGithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  created_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: { name: string } | null;
  default_branch: string;
  archived: boolean;
  fork: boolean;
  size: number;
}

interface RawGithubContributor {
  login?: string;
  contributions: number;
}

interface RawGithubRelease {
  id: number;
  tag_name: string;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
}

interface RawGithubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown;
}

interface RawGithubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

function mapRepo(raw: RawGithubRepo): GithubRepo {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description,
    createdAt: new Date(raw.created_at),
    pushedAt: new Date(raw.pushed_at),
    stargazersCount: raw.stargazers_count,
    forksCount: raw.forks_count,
    openIssuesCount: raw.open_issues_count,
    language: raw.language,
    license: raw.license?.name ?? null,
    defaultBranch: raw.default_branch,
    isArchived: raw.archived,
    isFork: raw.fork,
    size: raw.size,
  };
}

function reviveRepo(repo: GithubRepo): GithubRepo {
  return {
    ...repo,
    createdAt: new Date(repo.createdAt),
    pushedAt: new Date(repo.pushedAt),
  };
}

function mapRelease(raw: RawGithubRelease): GithubRelease {
  return {
    id: raw.id,
    tagName: raw.tag_name,
    publishedAt: new Date(raw.published_at ?? 0),
    prerelease: raw.prerelease,
    draft: raw.draft,
  };
}

function reviveReleases(releases: GithubRelease[]): GithubRelease[] {
  return releases.map((release) => ({
    ...release,
    publishedAt: new Date(release.publishedAt),
  }));
}

function mapIssue(raw: RawGithubIssue): GithubIssue {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    state: raw.state,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    closedAt: raw.closed_at ? new Date(raw.closed_at) : null,
  };
}

function reviveIssues(issues: GithubIssue[]): GithubIssue[] {
  return issues.map((issue) => ({
    ...issue,
    createdAt: new Date(issue.createdAt),
    updatedAt: new Date(issue.updatedAt),
    closedAt: issue.closedAt ? new Date(issue.closedAt) : null,
  }));
}

function mapPR(raw: RawGithubPR): GithubPR {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    state: raw.state,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
    mergedAt: raw.merged_at ? new Date(raw.merged_at) : null,
  };
}

function revivePRs(prs: GithubPR[]): GithubPR[] {
  return prs.map((pr) => ({
    ...pr,
    createdAt: new Date(pr.createdAt),
    updatedAt: new Date(pr.updatedAt),
    mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Never throws - every method resolves to null on unrecoverable failure so
 * a validator can always fall back to `unavailable()`.
 */
@Injectable()
export class GithubProvider {
  private readonly logger = new Logger(GithubProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  async getRepository(owner: string, repo: string): Promise<GithubRepo | null> {
    return this.withCache(
      this.cacheKey(owner, repo, 'repository'),
      async () => {
        const response = await this.rawRequest<RawGithubRepo>(
          `/repos/${owner}/${repo}`,
        );
        if (!response || response.status !== 200 || !response.data) return null;
        return mapRepo(response.data);
      },
      reviveRepo,
    );
  }

  async getContributors(
    owner: string,
    repo: string,
  ): Promise<GithubContributor[] | null> {
    return this.withCache(
      this.cacheKey(owner, repo, 'contributors'),
      async () => {
        const response = await this.rawRequest<RawGithubContributor[]>(
          `/repos/${owner}/${repo}/contributors`,
          { per_page: 100, anon: false },
        );
        if (!response || response.status !== 200 || !response.data) return null;
        return response.data
          .filter((contributor) => !!contributor.login)
          .map((contributor) => ({
            login: contributor.login as string,
            contributions: contributor.contributions,
          }));
      },
    );
  }

  async getCommitActivity(
    owner: string,
    repo: string,
  ): Promise<GithubWeeklyCommit[] | null> {
    return this.withCache(
      this.cacheKey(owner, repo, 'commit_activity'),
      async () => {
        const path = `/repos/${owner}/${repo}/stats/commit_activity`;
        let response = await this.rawRequest<GithubWeeklyCommit[]>(path);

        if (response?.status === 202) {
          await sleep(COMMIT_ACTIVITY_RETRY_DELAY_MS);
          response = await this.rawRequest<GithubWeeklyCommit[]>(path);
        }

        if (!response || response.status !== 200 || !response.data) return null;
        return response.data;
      },
    );
  }

  async getReleases(
    owner: string,
    repo: string,
  ): Promise<GithubRelease[] | null> {
    return this.withCache(
      this.cacheKey(owner, repo, 'releases'),
      async () => {
        const response = await this.rawRequest<RawGithubRelease[]>(
          `/repos/${owner}/${repo}/releases`,
          { per_page: 20 },
        );
        if (!response || response.status !== 200 || !response.data) return null;
        return response.data.map(mapRelease);
      },
      reviveReleases,
    );
  }

  async getIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed',
  ): Promise<GithubIssue[] | null> {
    return this.withCache(
      this.cacheKey(owner, repo, `issues:${state}`),
      async () => {
        const response = await this.rawRequest<RawGithubIssue[]>(
          `/repos/${owner}/${repo}/issues`,
          { state, per_page: 50, filter: 'all' },
        );
        if (!response || response.status !== 200 || !response.data) return null;
        // The issues endpoint also returns pull requests - exclude them so
        // issue-activity metrics aren't double counting PR activity.
        return response.data
          .filter((issue) => !issue.pull_request)
          .map(mapIssue);
      },
      reviveIssues,
    );
  }

  async getPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed',
  ): Promise<GithubPR[] | null> {
    return this.withCache(
      this.cacheKey(owner, repo, `pulls:${state}`),
      async () => {
        const response = await this.rawRequest<RawGithubPR[]>(
          `/repos/${owner}/${repo}/pulls`,
          { state, per_page: 50 },
        );
        if (!response || response.status !== 200 || !response.data) return null;
        return response.data.map(mapPR);
      },
      revivePRs,
    );
  }

  async getOrgTopRepository(org: string): Promise<GithubRepo | null> {
    return this.withCache(
      this.cacheKey(org, '_top', 'top_repository'),
      async () => {
        let response = await this.rawRequest<RawGithubRepo[]>(
          `/orgs/${org}/repos`,
          { sort: 'pushed', direction: 'desc', per_page: 10 },
        );
        if (!response || response.status !== 200 || !Array.isArray(response.data) || response.data.length === 0) {
          response = await this.rawRequest<RawGithubRepo[]>(
            `/users/${org}/repos`,
            { sort: 'pushed', direction: 'desc', per_page: 10 },
          );
        }
        if (!response || response.status !== 200 || !Array.isArray(response.data) || response.data.length === 0) {
          return null;
        }
        const nonForks = response.data.filter((r) => !r.fork);
        const candidates = nonForks.length > 0 ? nonForks : response.data;
        candidates.sort((a, b) => b.stargazers_count - a.stargazers_count);
        return mapRepo(candidates[0]);
      },
      reviveRepo,
    );
  }

  private cacheKey(owner: string, repo: string, endpoint: string): string {
    return `github:${owner}:${repo}:${endpoint}`;
  }

  private async withCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T | null>,
    reviver?: (value: T) => T,
  ): Promise<T | null> {
    const cached = await this.cacheService.get<T>(cacheKey);
    if (cached !== undefined && cached !== null) {
      return reviver ? reviver(cached) : cached;
    }

    const fresh = await fetcher();
    if (fresh !== null) {
      // CacheService.set's ttl is milliseconds (cache-manager v5 convention).
      await this.cacheService.set(cacheKey, fresh, CACHE_TTL_SECONDS * 1000);
    }
    return fresh;
  }

  private async rawRequest<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
    isRetry = false,
  ): Promise<{ status: number; data: T | null } | null> {
    try {
      const token = this.configService.get<string>('GITHUB_TOKEN');
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Validex-API/1.0',
      };
      if (token && token.trim().length > 0) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      const response = await axios.get<T>(`${GITHUB_API_BASE}${path}`, {
        params,
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
        headers,
      });

      this.warnIfRateLimitLow(response.headers);

      if ((response.status === 403 || response.status === 429) && !isRetry) {
        const delayMs = this.retryDelayMs(response.headers);
        if (delayMs !== null) {
          await sleep(delayMs);
          return this.rawRequest<T>(path, params, true);
        }
      }

      return { status: response.status, data: response.data ?? null };
    } catch (err) {
      this.logger.debug(
        `GitHub API request failed for ${path}: ${String(err)}`,
      );
      return null;
    }
  }

  private warnIfRateLimitLow(headers: ResponseHeaders): void {
    const remaining = Number(headers['x-ratelimit-remaining']);
    if (Number.isNaN(remaining) || remaining >= RATE_LIMIT_WARN_THRESHOLD)
      return;

    const reset = headers['x-ratelimit-reset'];
    this.logger.warn(
      `GitHub API rate limit low: ${remaining} requests remaining (resets at ${String(reset)}).`,
    );
  }

  private retryDelayMs(headers: ResponseHeaders): number | null {
    const retryAfter = headers['retry-after'];
    if (retryAfter !== undefined) {
      const seconds = Number(retryAfter);
      if (!Number.isNaN(seconds)) return seconds * 1000;
    }

    const reset = headers['x-ratelimit-reset'];
    if (reset !== undefined) {
      const resetSeconds = Number(reset);
      if (!Number.isNaN(resetSeconds)) {
        const waitMs = resetSeconds * 1000 - Date.now();
        return waitMs > 0 ? waitMs : 0;
      }
    }

    return null;
  }
}
