import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { QueueModule } from '@/queue/queue.module';
import { CacheModule } from '@/cache/cache.module';
import { AnalysisModule } from '@/analysis/analysis.module';
import { AiModule } from '@/ai/ai.module';
import { ValidateModule } from '@/api/validate/validate.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:standard',
                  },
                },
          },
        };
      },
    }),
    DatabaseModule,
    QueueModule,
    CacheModule,
    AnalysisModule,
    AiModule,
    ValidateModule,
  ],
})
export class AppModule {}
