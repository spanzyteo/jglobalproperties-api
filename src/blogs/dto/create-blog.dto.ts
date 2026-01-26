import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlogStatus } from '@prisma/client';
import { ImageDetailDto } from 'src/houses/dto/create-house.dto';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsEnum(BlogStatus)
  @IsOptional()
  status?: BlogStatus;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDetailDto)
  imageDetails?: ImageDetailDto[];
}
