import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class QuickValidateDto {
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
