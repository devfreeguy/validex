import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import { AlgorandConfigService } from './algorand.config';
import { databaseConfig, redisConfig } from './database.config';
import githubConfig from './github.config';
import groqConfig from './groq.config';
import { envValidationSchema } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, githubConfig, groqConfig, databaseConfig, redisConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
  ],
  providers: [AlgorandConfigService],
  exports: [AlgorandConfigService],
})
export class ConfigModule {}
