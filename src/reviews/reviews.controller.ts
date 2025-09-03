import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { BulkActionReviewDto } from './dto/bulk-action-review.dto';
import { ReviewStatus } from '../../generated/prisma';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  findAll(@Query() query: QueryReviewDto) {
    return this.reviewsService.findAll(query);
  }

  /**
   * Get pending reviews (Admin only - add auth guard as needed)
   */
  @Get('pending')
  async getPendingReviews(@Query() query: { page?: string; limit?: string }) {
    return this.reviewsService.getPendingReviews(query);
  }

  /**
   * Get reviews by land ID
   */
  @Get('land/:landId')
  async findByLand(
    @Param('landId') landId: string,
    @Query() query: { status?: ReviewStatus; limit?: string },
  ) {
    const parsedQuery = {
      ...query,
      limit: query.limit ? parseInt(query.limit) : undefined,
    };
    return this.reviewsService.findByLand(landId, parsedQuery);
  }

  /**
   * Get reviews by house ID
   */
  @Get('house/:houseId')
  async findByHouse(
    @Param('houseId') houseId: string,
    @Query() query: { status?: ReviewStatus; limit?: string },
  ) {
    const parsedQuery = {
      ...query,
      limit: query.limit ? parseInt(query.limit) : undefined,
    };
    return this.reviewsService.findByHouse(houseId, parsedQuery);
  }

  /**
   * Get review statistics for a land
   */
  @Get('stats/:landId')
  async getLandReviewStats(@Param('landId') landId: string) {
    const stats = await this.reviewsService.getLandReviewStats(landId);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get review statistics for a land
   */
  @Get('stats/:houseId')
  async getHouseReviewStats(@Param('houseId') houseId: string) {
    const stats = await this.reviewsService.getHouseReviewStats(houseId);
    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  /**
   * Update review status only (Admin only)
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ReviewStatus },
  ) {
    return this.reviewsService.updateStatus(id, body.status);
  }

  /**
   * Approve a review (Admin only)
   */
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string) {
    return this.reviewsService.updateStatus(id, ReviewStatus.APPROVED);
  }

  /**
   * Reject a review (Admin only)
   */
  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string) {
    return this.reviewsService.updateStatus(id, ReviewStatus.REJECTED);
  }

  /**
   * Bulk approve reviews (Admin only)
   */
  @Post('bulk/approve')
  @HttpCode(HttpStatus.OK)
  async bulkApprove(@Body() bulkActionDto: BulkActionReviewDto) {
    return this.reviewsService.bulkApprove(bulkActionDto.reviewIds);
  }

  /**
   * Bulk reject reviews (Admin only)
   */
  @Post('bulk/reject')
  @HttpCode(HttpStatus.OK)
  async bulkReject(@Body() bulkActionDto: BulkActionReviewDto) {
    return this.reviewsService.bulkReject(bulkActionDto.reviewIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
