import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisRepository } from './analysis.repository';

@Module({
  providers: [AnalysisService, AnalysisRepository],
  exports: [AnalysisService, AnalysisRepository],
})
export class AnalysisModule {}
