import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ReviewStatus } from '../../../generated/prisma';

export class QueryReviewDto {
  @IsOptional()
  @IsString()
  landId?: string;

  @IsOptional()
  @IsString()
  houseId?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  rating?: string; // String because it comes from query params

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isVerified?: string; // String because it comes from query params ('true'/'false')

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
