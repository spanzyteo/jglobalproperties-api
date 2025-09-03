import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  IsNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HouseCategory } from '../../../generated/prisma';

export class ImageDetailDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateHouseUnitDto {
  @IsNumber()
  size: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  price: string;
}

export class CreateHouseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string; // Optional - will be auto-generated

  @IsString()
  @IsNotEmpty()
  overview: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  country?: string; // Defaults to "Nigeria"

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsEnum(HouseCategory)
  @IsOptional()
  category?: HouseCategory;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDetailDto)
  imageDetails?: ImageDetailDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateHouseUnitDto)
  @IsOptional()
  units?: CreateHouseUnitDto[];
}
