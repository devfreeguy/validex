import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { PlaywrightService } from '@/providers/crawler/playwright.service';
import { CheerioService } from '@/providers/crawler/cheerio.service';
import { BaseValidator } from '../base.validator';
import { findTargetPage, scoreFromPageFinderResult } from './page-finder.util';

const CANDIDATE_PATHS = ['/terms', '/terms-of-service', '/legal/terms'];
const LINK_PATTERNS = ['/terms', '/terms-of-service', '/legal/terms', 'terms'];

@Injectable()
export class TermsValidator extends BaseValidator {
  readonly validatorId = 'terms';
  readonly name = 'Terms of Service';
  readonly category = ValidatorCategory.TRUST;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 5;
  readonly maxScore = 10;
  readonly ttlSeconds = 604_800;

  constructor(
    private readonly playwright: PlaywrightService,
    private readonly cheerio: CheerioService,
  ) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const result = await findTargetPage(
        this.playwright,
        this.cheerio,
        entity,
        CANDIDATE_PATHS,
        LINK_PATTERNS,
      );
      const { score, confidence, statement } =
        scoreFromPageFinderResult(result);

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence,
        evidence: [
          { statement, source: this.validatorId, url: result.url ?? undefined },
        ],
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
