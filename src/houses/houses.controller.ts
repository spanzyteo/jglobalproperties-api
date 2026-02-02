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
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { QueryHouseDto } from './dto/query-house.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('houses')
@UsePipes(new ValidationPipe({ transform: true }))
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 50))
  create(
    @Body() createHouseDto: CreateHouseDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.housesService.create(createHouseDto, files);
  }

  @Get()
  findAll(@Query() query: QueryHouseDto) {
    return this.housesService.findAll(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.housesService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.housesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() updateHouseDto: UpdateHouseDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.housesService.update(id, updateHouseDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.housesService.remove(id);
  }
}
