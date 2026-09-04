export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  createdAt: Date;
  pushedAt: Date;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  language: string | null;
  license: string | null;
  defaultBranch: string;
  isArchived: boolean;
  isFork: boolean;
  size: number;
}

export interface GithubContributor {
  login: string;
  contributions: number;
}

export interface GithubWeeklyCommit {
  week: number;
  total: number;
  days: number[];
}

export interface GithubRelease {
  id: number;
  tagName: string;
  publishedAt: Date;
  prerelease: boolean;
  draft: boolean;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface GithubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
}
