import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => parseFloat(String(value)))
  size: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  price: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  available: boolean;
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
