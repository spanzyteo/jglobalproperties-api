import { PartialType } from '@nestjs/mapped-types';
import { CreateLandDto } from './create-land.dto';
import { ManageLandImagesDto } from './manage-land-images.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLandDto extends PartialType(CreateLandDto) {
  /**
   * Granular image management: keep/update old, add new, delete selected, reorder, update captions, set primary
   * Replaces the old imageDetails field for updates
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ManageLandImagesDto)
  manageImages?: ManageLandImagesDto;
}
