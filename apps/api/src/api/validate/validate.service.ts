import { Injectable } from '@nestjs/common';
import { AnalysisStatus, AnalysisTier } from '@/analysis/analysis.types';
import { QuickValidateDto } from './dto/quick-validate.dto';
import { FullValidateDto } from './dto/full-validate.dto';

export interface ValidateStubResult {
  analysisId: string;
  status: AnalysisStatus;
  tier: AnalysisTier;
}

export interface AnalysisStatusStubResult {
  analysisId: string;
  status: AnalysisStatus;
}

/**
 * Stub - no business logic yet. Returns placeholder responses so the API
 * surface can be wired up and tested end to end.
 */
@Injectable()
export class ValidateService {
  async quickValidate(dto: QuickValidateDto): Promise<ValidateStubResult> {
    void dto;
    return {
      analysisId: 'val_stub',
      status: AnalysisStatus.PENDING,
      tier: AnalysisTier.QUICK,
    };
  }

  async fullValidate(dto: FullValidateDto): Promise<ValidateStubResult> {
    void dto;
    return {
      analysisId: 'val_stub',
      status: AnalysisStatus.PENDING,
      tier: AnalysisTier.FULL,
    };
  }

  async getAnalysis(analysisId: string): Promise<AnalysisStatusStubResult> {
    return {
      analysisId,
      status: AnalysisStatus.PENDING,
    };
  }
}
