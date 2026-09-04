import { CategoryScore } from '@/engine/score.engine';
import {
  AnalysisTier,
  ValidationResult,
  ValidatorCategory,
} from './analysis.types';

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
