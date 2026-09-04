import { Module } from '@nestjs/common';
import { DnsModule } from '@/providers/dns/dns.module';
import { RdapModule } from '@/providers/rdap/rdap.module';
import { CrawlerModule } from '@/providers/crawler/crawler.module';
import { HTTPSValidator } from './https.validator';
import { MXValidator } from './mx.validator';
import { DomainAgeValidator } from './domain-age.validator';

const VALIDATORS = [HTTPSValidator, MXValidator, DomainAgeValidator];

@Module({
  imports: [DnsModule, RdapModule, CrawlerModule],
  providers: [...VALIDATORS],
  exports: [...VALIDATORS],
})
export class TrustValidatorsModule {}
