export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
}

/**
 * Parses REDIS_URL into its connection parts. Upstash Redis only accepts
 * TLS connections (rediss://), so callers must branch on `tls` and pass
 * explicit TLS options to their client instead of the raw URL string.
 */
export function parseRedisUrl(redisUrl: string): RedisConnectionOptions {
  const parsed = new URL(redisUrl);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    tls: parsed.protocol === 'rediss:',
  };
}

/**
 * Both consumers of REDIS_KEY_PREFIX (cache-manager-redis-yet's `keyPrefix`
 * and BullMQ's `prefix`) append their own `:` separator before the rest of
 * the key, so a value already ending in one (e.g. "validex:", as documented
 * in deploy/.env.example) would otherwise double up into "validex::...".
 */
export function normalizeRedisKeyPrefix(prefix: string): string {
  return prefix.replace(/:+$/, '');
}
