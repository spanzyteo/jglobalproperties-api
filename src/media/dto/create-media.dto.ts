import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}

// media-response.dto.ts
export class MediaResponseDto {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}
