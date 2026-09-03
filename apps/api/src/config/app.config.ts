import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  algorithmVersion: string;
}

export default registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  algorithmVersion: process.env.ALGORITHM_VERSION ?? '1.0.0',
}));
