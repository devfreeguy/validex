import { Injectable } from '@nestjs/common';
import {
  CompanyEntity,
  ValidationResult,
  ValidatorCategory,
  ValidatorStatus,
  ValidatorTier,
} from '@/analysis/analysis.types';
import { FetchService } from '@/providers/crawler/fetch.service';
import { BaseValidator } from '../base.validator';

function isOk(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

@Injectable()
export class SitemapValidator extends BaseValidator {
  readonly validatorId = 'sitemap';
  readonly name = 'Sitemap';
  readonly category = ValidatorCategory.WEBSITE;
  readonly tier = ValidatorTier.QUICK;
  readonly weight = 2;
  readonly maxScore = 10;
  readonly ttlSeconds = 86400;

  constructor(private readonly fetchService: FetchService) {
    super();
  }

  async execute(entity: CompanyEntity): Promise<ValidationResult> {
    try {
      const [sitemap, sitemapIndex, robots] = await Promise.all([
        this.fetchService.get(`${entity.canonicalUrl}/sitemap.xml`),
        this.fetchService.get(`${entity.canonicalUrl}/sitemap_index.xml`),
        this.fetchService.get(`${entity.canonicalUrl}/robots.txt`),
      ]);

      const hasSitemap = !!sitemap && isOk(sitemap.statusCode);
      const hasSitemapIndex = !!sitemapIndex && isOk(sitemapIndex.statusCode);
      const robotsDeclaresSitemap =
        !!robots &&
        isOk(robots.statusCode) &&
        !!robots.body?.match(/^sitemap:/im);

      const found = hasSitemap || hasSitemapIndex || robotsDeclaresSitemap;

      const foundVia = [
        hasSitemap && '/sitemap.xml',
        hasSitemapIndex && '/sitemap_index.xml',
        robotsDeclaresSitemap && 'robots.txt Sitemap: directive',
      ].filter((v): v is string => typeof v === 'string');

      return {
        validatorId: this.validatorId,
        name: this.name,
        category: this.category,
        tier: this.tier,
        status: ValidatorStatus.SUCCESS,
        score: found ? 10 : 0,
        maxScore: this.maxScore,
        weight: this.weight,
        confidence: 90,
        evidence: [
          {
            statement: found
              ? `Sitemap found via ${foundVia.join(', ')}.`
              : 'No sitemap.xml, sitemap_index.xml, or robots.txt Sitemap directive found.',
            source: this.validatorId,
          },
        ],
      };
    } catch (err) {
      return this.error(entity, err);
    }
  }
}
