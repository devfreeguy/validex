import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  url: string;
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  url: process.env.DATABASE_URL ?? '',
}));

export const redisConfig = registerAs('redis', (): RedisConfig => ({
  url: process.env.REDIS_URL ?? '',
}));

export default databaseConfig;
