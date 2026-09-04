export enum AnalysisTier {
  QUICK = 'quick',
  FULL = 'full',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

/**
 * Extended with PRODUCT beyond the original website/engineering/security/
 * trust/growth set - the full-tier product-surface validators (about,
 * pricing, documentation) need it and there's no closer existing fit.
 */
export enum ValidatorCategory {
  WEBSITE = 'website',
  ENGINEERING = 'engineering',
  SECURITY = 'security',
  TRUST = 'trust',
  GROWTH = 'growth',
  PRODUCT = 'product',
}

export enum ValidatorTier {
  QUICK = 'quick',
  FULL = 'full',
}

export enum ValidatorStatus {
  SUCCESS = 'success',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

export interface AnalysisSummary {
  analysisId: string;
  status: AnalysisStatus;
  tier?: AnalysisTier;
}

export interface Evidence {
  statement: string;
  source: string;
  url?: string;
}

export interface ValidationResult {
  validatorId: string;
  name: string;
  category: ValidatorCategory;
  tier: ValidatorTier;
  status: ValidatorStatus;
  score: number | null;
  maxScore: number;
  weight: number;
  confidence: number;
  evidence: Evidence[];
  source?: { name: string; url?: string };
  metadata?: Record<string, unknown>;
  cachedUntil?: Date;
}

export interface CompanyEntity {
  /** Normalized (no www, lowercase) */
  domain: string;
  /** https://domain.com */
  canonicalUrl: string;
  /** Raw hostname from the parsed URL */
  hostname: string;
  /** Original input as given by the caller */
  rawTarget: string;
  companyName?: string;
  githubOrg?: string;
  githubRepo?: string;
}
