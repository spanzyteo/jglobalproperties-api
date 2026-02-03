import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for updating existing image metadata (caption, order, isPrimary)
 */
export class UpdateImageDataDto {
  @IsString()
  id: string; // Existing image ID

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true' || value === true;
  })
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return parseInt(String(value), 10);
  })
  order?: number;
}

/**
 * DTO for new images being uploaded
 */
export class NewImageDetailDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === 'true' || value === true;
  })
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return parseInt(String(value), 10);
  })
  order?: number;
}

/**
 * DTO for managing images during house update
 * Supports: keep old images, add new images, delete selected, reorder, update captions, set primary
 */
export class ManageHouseImagesDto {
  /**
   * Images to keep: existing images with optional updates to caption/order/isPrimary
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateImageDataDto)
  keep?: UpdateImageDataDto[];

  /**
   * Image IDs to delete
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  delete?: string[];

  /**
   * Metadata for new images being uploaded (files sent separately)
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewImageDetailDto)
  newImageDetails?: NewImageDetailDto[];
}
