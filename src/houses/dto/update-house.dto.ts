import { PartialType } from '@nestjs/mapped-types';
import { CreateHouseDto } from './create-house.dto';
import { ManageHouseImagesDto } from './manage-house-images.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHouseDto extends PartialType(CreateHouseDto) {
  /**
   * Granular image management: keep/update old, add new, delete selected, reorder, update captions, set primary
   * Replaces the old imageDetails field for updates
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ManageHouseImagesDto)
  manageImages?: ManageHouseImagesDto;
}
