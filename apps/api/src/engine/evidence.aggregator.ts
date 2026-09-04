import { Injectable } from '@nestjs/common';
import {
  Evidence,
  ValidationResult,
  ValidatorStatus,
} from '@/analysis/analysis.types';

const STRENGTH_THRESHOLD_PCT = 80;
const WEAKNESS_THRESHOLD_PCT = 30;

export interface AggregatedEvidence {
  strengths: string[];
  weaknesses: string[];
  allEvidence: Evidence[];
  sources: Array<{ name: string; url?: string }>;
}

/**
 * Strengths/weaknesses are the existing evidence statements from qualifying
 * validators, verbatim - never synthesized text.
 */
@Injectable()
export class EvidenceAggregator {
  aggregate(results: ValidationResult[]): AggregatedEvidence {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const allEvidence: Evidence[] = [];
    const sources = new Map<string, { name: string; url?: string }>();

    for (const result of results) {
      allEvidence.push(...result.evidence);

      if (result.source && !sources.has(result.source.name)) {
        sources.set(result.source.name, result.source);
      }

      const statements = result.evidence.map((evidence) => evidence.statement);

      if (result.status === ValidatorStatus.ERROR) {
        weaknesses.push(...statements);
        continue;
      }

      if (result.status !== ValidatorStatus.SUCCESS || result.score === null) {
        continue;
      }

      const percentage = (result.score / result.maxScore) * 100;
      if (percentage >= STRENGTH_THRESHOLD_PCT) {
        strengths.push(...statements);
      } else if (percentage <= WEAKNESS_THRESHOLD_PCT) {
        weaknesses.push(...statements);
      }
    }

    return {
      strengths,
      weaknesses,
      allEvidence,
      sources: Array.from(sources.values()),
    };
  }
}
