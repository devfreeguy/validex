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

export enum ValidatorCategory {
  WEBSITE = 'website',
  ENGINEERING = 'engineering',
  SECURITY = 'security',
  TRUST = 'trust',
  GROWTH = 'growth',
}

export enum ValidatorResultStatus {
  SUCCESS = 'success',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

export interface AnalysisSummary {
  analysisId: string;
  status: AnalysisStatus;
  tier?: AnalysisTier;
}
