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
const WINDOW_DAYS = 180;

@Injectable()
export class ReleaseFrequencyValidator extends GithubValidatorBase {
  readonly validatorId = 'release_frequency';
  readonly name = 'Release Frequency';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 7;
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
    const releases = await this.githubProvider.getReleases(owner, repo);
    if (!releases) {
      return this.unavailable(entity, 'Release data unavailable.');
    }

    const cutoff = Date.now() - WINDOW_DAYS * MS_PER_DAY;
    const recentCount = releases.filter(
      (release) =>
        !release.draft &&
        !release.prerelease &&
        release.publishedAt.getTime() >= cutoff,
    ).length;

    let score: number;
    if (recentCount === 0) {
      score = 1;
    } else if (recentCount <= 2) {
      score = 5;
    } else if (recentCount <= 6) {
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
      confidence: recentCount === 0 ? 70 : 90,
      evidence: [
        {
          statement: `${recentCount} releases in the last ${WINDOW_DAYS} days.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
