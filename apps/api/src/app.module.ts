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
import { EntityModule } from '@/entity/entity.module';
import { ValidatorsModule } from '@/validators/validators.module';
import { DnsModule } from '@/providers/dns/dns.module';
import { TlsModule } from '@/providers/tls/tls.module';
import { RdapModule } from '@/providers/rdap/rdap.module';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { GithubModule } from '@/providers/github/github.module';
import { OsvModule } from '@/providers/osv/osv.module';
import { EngineModule } from '@/engine/engine.module';
import { X402Module } from '@/x402/x402.module';
import { HealthModule } from '@/health/health.module';
import { WellKnownModule } from '@/well-known/well-known.module';

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
    DnsModule,
    TlsModule,
    RdapModule,
    CrawlerModule,
    GithubModule,
    OsvModule,
    EngineModule,
    X402Module,
    HealthModule,
    WellKnownModule,
    EntityModule,
    ValidatorsModule,
    ValidateModule,
  ],
})
export class AppModule {}
