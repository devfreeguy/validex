import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ValidateService } from './validate.service';
import { QuickValidateDto } from './dto/quick-validate.dto';
import { FullValidateDto } from './dto/full-validate.dto';

@Controller('validate')
export class ValidateController {
  constructor(private readonly validateService: ValidateService) {}

  @Post('quick')
  async quickValidate(@Body() dto: QuickValidateDto) {
    const data = await this.validateService.quickValidate(dto);
    return { success: true, data };
  }

  @Post('full')
  async fullValidate(@Body() dto: FullValidateDto) {
    const data = await this.validateService.fullValidate(dto);
    return { success: true, data };
  }

  @Get(':analysisId')
  async getAnalysis(@Param('analysisId') analysisId: string) {
    return this.validateService.getAnalysis(analysisId);
  }
}
