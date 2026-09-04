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

@Injectable()
export class RepositoryAgeValidator extends GithubValidatorBase {
  readonly validatorId = 'repository_age';
  readonly name = 'Repository Age';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 6;
  readonly maxScore = 10;
  readonly ttlSeconds = 86_400;

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

    const ageDays = Math.floor(
      (Date.now() - repository.createdAt.getTime()) / MS_PER_DAY,
    );

    let score: number;
    if (ageDays < 30) {
      score = 2;
    } else if (ageDays <= 180) {
      score = 5;
    } else if (ageDays <= 365) {
      score = 7;
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
      confidence: 95,
      evidence: [
        {
          statement: `Repository is ${ageDays} days old (created ${repository.createdAt.toISOString()}).`,
          source: this.validatorId,
        },
      ],
      source: this.githubSource(owner, repo),
    };
  }
}
