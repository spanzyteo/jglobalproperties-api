/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryReviewDto } from './dto/query-review.dto';
import { ReviewStatus } from '../../generated/prisma';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    const { landId, houseId, rating, ...reviewData } = createReviewDto;

    if (!landId && !houseId) {
      throw new BadRequestException(
        'Either landId or houseId must be provided',
      );
    }

    // Validate that the land exists
    if (landId) {
      const land = await this.prisma.land.findUnique({
        where: { id: landId },
        select: { id: true, title: true },
      });

      if (!land) {
        throw new NotFoundException('Land not found');
      }
    }

    if (houseId) {
      const house = await this.prisma.house.findUnique({
        where: { id: houseId },
        select: { id: true, title: true },
      });

      if (!house) {
        throw new NotFoundException(`House with ID ${houseId} not found`);
      }
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          ...reviewData,
          rating,
          landId: landId || null,
          houseId: houseId || null,
          status: ReviewStatus.PENDING,
        },
        include: {
          land: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          house: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Review submitted successfully and is pending approval',
        data: review,
      };
    } catch (error: any) {
      throw error || 'Something went wrong';
    }
  }

  async findAll(query: QueryReviewDto) {
    const {
      landId,
      houseId,
      status,
      rating,
      search,
      isVerified,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    // Filter by land
    if (landId) where.landId = landId;

    // Filter by house
    if (houseId) where.houseId = houseId;

    // Filter by status
    if (status) where.status = status;

    // Filter by rating
    if (rating) where.rating = parseInt(rating);

    // Filter by verification status
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';

    // Search in name, email, or comment
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          land: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          house: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: take,
          hasNext: parseInt(page) < totalPages,
          hasPrevious: parseInt(page) > 1,
        },
      },
    };
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        land: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        house: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return {
      success: true,
      data: review,
    };
  }

  async findByLand(
    landId: string,
    query?: { status?: ReviewStatus; limit?: number },
  ) {
    // Validate that the land exists
    const land = await this.prisma.land.findUnique({
      where: { id: landId },
      select: { id: true },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    const where: any = { landId };
    if (query?.status) where.status = query.status;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit || 50,
      include: {
        land: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Calculate review statistics
    const stats = await this.getLandReviewStats(landId);

    return {
      success: true,
      data: {
        reviews,
        stats,
      },
    };
  }

  async findByHouse(
    houseId: string,
    query?: { status?: ReviewStatus; limit?: number },
  ) {
    // Validate that the land exists
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      select: { id: true },
    });

    if (!house) {
      throw new NotFoundException('House not found');
    }

    const where: any = { houseId };
    if (query?.status) where.status = query.status;

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query?.limit || 50,
      include: {
        house: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Calculate review statistics
    const stats = await this.getHouseReviewStats(houseId);

    return {
      success: true,
      data: {
        reviews,
        stats,
      },
    };
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    const { rating, ...updateData } = updateReviewDto;

    if (rating && (rating < 1 || rating > 5)) {
      throw new BadRequestException('Rating must be between 1 adn 5');
    }

    try {
      const review = await this.prisma.review.update({
        where: { id },
        data: {
          ...updateData,
          ...(rating && { rating }),
        },
        include: {
          land: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          house: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      // If status changed to APPROVED, update land's average rating
      if (
        updateReviewDto.status === ReviewStatus.APPROVED &&
        existingReview.status !== ReviewStatus.APPROVED
      ) {
        await this.updateLandRating(review.landId);
        await this.updateHouseRating(review.houseId);
      }

      return {
        success: true,
        message: 'Review updated successfully',
        data: review,
      };
    } catch (error) {
      throw error || 'Something went wrong';
    }
  }

  async updateStatus(id: string, status: ReviewStatus) {
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, landId: true, houseId: true, status: true },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    const review = await this.prisma.review.update({
      where: { id },
      data: { status },
      include: {
        land: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        house: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    // Update land's average rating if status changed to/from APPROVED
    if (
      status === ReviewStatus.APPROVED ||
      existingReview.status === ReviewStatus.APPROVED
    ) {
      await this.updateLandRating(existingReview.landId);
      await this.updateHouseRating(existingReview.houseId);
    }

    return {
      success: true,
      message: `Review ${status.toLowerCase()} successfully`,
      data: review,
    };
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, landId: true, houseId: true, status: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update land's average rating if deleted review was approved
    if (review.status === ReviewStatus.APPROVED) {
      await this.updateLandRating(review.landId);
    }

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  /**
   * Update land's average rating and total reviews count
   */
  private async updateLandRating(landId: string | null) {
    if (!landId) return;

    const approvedReviews = await this.prisma.review.findMany({
      where: {
        landId,
        status: ReviewStatus.APPROVED,
      },
      select: { rating: true },
    });

    const totalReviews = approvedReviews.length;
    const averageRating =
      totalReviews > 0
        ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : null;

    await this.prisma.land.update({
      where: { id: landId },
      data: {
        averageRating: averageRating
          ? parseFloat(averageRating.toFixed(1))
          : null,
        totalReviews,
      },
    });
  }

  private async updateHouseRating(houseId: string | null) {
    if (!houseId) return;

    const approvedReviews = await this.prisma.review.findMany({
      where: {
        houseId,
        status: ReviewStatus.APPROVED,
      },
      select: { rating: true },
    });

    const totalReviews = approvedReviews.length;
    const averageRating =
      totalReviews > 0
        ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : null;

    await this.prisma.house.update({
      where: { id: houseId },
      data: {
        averageRating: averageRating
          ? parseFloat(averageRating.toFixed(1))
          : null,
        totalReviews,
      },
    });
  }

  /**
   * Get review statistics for a land
   */

  async getLandReviewStats(landId: string) {
    const [
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      ratingDistribution,
    ] = await Promise.all([
      this.prisma.review.count({ where: { landId } }),
      this.prisma.review.count({
        where: { landId, status: ReviewStatus.APPROVED },
      }),
      this.prisma.review.count({
        where: { landId, status: ReviewStatus.PENDING },
      }),
      this.prisma.review.count({
        where: { landId, status: ReviewStatus.REJECTED },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { landId, status: ReviewStatus.APPROVED },
        _count: { rating: true },
      }),
    ]);

    // Format rating distribution
    const ratings = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      ratings[item.rating as keyof typeof ratings] = item._count.rating;
    });

    const averageRating =
      approvedReviews > 0
        ? ratingDistribution.reduce(
            (sum, item) => sum + item.rating * item._count.rating,
            0,
          ) / approvedReviews
        : 0;

    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution: ratings,
    };
  }

  async getHouseReviewStats(houseId: string) {
    const [
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      ratingDistribution,
    ] = await Promise.all([
      this.prisma.review.count({ where: { houseId } }),
      this.prisma.review.count({
        where: { houseId, status: ReviewStatus.APPROVED },
      }),
      this.prisma.review.count({
        where: { houseId, status: ReviewStatus.PENDING },
      }),
      this.prisma.review.count({
        where: { houseId, status: ReviewStatus.REJECTED },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { houseId, status: ReviewStatus.APPROVED },
        _count: { rating: true },
      }),
    ]);

    // Format rating distribution
    const ratings = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      ratings[item.rating as keyof typeof ratings] = item._count.rating;
    });

    const averageRating =
      approvedReviews > 0
        ? ratingDistribution.reduce(
            (sum, item) => sum + item.rating * item._count.rating,
            0,
          ) / approvedReviews
        : 0;

    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution: ratings,
    };
  }

  /**
   * Bulk approve reviews
   */
  async bulkApprove(reviewIds: string[]) {
    const reviews = await this.prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: { id: true, landId: true, houseId: true, status: true },
    });

    if (reviews.length !== reviewIds.length) {
      throw new NotFoundException('Some reviews not found');
    }

    await this.prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { status: ReviewStatus.APPROVED },
    });

    // Update ratings for affected lands
    const landIds = [...new Set(reviews.map((r) => r.landId))];
    await Promise.all(landIds.map((landId) => this.updateLandRating(landId)));

    const houseIds = [...new Set(reviews.map((r) => r.houseId))];
    await Promise.all(
      houseIds.map((houseId) => this.updateHouseRating(houseId)),
    );

    return {
      success: true,
      message: `${reviewIds.length} reviews approved successfully`,
    };
  }

  /**
   * Bulk reject reviews
   */
  async bulkReject(reviewIds: string[]) {
    const reviews = await this.prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: { id: true, landId: true, houseId: true, status: true },
    });

    if (reviews.length !== reviewIds.length) {
      throw new NotFoundException('Some reviews not found');
    }

    await this.prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { status: ReviewStatus.REJECTED },
    });

    // Update ratings for affected lands (in case some were previously approved)
    const landIds = [...new Set(reviews.map((r) => r.landId))];
    await Promise.all(landIds.map((landId) => this.updateLandRating(landId)));

    const houseIds = [...new Set(reviews.map((r) => r.houseId))];
    await Promise.all(
      houseIds.map((houseId) => this.updateHouseRating(houseId)),
    );

    return {
      success: true,
      message: `${reviewIds.length} reviews rejected successfully`,
    };
  }

  /**
   * Get pending reviews (for admin moderation)
   */
  async getPendingReviews(query?: { page?: string; limit?: string }) {
    const page = parseInt(query?.page || '1');
    const limit = parseInt(query?.limit || '10');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { status: ReviewStatus.PENDING },
        include: {
          land: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          house: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for moderation
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      },
    };
  }
}
