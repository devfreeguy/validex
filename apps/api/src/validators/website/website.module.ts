import { Module } from '@nestjs/common';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { WebsiteReachabilityValidator } from './website-reachability.validator';
import { SitemapValidator } from './sitemap.validator';
import { PrivacyPolicyValidator } from './privacy-policy.validator';
import { TermsValidator } from './terms.validator';
import { AboutPageValidator } from './about-page.validator';
import { ContactPageValidator } from './contact-page.validator';
import { PricingPageValidator } from './pricing-page.validator';
import { DocumentationValidator } from './documentation.validator';
import { BlogValidator } from './blog.validator';
import { CareersValidator } from './careers.validator';
import { ChangelogValidator } from './changelog.validator';

const VALIDATORS = [
  WebsiteReachabilityValidator,
  SitemapValidator,
  PrivacyPolicyValidator,
  TermsValidator,
  AboutPageValidator,
  ContactPageValidator,
  PricingPageValidator,
  DocumentationValidator,
  BlogValidator,
  CareersValidator,
  ChangelogValidator,
];

@Module({
  imports: [CrawlerModule],
  providers: [...VALIDATORS],
  exports: [...VALIDATORS],
})
export class WebsiteValidatorsModule {}
