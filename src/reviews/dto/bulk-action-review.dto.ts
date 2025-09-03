import { IsArray, IsString } from 'class-validator';

export class BulkActionReviewDto {
  @IsArray()
  @IsString({ each: true })
  reviewIds: string[];
}
