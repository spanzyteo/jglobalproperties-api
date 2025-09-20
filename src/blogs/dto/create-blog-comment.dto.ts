import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BlogCommentStatus } from 'generated/prisma';

export class CreateBlogCommentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsString()
  @IsNotEmpty()
  blogId: string;
}

export class QueryBlogCommentDto {
  @IsOptional()
  @IsEnum(BlogCommentStatus)
  status?: BlogCommentStatus;

  @IsOptional()
  @IsString()
  page?: string = '1';

  @IsOptional()
  @IsString()
  limit?: string = '20';
}
