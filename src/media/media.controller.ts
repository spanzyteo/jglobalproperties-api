import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  // UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto, MediaResponseDto } from './dto/create-media.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    return this.mediaService.upload(file, dto);
  }

  @Get()
  async listMedia(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.mediaService.list({ page, limit });
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }
}
