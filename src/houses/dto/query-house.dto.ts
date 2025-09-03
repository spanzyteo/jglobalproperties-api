import { IsOptional, IsString, IsEnum } from 'class-validator';
import { HouseCategory } from 'generated/prisma';

export class QueryHouseDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(HouseCategory)
  category?: HouseCategory;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
