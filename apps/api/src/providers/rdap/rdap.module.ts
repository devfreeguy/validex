import { Module } from '@nestjs/common';
import { RdapProvider } from './rdap.provider';

@Module({
  providers: [RdapProvider],
  exports: [RdapProvider],
})
export class RdapModule {}
