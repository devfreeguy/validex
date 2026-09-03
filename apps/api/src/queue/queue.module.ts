import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { VALIDATION_QUEUE } from './queue.constants';
import { parseRedisUrl } from '@/config/redis-connection.util';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { host, port, username, password, tls } = parseRedisUrl(
          configService.get<string>('REDIS_URL', { infer: true }) as string,
        );

        return {
          connection: {
            host,
            port,
            username,
            password,
            ...(tls ? { tls: {} } : {}),
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: VALIDATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
