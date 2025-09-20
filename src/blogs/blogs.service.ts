/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { QueryBlogDto } from './dto/query-blog.dto';
import { BlogCommentStatus, BlogStatus } from 'generated/prisma';
import {
  CloudinaryService,
  UploadedImage,
} from 'src/cloudinary/cloudinary.service';
import {
  CreateBlogCommentDto,
  QueryBlogCommentDto,
} from './dto/create-blog-comment.dto';

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.blog.findUnique({
        where: { slug },
        select: { id: true },
      });

      // If no existing house with this slug, or it's the same house we're updating
      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      // If slug exists, append counter and try again
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createBlogDto: CreateBlogDto, files?: Express.Multer.File[]) {
    try {
      const { tagIds, categoryId, imageDetails, title, ...blogData } =
        createBlogDto;

      const baseSlug = this.generateSlug(title);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      let uploadedImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        // upload all images at once
        uploadedImages =
          await this.cloudinaryService.uploadMultipleImages(files);
      }

      const category = await this.prisma.blogCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Validate tags exist if provided
      if (tagIds && tagIds.length > 0) {
        const tags = await this.prisma.blogTag.findMany({
          where: { id: { in: tagIds } },
        });

        if (tags.length !== tagIds.length) {
          throw new BadRequestException('One or more tags not found');
        }
      }

      const blog = await this.prisma.blog.create({
        data: {
          ...blogData,
          title,
          slug: uniqueSlug,
          categoryId,
          tags: tagIds
            ? {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
          images:
            uploadedImages.length > 0
              ? {
                  create: uploadedImages.map((img, index) => ({
                    url: img.url,
                    publicId: img.public_id,
                    caption: imageDetails?.[index]?.caption || null, // Caption from form
                    isPrimary: imageDetails?.[index]?.isPrimary || index === 0, // First image is primary by default
                    order: imageDetails?.[index]?.order || index,
                  })),
                }
              : undefined,
        },
        include: {
          category: true,
          images: { orderBy: { order: 'asc' } },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      });

      return {
        success: true,
        message: 'house created successfully',
        data: blog,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryBlogDto) {
    const {
      search,
      categoryId,
      tagId,
      status,
      page = '1',
      limit = '10',
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      featured,
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    // Filter by status (published by default for public)
    if (status) {
      where.status = status;
    } else {
      where.status = BlogStatus.PUBLISHED; // Default to published
    }

    // Filter by category
    if (categoryId) where.categoryId = categoryId;

    // Filter by tag
    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId,
        },
      };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Featured filter (blogs with high view count or specific criteria)
    if (featured === 'true') {
      where.viewCount = { gte: 50 }; // Example: blogs with 100+ views
    }

    const [blogs, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: {
        blogs,
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
    const blog = await this.prisma.blog.findUnique({
      where: { id, status: BlogStatus.PUBLISHED },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Increment view count
    await this.prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: blog,
    };
  }

  async findBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug, status: BlogStatus.PUBLISHED },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Increment view count
    await this.prisma.blog.update({
      where: { slug: blog.slug },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: blog,
    };
  }

  async update(
    id: string,
    updateBlogDto: UpdateBlogDto,
    files?: Express.Multer.File[],
  ) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { images: true, tags: true },
    });

    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    try {
      const { tagIds, imageDetails, title, ...blogData } = updateBlogDto;

      let uniqueSlug: string | undefined;
      if (title && title !== existingBlog.title) {
        const baseSlug = this.generateSlug(title);
        uniqueSlug = await this.ensureUniqueSlug(baseSlug, id);
      }

      let newImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        newImages = await this.cloudinaryService.uploadMultipleImages(files);
      }

      const updateData: any = {
        ...blogData,
        ...(title && { title }),
        ...(uniqueSlug && { slug: uniqueSlug }),
        tags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      };

      // Handle images update (replace all existing images)
      if (newImages.length > 0) {
        // Delete old images from Cloudinary first
        const oldPublicIds = existingBlog.images.map((img) => img.publicId);
        if (oldPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(oldPublicIds);
        }

        // Replace database image records
        updateData.images = {
          deleteMany: {}, // Delete all existing image records
          create: newImages.map((img, index) => ({
            url: img.url, // Now TypeScript knows this exists
            publicId: img.public_id, // Now TypeScript knows this exists
            caption: imageDetails?.[index]?.caption || null, // Caption from form
            isPrimary: imageDetails?.[index]?.isPrimary || index === 0, // First image is primary by default
            order: imageDetails?.[index]?.order || index, // Display order
          })),
        };
      }

      const blog = await this.prisma.blog.update({
        where: { id },
        data: updateData,
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      return {
        success: true,
        message: 'Blog updated successfully',
        data: blog,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    if (blog.images.length > 0) {
      const publicIds = blog.images.map((img) => img.publicId);
      await this.cloudinaryService.deleteMultipleImages(publicIds);
    }

    await this.prisma.blog.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Blog deleted successfully',
    };
  }

  async createComment(createCommentDto: CreateBlogCommentDto) {
    const { blogId, ...commentData } = createCommentDto;

    // Validate blog exists and is published
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId, status: BlogStatus.PUBLISHED },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found or not published');
    }

    try {
      const comment = await this.prisma.blogComment.create({
        data: {
          ...commentData,
          blogId,
          status: BlogCommentStatus.PENDING,
        },
        include: {
          blog: {
            select: { id: true, title: true, slug: true },
          },
        },
      });

      await this.updateBlogCommentStats(blogId);

      return {
        success: true,
        message: 'Comment submitted successfully and is pending approval',
        data: comment,
      };
    } catch (error) {
      throw error || 'Something went wrong';
    }
  }

  async getBlogComments(blogId: string, query?: QueryBlogCommentDto) {
    const { status, page = '1', limit = '20' } = query || {};

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {
      blogId,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = BlogCommentStatus.APPROVED; // Default to approved
    }

    const [comments, total] = await Promise.all([
      this.prisma.blogComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.blogComment.count({ where }),
    ]);

    return {
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalItems: total,
          itemsPerPage: take,
        },
      },
    };
  }

  // ============ HELPER METHODS ============
  private async updateBlogCommentStats(blogId: string) {
    const approvedComments = await this.prisma.blogComment.count({
      where: { blogId, status: BlogCommentStatus.APPROVED },
    });

    await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        totalComments: approvedComments,
      },
    });
  }

  async getFeaturedBlogs(limit = 5) {
    const blogs = await this.prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
      },
      orderBy: [{ viewCount: 'desc' }, { totalComments: 'desc' }],
      take: limit,
      include: {
        category: true,
        _count: {
          select: {
            comments: { where: { status: BlogCommentStatus.APPROVED } },
          },
        },
      },
    });

    return {
      success: true,
      data: blogs,
    };
  }
  async approveComment(commentId: string) {
    const comment = await this.prisma.blogComment.findUnique({
      where: { id: commentId },
      include: { blog: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updatedComment = await this.prisma.blogComment.update({
      where: { id: commentId },
      data: { status: BlogCommentStatus.APPROVED },
      include: {
        blog: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Update blog comment stats
    await this.updateBlogCommentStats(comment.blogId);

    return {
      success: true,
      message: 'Comment approved successfully',
      data: updatedComment,
    };
  }

  async rejectComment(commentId: string) {
    const comment = await this.prisma.blogComment.findUnique({
      where: { id: commentId },
      include: { blog: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updatedComment = await this.prisma.blogComment.update({
      where: { id: commentId },
      data: { status: BlogCommentStatus.REJECTED },
      include: {
        blog: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Update blog comment stats
    await this.updateBlogCommentStats(comment.blogId);

    return {
      success: true,
      message: 'Comment rejected successfully',
      data: updatedComment,
    };
  }

  async getPendingComments(query?: { page?: string; limit?: string }) {
    const page = parseInt(query?.page || '1');
    const limit = parseInt(query?.limit || '20');
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.blogComment.findMany({
        where: { status: BlogCommentStatus.PENDING },
        include: {
          blog: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first for moderation
        skip,
        take: limit,
      }),
      this.prisma.blogComment.count({
        where: { status: BlogCommentStatus.PENDING },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        comments,
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

  async deleteComment(commentId: string) {
    const comment = await this.prisma.blogComment.findUnique({
      where: { id: commentId },
      include: {
        blog: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Delete comment and all its replies (cascade)
    await this.prisma.blogComment.delete({
      where: { id: commentId },
    });

    // Update blog comment stats
    await this.updateBlogCommentStats(comment.blogId);

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }
  // Get recent blogs
  async getRecentBlogs(limit = 5) {
    const blogs = await this.prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: true,
        _count: {
          select: {
            comments: { where: { status: BlogCommentStatus.APPROVED } },
          },
        },
      },
    });

    return {
      success: true,
      data: blogs,
    };
  }

  async getBlogStats() {
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalComments,
      pendingComments,
      totalViews,
      totalCategories,
      totalTags,
    ] = await Promise.all([
      this.prisma.blog.count(),
      this.prisma.blog.count({ where: { status: BlogStatus.PUBLISHED } }),
      this.prisma.blog.count({ where: { status: BlogStatus.DRAFT } }),
      this.prisma.blogComment.count(),
      this.prisma.blogComment.count({
        where: { status: BlogCommentStatus.PENDING },
      }),
      this.prisma.blog.aggregate({
        _sum: { viewCount: true },
      }),
      this.prisma.blogCategory.count(),
      this.prisma.blogTag.count(),
    ]);

    return {
      success: true,
      data: {
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs,
        },
        comments: {
          total: totalComments,
          pending: pendingComments,
        },
        totalViews: totalViews._sum.viewCount || 0,
        categories: totalCategories,
        tags: totalTags,
      },
    };
  }

  async getPopularBlogs(limit = 10) {
    const blogs = await this.prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED },
      orderBy: [{ viewCount: 'desc' }, { totalComments: 'desc' }],
      take: limit,
      include: {
        category: true,
        _count: {
          select: {
            comments: { where: { status: BlogCommentStatus.APPROVED } },
          },
        },
      },
    });

    return {
      success: true,
      data: blogs,
    };
  }
}
