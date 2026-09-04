import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { GithubProvider } from '@/providers/github/github.provider';
import { GithubValidatorBase } from './github-validator.base';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;

@Injectable()
export class IssueActivityValidator extends GithubValidatorBase {
  readonly validatorId = 'issue_activity';
  readonly name = 'Issue Activity';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 5;
  readonly maxScore = 10;
  readonly ttlSeconds = 21_600;

  // See github-presence.validator.ts for why this forwarding constructor
  // is required for NestJS DI to resolve githubProvider.
  constructor(githubProvider: GithubProvider) {
    super(githubProvider);
  }

  protected async executeWithRepo(
    entity: CompanyEntity,
    owner: string,
    repo: string,
  ): Promise<ValidationResult> {
    const [open, closed] = await Promise.all([
      this.githubProvider.getIssues(owner, repo, 'open'),
      this.githubProvider.getIssues(owner, repo, 'closed'),
    ]);

    if (closed === null) {
      return this.unavailable(entity, 'Issue data unavailable.');
    }

    const cutoff = Date.now() - WINDOW_DAYS * MS_PER_DAY;
    const recentlyClosed = closed.filter(
      (issue) => issue.closedAt && issue.closedAt.getTime() >= cutoff,
    ).length;
    const openCount = open?.length ?? 0;

    let score: number;
    if (recentlyClosed === 0) {
      score = 2;
    } else if (recentlyClosed <= 5) {
      score = 5;
    } else if (recentlyClosed <= 20) {
      score = 8;
    } else {
      score = 10;
    }

    return {
      validatorId: this.validatorId,
      name: this.name,
      category: this.category,
      tier: this.tier,
      status: ValidatorStatus.SUCCESS,
      score,
      maxScore: this.maxScore,
      weight: this.weight,
      confidence: open === null ? 75 : 90,
      evidence: [
        {
          statement: `${openCount} open issues; ${recentlyClosed} closed in the last ${WINDOW_DAYS} days.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
