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
export class GitHubPresenceValidator extends GithubValidatorBase {
  readonly validatorId = 'github_presence';
  readonly name = 'GitHub Presence';
  readonly category = ValidatorCategory.ENGINEERING;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 10;
  readonly maxScore = 10;
  readonly ttlSeconds = 21_600;

  // NestJS DI resolves constructor params via metadata emitted for this
  // class's OWN declared constructor - without one here (even though it
  // just forwards to the base class), design:paramtypes isn't emitted and
  // githubProvider would be injected as undefined.
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
      return this.build(
        0,
        80,
        'No public GitHub repository found.',
        owner,
        repo,
      );
    }

    if (repository.isArchived) {
      return this.build(
        3,
        90,
        'Repository exists but is archived.',
        owner,
        repo,
      );
    }

    return this.build(
      10,
      95,
      `Active repository ${repository.fullName} - ${repository.stargazersCount} stars, language: ${repository.language ?? 'unknown'}.`,
      owner,
      repo,
    );
  }

  private build(
    score: number,
    confidence: number,
    statement: string,
    owner: string,
    repo: string,
  ): ValidationResult {
    return {
      validatorId: this.validatorId,
      name: this.name,
      category: this.category,
      tier: this.tier,
      status: ValidatorStatus.SUCCESS,
      score,
      maxScore: this.maxScore,
      weight: this.weight,
      confidence,
      evidence: [{ statement, source: this.validatorId }],
      source: this.githubSource(owner, repo),
    };
  }
}
