import {
  Body,
  Controller,
  Get,
  NotFoundException,
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

  // The x402 Bazaar discovery crawler catalogs a resource by sending a
  // bare GET to its URL and checking for a 402 - it never issues the real
  // POST. These exist purely so Fastify has a route to match: the
  // preHandler hook in main.ts (keyed by DISCOVERY_ROUTES) always runs
  // first and either 402s the crawler or, on a real settled payment,
  // verifies/settles it same as the POST route would - but there's no
  // `target`/`targets` on a bare discovery GET, so there's nothing to run
  // even then. These static paths are matched by Fastify's router ahead of
  // the ':analysisId' param route below regardless of registration order
  // (see the comment on that route), so none of this can shadow or be
  // shadowed by it. One per protected POST route - see PROTECTED_ROUTES.
  @Get('security')
  discoverSecurity(): never {
    throw new NotFoundException();
  }

  @Get('trust')
  discoverTrust(): never {
    throw new NotFoundException();
  }

  @Get('web')
  discoverWeb(): never {
    throw new NotFoundException();
  }

  @Get('engineering')
  discoverEngineering(): never {
    throw new NotFoundException();
  }

  @Get('ai')
  discoverAi(): never {
    throw new NotFoundException();
  }

  @Get('compare')
  discoverCompare(): never {
    throw new NotFoundException();
  }

  @Get('quick')
  discoverQuick(): never {
    throw new NotFoundException();
  }

  @Get('full')
  discoverFull(): never {
    throw new NotFoundException();
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
