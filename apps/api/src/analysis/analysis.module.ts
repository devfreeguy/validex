import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { AnalysisService } from './analysis.service';
import { AnalysisRepository } from './analysis.repository';
import { ComparisonRepository } from './comparison.repository';

@Module({
  imports: [DatabaseModule],
  providers: [AnalysisService, AnalysisRepository, ComparisonRepository],
  exports: [AnalysisService, AnalysisRepository, ComparisonRepository],
})
export class AnalysisModule {}
