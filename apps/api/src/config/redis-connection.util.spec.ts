import { parseRedisUrl } from './redis-connection.util';

describe('parseRedisUrl', () => {
  it('parses a plain redis:// URL without TLS', () => {
    const result = parseRedisUrl('redis://localhost:6379');

    expect(result).toEqual({
      host: 'localhost',
      port: 6379,
      username: undefined,
      password: undefined,
      tls: false,
    });
  });

  it('enables TLS and extracts credentials for an Upstash rediss:// URL', () => {
    const result = parseRedisUrl(
      'rediss://default:secret-token@usw1-example.upstash.io:6379',
    );

    expect(result).toEqual({
      host: 'usw1-example.upstash.io',
      port: 6379,
      username: 'default',
      password: 'secret-token',
      tls: true,
    });
  });

  it('defaults to port 6379 when none is given', () => {
    const result = parseRedisUrl('redis://localhost');

    expect(result.port).toBe(6379);
  });
});
