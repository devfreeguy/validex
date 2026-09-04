import { Module } from '@nestjs/common';
import { OsvProvider } from './osv.provider';

@Module({
  providers: [OsvProvider],
  exports: [OsvProvider],
})
export class OsvModule {}
