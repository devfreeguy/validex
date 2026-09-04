import { Module } from '@nestjs/common';
import { EntityModule } from '@/entity/entity.module';
import { ValidatorsModule } from '@/validators/validators.module';
import { ValidateController } from './validate.controller';
import { ValidateService } from './validate.service';

@Module({
  imports: [EntityModule, ValidatorsModule],
  controllers: [ValidateController],
  providers: [ValidateService],
})
export class ValidateModule {}
