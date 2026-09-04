import { Module } from '@nestjs/common';
import { GithubModule } from '@/providers/github/github.module';
import { GitHubPresenceValidator } from './github-presence.validator';
import { RepositoryAgeValidator } from './repository-age.validator';
import { GitHubActivityValidator } from './github-activity.validator';
import { ContributorValidator } from './contributors.validator';
import { ReleaseFrequencyValidator } from './release-frequency.validator';
import { IssueActivityValidator } from './issue-activity.validator';
import { PullRequestActivityValidator } from './pr-activity.validator';
import { RepositoryPopularityValidator } from './repository-popularity.validator';

const VALIDATORS = [
  GitHubPresenceValidator,
  RepositoryAgeValidator,
  GitHubActivityValidator,
  ContributorValidator,
  ReleaseFrequencyValidator,
  IssueActivityValidator,
  PullRequestActivityValidator,
  RepositoryPopularityValidator,
];

@Module({
  imports: [GithubModule],
  providers: [...VALIDATORS],
  exports: [...VALIDATORS],
})
export class EngineeringValidatorsModule {}
