/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PartialType } from '@nestjs/mapped-types';
import { CreateHouseDto } from './create-house.dto';
import { ManageHouseImagesDto } from './manage-house-images.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateHouseDto extends PartialType(CreateHouseDto) {
  /**
   * Granular image management: keep/update old, add new, delete selected, reorder, update captions, set primary
   * Replaces the old imageDetails field for updates
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ManageHouseImagesDto)
  @Transform(({ value }) => {
    // If manageImages arrives as a string (from FormData), parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  manageImages?: ManageHouseImagesDto;
}
