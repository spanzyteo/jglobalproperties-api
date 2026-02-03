/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { PartialType } from '@nestjs/mapped-types';
import { CreateLandDto } from './create-land.dto';
import { ManageLandImagesDto } from './manage-land-images.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';

export class UpdateLandDto extends PartialType(CreateLandDto) {
  /**
   * Granular image management: keep/update old, add new, delete selected, reorder, update captions, set primary
   * Replaces the old imageDetails field for updates
   */
  @IsOptional()
  @ValidateNested()
  @Transform(({ value }) => {
    // If it's already a ManageLandImagesDto instance, return as-is
    if (value instanceof ManageLandImagesDto) {
      return value;
    }

    // If it's a string (from FormData), parse it
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);

        // Use plainToInstance to properly deserialize nested types
        const instance = plainToInstance(ManageLandImagesDto, parsed, {
          enableImplicitConversion: true,
        });
        return instance;
      } catch (e) {
        return value;
      }
    }

    // If already an object but not an instance, deserialize it properly
    if (typeof value === 'object' && value !== null) {
      const instance = plainToInstance(ManageLandImagesDto, value, {
        enableImplicitConversion: true,
      });
      return instance;
    }

    return value;
  })
  manageImages?: ManageLandImagesDto;
}
