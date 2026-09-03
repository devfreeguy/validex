import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { VALIDATION_QUEUE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: VALIDATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
