import { Module } from '@nestjs/common';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { DnsModule } from '@/providers/dns/dns.module';
import { TlsModule } from '@/providers/tls/tls.module';
import { RdapModule } from '@/providers/rdap/rdap.module';
import { BaseValidator } from './base.validator';
import {
  VALIDATORS_TOKEN,
  ValidatorRegistry,
} from './registry/validator.registry';
import { WebsiteValidatorsModule } from './website/website.module';
import { WebsiteReachabilityValidator } from './website/website-reachability.validator';
import { SitemapValidator } from './website/sitemap.validator';
import { PrivacyPolicyValidator } from './website/privacy-policy.validator';
import { TermsValidator } from './website/terms.validator';
import { AboutPageValidator } from './website/about-page.validator';
import { ContactPageValidator } from './website/contact-page.validator';
import { PricingPageValidator } from './website/pricing-page.validator';
import { DocumentationValidator } from './website/documentation.validator';
import { BlogValidator } from './website/blog.validator';
import { CareersValidator } from './website/careers.validator';
import { ChangelogValidator } from './website/changelog.validator';
import { SecurityValidatorsModule } from './security/security.module';
import { TLSCertificateValidator } from './security/tls-certificate.validator';
import { SecurityHeadersValidator } from './security/security-headers.validator';
import { SPFValidator } from './security/spf.validator';
import { DMARCValidator } from './security/dmarc.validator';
import { TrustValidatorsModule } from './trust/trust.module';
import { HTTPSValidator } from './trust/https.validator';
import { MXValidator } from './trust/mx.validator';
import { DomainAgeValidator } from './trust/domain-age.validator';

const VALIDATOR_CLASSES = [
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
  TLSCertificateValidator,
  SecurityHeadersValidator,
  SPFValidator,
  DMARCValidator,
  HTTPSValidator,
  MXValidator,
  DomainAgeValidator,
] as const;

/**
 * This module grows as new validators are added - each new category gets
 * its own sub-module (imported below) and its validator class added to
 * VALIDATOR_CLASSES so the registry factory can pick it up.
 */
@Module({
  imports: [
    CrawlerModule,
    DnsModule,
    TlsModule,
    RdapModule,
    WebsiteValidatorsModule,
    SecurityValidatorsModule,
    TrustValidatorsModule,
  ],
  providers: [
    ValidatorRegistry,
    {
      provide: VALIDATORS_TOKEN,
      useFactory: (...validators: BaseValidator[]) => validators,
      inject: [...VALIDATOR_CLASSES],
    },
  ],
  exports: [ValidatorRegistry],
})
export class ValidatorsModule {}
