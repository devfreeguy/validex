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
export class RepositoryPopularityValidator extends GithubValidatorBase {
  readonly validatorId = 'repository_popularity';
  readonly name = 'Repository Popularity';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 3;
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
    const repository = await this.githubProvider.getRepository(owner, repo);
    if (!repository) {
      return this.unavailable(entity, 'GitHub repository not found.');
    }

    const stars = repository.stargazersCount;
    let score: number;
    if (stars === 0) {
      score = 1;
    } else if (stars <= 50) {
      score = 3;
    } else if (stars <= 500) {
      score = 6;
    } else if (stars <= 5000) {
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
      confidence: 60,
      evidence: [
        {
          statement: `${stars} stars, ${repository.forksCount} forks. Stars and forks are contextual signals and do not directly indicate business success.`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
