import { registerAs } from '@nestjs/config';

export interface GithubConfig {
  token: string;
}

export default registerAs('github', (): GithubConfig => ({
  token: process.env.GITHUB_TOKEN ?? '',
}));
