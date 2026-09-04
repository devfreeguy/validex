import { Module } from '@nestjs/common';
import { ScoreEngine } from './score.engine';
import { ConfidenceEngine } from './confidence.engine';
import { EvidenceAggregator } from './evidence.aggregator';

@Module({
  providers: [ScoreEngine, ConfidenceEngine, EvidenceAggregator],
  exports: [ScoreEngine, ConfidenceEngine, EvidenceAggregator],
})
export class EngineModule {}
