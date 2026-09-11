import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';
import {
  normalizeRedisKeyPrefix,
  parseRedisUrl,
} from '@/config/redis-connection.util';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { host, port, username, password, tls } = parseRedisUrl(
          configService.get<string>('REDIS_URL', { infer: true }) as string,
        );
        const keyPrefix = normalizeRedisKeyPrefix(
          configService.get<string>('REDIS_KEY_PREFIX', {
            infer: true,
          }) as string,
        );

        return {
          store: await redisStore({
            username,
            password,
            keyPrefix,
            socket: {
              host,
              port,
              ...(tls ? { tls: true as const } : {}),
            },
          }),
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
