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
import {
  findExternalLink,
  findTargetPage,
  scoreFromPageFinderResult,
} from './page-finder.util';

const CANDIDATE_PATHS = ['/careers', '/jobs', '/work-with-us', '/join-us'];
const LINK_PATTERNS = [
  '/careers',
  '/jobs',
  '/work-with-us',
  '/join-us',
  'careers',
  'jobs',
];
const ATS_HOST_PATTERNS = ['greenhouse.io', 'lever.co', 'workable.com'];

@Injectable()
export class CareersValidator extends BaseValidator {
  readonly validatorId = 'careers';
  readonly name = 'Careers';
  readonly category = ValidatorCategory.GROWTH;
  readonly tier = ValidatorTier.FULL;
  readonly weight = 3;
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

      if (result.status !== 'not_found') {
        const { score, confidence, statement } =
          scoreFromPageFinderResult(result);
        return this.buildResult(score, confidence, statement, result.url);
      }

      const atsLink = await findExternalLink(
        this.playwright,
        entity,
        ATS_HOST_PATTERNS,
      );
      if (atsLink) {
        return this.buildResult(
          10,
          95,
          `Careers hosted externally via applicant tracking system: ${atsLink}.`,
          atsLink,
        );
      }

      return this.buildResult(
        0,
        90,
        'No careers page or ATS link found.',
        null,
      );
    } catch (err) {
      return this.error(entity, err);
    }
  }

  private buildResult(
    score: number,
    confidence: number,
    statement: string,
    url: string | null,
  ): ValidationResult {
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
        { statement, source: this.validatorId, url: url ?? undefined },
      ],
    };
  }
}
