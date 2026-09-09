import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Shared by all 7 single-target endpoints (security, trust, web,
 * engineering, ai, quick, full) - they differ only by tier key, not by
 * request shape, so one DTO covers all of them.
 */
export class TargetValidateDto {
  /**
   * Raw target input - a full URL or a bare domain (e.g. "example.com" or
   * "https://example.com"). Normalized further downstream during entity
   * resolution.
   */
  @IsString()
  @IsNotEmpty()
  target!: string;

  @IsOptional()
  @IsBoolean()
  refresh?: boolean = false;
}
