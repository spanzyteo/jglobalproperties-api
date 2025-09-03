import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { LandsService } from './lands.service';
import { CreateLandDto } from './dto/create-land.dto';
import { UpdateLandDto } from './dto/update-land.dto';
import { QueryLandDto } from './dto/query-land.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('lands')
@UsePipes(new ValidationPipe({ transform: true }))
export class LandsController {
  constructor(private readonly landsService: LandsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() createLandDto: CreateLandDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.landsService.create(createLandDto, files);
  }

  @Get()
  findAll(@Query() query: QueryLandDto) {
    return this.landsService.findAll(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.landsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.landsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() updateLandDto: UpdateLandDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.landsService.update(id, updateLandDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.landsService.remove(id);
  }
}
