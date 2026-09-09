import { CategoryScore } from '@/engine/score.engine';
import {
  AnalysisTier,
  ValidationResult,
  ValidatorCategory,
} from './analysis.types';

export type Recommendation = 'integrate' | 'caution' | 'avoid';

/**
 * `recommendation` is always deterministic (derived from the overall score
 * by ValidateService.deriveRecommendation - never invented by the AI, which
 * only writes prose around it). `executiveSummary`/`riskFlags`/
 * `categoryNarrative` are null when Groq is unavailable/fails or the tier
 * doesn't run AI at all - the deterministic recommendation and full scores
 * are still always returned.
 */
export interface AnalysisVerdict {
  recommendation: Recommendation;
  executiveSummary: string | null;
  riskFlags: string[] | null;
  categoryNarrative: Partial<Record<ValidatorCategory, string>> | null;
}

export interface AnalysisReport {
  meta: {
    analysisId: string;
    algorithmVersion: string;
    generatedAt: string;
    cached: boolean;
    tier: AnalysisTier;
  };
  company: {
    domain: string;
    canonicalUrl: string;
    companyName: string | null;
    githubRepo: string | null;
  };
  /** Present only for AI-enabled tiers (ai/quick/full) - see AI_ENABLED_TIERS. */
  verdict?: AnalysisVerdict;
  summary: {
    score: number | null;
    grade: string;
    confidence: number;
    executiveSummary?: string;
  };
  categories: Record<ValidatorCategory, CategoryScore>;
  strengths: string[];
  weaknesses: string[];
  validators: ValidationResult[];
  sources: Array<{ name: string; url?: string }>;
}

export interface ComparisonRankingEntry {
  rank: number;
  domain: string;
  score: number | null;
  grade: string;
  confidence: number;
  analysisId: string;
}

export interface ComparisonFailedEntry {
  target: string;
  error: string;
}

export interface ComparisonReport {
  meta: {
    comparisonId: string;
    generatedAt: string;
    targetCount: number;
  };
  ranking: ComparisonRankingEntry[];
  results: AnalysisReport[];
  failed: ComparisonFailedEntry[];
}
