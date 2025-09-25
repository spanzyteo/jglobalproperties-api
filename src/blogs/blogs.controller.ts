import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { QueryBlogDto } from './dto/query-blog.dto';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { QueryBlogCommentDto } from './dto/create-blog-comment.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('blogs')
@UsePipes(new ValidationPipe({ transform: true }))
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.blogsService.create(createBlogDto, files);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryBlogDto) {
    return this.blogsService.findAll(query);
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  async findAllAdmin(@Query() query: QueryBlogDto) {
    return this.blogsService.findAllAdmin(query);
  }

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  async getFeatured(@Query('limit') limit?: string) {
    return this.blogsService.getFeaturedBlogs(limit ? parseInt(limit) : 5);
  }

  @Get('recent')
  @HttpCode(HttpStatus.OK)
  async getRecent(@Query('limit') limit?: string) {
    return this.blogsService.getRecentBlogs(limit ? parseInt(limit) : 5);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.blogsService.update(id, updateBlogDto, files);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }

  // ============ BLOG COMMENT ENDPOINTS ============
  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id') blogId: string,
    @Body() createCommentDto: CreateBlogCommentDto,
  ) {
    return this.blogsService.createComment({ ...createCommentDto, blogId });
  }

  @Get(':id/comments')
  @HttpCode(HttpStatus.OK)
  async getBlogComments(
    @Param('id') blogId: string,
    @Query() query?: QueryBlogCommentDto,
  ) {
    return this.blogsService.getBlogComments(blogId, query);
  }

  @Get(':id/admin')
  @HttpCode(HttpStatus.OK)
  async findOneAdmin(@Param('id') id: string) {
    return this.blogsService.findOneAdmin(id);
  }
}
