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

const CANDIDATE_PATHS = ['/contact', '/contact-us', '/support'];
const LINK_PATTERNS = ['/contact', '/contact-us', '/support', 'contact'];

@Injectable()
export class ContactPageValidator extends BaseValidator {
  readonly validatorId = 'contact_page';
  readonly name = 'Contact Page';
  readonly category = ValidatorCategory.TRUST;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 4;
  readonly maxScore = 10;
  readonly ttlSeconds = 86_400;

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
        source: { name: 'Website', url: result.url ?? entity.canonicalUrl },
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
