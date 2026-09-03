import { Injectable } from '@nestjs/common';
import { AnalysisRepository } from './analysis.repository';

/**
 * Stub - orchestrates analysis lifecycle. No logic yet.
 */
@Injectable()
export class AnalysisService {
  constructor(private readonly analysisRepository: AnalysisRepository) {}
}
