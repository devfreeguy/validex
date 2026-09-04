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

@Injectable()
export class ContributorValidator extends GithubValidatorBase {
  readonly validatorId = 'contributors';
  readonly name = 'Contributors';
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
    void entity;
    const contributors = await this.githubProvider.getContributors(owner, repo);
    const count = contributors?.length ?? 0;

    let score: number;
    if (count === 0) {
      score = 0;
    } else if (count === 1) {
      score = 3;
    } else if (count <= 4) {
      score = 6;
    } else if (count <= 10) {
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
      confidence: count === 0 ? 65 : 90,
      evidence: [
        {
          statement:
            count === 1
              ? '1 contributor (bus factor risk).'
              : `${count} contributors.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
