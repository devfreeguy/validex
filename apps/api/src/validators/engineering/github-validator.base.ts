import { CompanyEntity, ValidationResult } from '@/analysis/analysis.types';
import { GithubProvider } from '@/providers/github/github.provider';
import { BaseValidator } from '../base.validator';

/**
 * Shared "no GitHub repo -> unavailable" short-circuit for every GitHub
 * validator, so each subclass only implements the check it actually cares
 * about.
 */
export abstract class GithubValidatorBase extends BaseValidator {
  constructor(protected readonly githubProvider: GithubProvider) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    if (!entity.githubOrg || !entity.githubRepo) {
      return this.unavailable(
        entity,
        'No GitHub repository associated with this company.',
      );
    }

    try {
      return await this.executeWithRepo(
        entity,
        entity.githubOrg,
        entity.githubRepo,
      );
    } catch (err) {
      return this.error(entity, err);
    }
  }

  protected abstract executeWithRepo(
    entity: CompanyEntity,
    owner: string,
    repo: string,
  ): Promise<ValidationResult>;

  protected githubSource(
    owner: string,
    repo: string,
  ): { name: string; url: string } {
    return { name: 'GitHub API', url: `https://github.com/${owner}/${repo}` };
  }
}
