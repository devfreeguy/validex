import { Module } from '@nestjs/common';
import { EntityModule } from '@/entity/entity.module';
import { ValidatorsModule } from '@/validators/validators.module';
import { AnalysisModule } from '@/analysis/analysis.module';
import { EngineModule } from '@/engine/engine.module';
import { AiModule } from '@/ai/ai.module';
import { CacheModule } from '@/cache/cache.module';
import { ValidateController } from './validate.controller';
import { ValidateService } from './validate.service';

@Module({
  imports: [
    EntityModule,
    ValidatorsModule,
    AnalysisModule,
    EngineModule,
    AiModule,
    CacheModule,
  ],
  controllers: [ValidateController],
  providers: [ValidateService],
})
export class ValidateModule {}
