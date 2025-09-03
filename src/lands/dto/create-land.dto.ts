import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LandStatus } from '../../../generated/prisma';

export class createLandImageDto {
  @IsString()
  @IsOptional()
  caption?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateLandUnitDto {
  @IsNumber()
  size: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  price: string;
}

export class CreateLandDto {
  @IsString()
  title: string;

  @IsString()
  overview: string;

  @IsString()
  location: string;

  @IsString()
  state: string;

  @IsString()
  @IsOptional()
  country?: string;

  @ValidateNested({ each: true })
  @Type(() => createLandImageDto)
  @IsOptional()
  imageDetails?: createLandImageDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateLandUnitDto)
  @IsOptional()
  units?: CreateLandUnitDto[];

  @IsEnum(LandStatus)
  @IsOptional()
  status?: LandStatus;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}
