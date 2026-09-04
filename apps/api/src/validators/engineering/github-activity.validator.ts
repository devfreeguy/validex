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

const RECENT_WEEKS = 12;

@Injectable()
export class GitHubActivityValidator extends GithubValidatorBase {
  readonly validatorId = 'github_activity';
  readonly name = 'GitHub Activity';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 9;
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
    const weeks = await this.githubProvider.getCommitActivity(owner, repo);
    if (!weeks) {
      return this.unavailable(entity, 'Commit activity data unavailable.');
    }

    const recentCommits = weeks
      .slice(-RECENT_WEEKS)
      .reduce((sum, week) => sum + week.total, 0);

    let score: number;
    if (recentCommits === 0) {
      score = 0;
    } else if (recentCommits <= 10) {
      score = 3;
    } else if (recentCommits <= 50) {
      score = 6;
    } else if (recentCommits <= 150) {
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
      confidence: 92,
      evidence: [
        {
          statement: `Repository had ${recentCommits} commits in the last 12 weeks.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
