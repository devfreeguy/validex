import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ValidateService } from './validate.service';
import { TargetValidateDto } from './dto/target-validate.dto';
import { CompareValidateDto } from './dto/compare-validate.dto';
import { TierKey } from '@/x402/x402.constants';

@Controller('validate')
export class ValidateController {
  constructor(private readonly validateService: ValidateService) {}

  // Each of the 7 single-target routes below is a thin one-liner delegating
  // to this handler - they differ only by tier key (which determines the
  // validator set, whether AI runs, and the response shape), never by
  // logic, so there's exactly one place that actually does anything.
  private async handleTarget(
    tierKey: Exclude<TierKey, 'compare'>,
    dto: TargetValidateDto,
  ) {
    const data = await this.validateService.validateTarget(tierKey, dto);
    return { success: true, data };
  }

  @Post('security')
  security(@Body() dto: TargetValidateDto) {
    return this.handleTarget('security', dto);
  }

  @Post('trust')
  trust(@Body() dto: TargetValidateDto) {
    return this.handleTarget('trust', dto);
  }

  @Post('web')
  web(@Body() dto: TargetValidateDto) {
    return this.handleTarget('web', dto);
  }

  @Post('engineering')
  engineering(@Body() dto: TargetValidateDto) {
    return this.handleTarget('engineering', dto);
  }

  @Post('ai')
  ai(@Body() dto: TargetValidateDto) {
    return this.handleTarget('ai', dto);
  }

  @Post('quick')
  quick(@Body() dto: TargetValidateDto) {
    return this.handleTarget('quick', dto);
  }

  @Post('full')
  full(@Body() dto: TargetValidateDto) {
    return this.handleTarget('full', dto);
  }

  @Post('compare')
  async compare(@Body() dto: CompareValidateDto) {
    const data = await this.validateService.compare(dto);
    return { success: true, data };
  }

  // Two path segments ('compare' then a param), so this is inherently
  // non-colliding with the single-segment ':analysisId' route below
  // regardless of declaration order - Fastify's router matches by depth
  // and literal-vs-param independently. Still declared above it for
  // readability: the more specific route reads first.
  @Get('compare/:comparisonId')
  async getComparison(@Param('comparisonId') comparisonId: string) {
    return this.validateService.getComparison(comparisonId);
  }

  @Get(':analysisId')
  async getAnalysis(@Param('analysisId') analysisId: string) {
    return this.validateService.getAnalysis(analysisId);
  }
}
