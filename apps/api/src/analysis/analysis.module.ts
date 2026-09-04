import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { AnalysisService } from './analysis.service';
import { AnalysisRepository } from './analysis.repository';

@Module({
  imports: [DatabaseModule],
  providers: [AnalysisService, AnalysisRepository],
  exports: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
