import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ValidationResult } from '@/analysis/analysis.types';

/** Thin wrapper around cache-manager, plus typed helpers for validator result caching. */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /** `ttl` is in milliseconds - cache-manager v5's own convention. */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async getValidatorResult(
    domain: string,
    validatorId: string,
  ): Promise<ValidationResult | null> {
    const cached = await this.get<ValidationResult>(
      this.validatorResultKey(domain, validatorId),
    );
    if (!cached) return null;

    return {
      ...cached,
      cachedUntil: cached.cachedUntil
        ? new Date(cached.cachedUntil)
        : undefined,
    };
  }

  async setValidatorResult(
    domain: string,
    validatorId: string,
    result: ValidationResult,
    ttlSeconds: number,
  ): Promise<void> {
    await this.set(
      this.validatorResultKey(domain, validatorId),
      result,
      ttlSeconds * 1000,
    );
  }

  private validatorResultKey(domain: string, validatorId: string): string {
    return `vr:${domain}:${validatorId}`;
  }
}
