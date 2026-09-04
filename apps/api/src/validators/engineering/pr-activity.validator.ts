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
export class PullRequestActivityValidator extends GithubValidatorBase {
  readonly validatorId = 'pr_activity';
  readonly name = 'Pull Request Activity';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 6;
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
      this.githubProvider.getPullRequests(owner, repo, 'open'),
      this.githubProvider.getPullRequests(owner, repo, 'closed'),
    ]);

    if (closed === null) {
      return this.unavailable(entity, 'Pull request data unavailable.');
    }

    const cutoff = Date.now() - WINDOW_DAYS * MS_PER_DAY;
    const mergedCount = closed.filter(
      (pr) => pr.mergedAt && pr.mergedAt.getTime() >= cutoff,
    ).length;
    const openCount = open?.length ?? 0;

    let score: number;
    if (mergedCount === 0) {
      score = 2;
    } else if (mergedCount <= 5) {
      score = 5;
    } else if (mergedCount <= 20) {
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
          statement: `${mergedCount} PRs merged in the last ${WINDOW_DAYS} days; ${openCount} currently open.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
