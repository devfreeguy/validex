import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidatorCategory } from '@/analysis/analysis.types';

export class FullValidateDto {
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

  @IsOptional()
  @IsArray()
  @IsEnum(ValidatorCategory, { each: true })
  sections?: ValidatorCategory[];
}
