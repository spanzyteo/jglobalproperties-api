import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlogCommentStatus, BlogStatus } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

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
      const existing = await this.prisma.blogCategory.findUnique({
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
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description } = createCategoryDto;

    const baseSlug = this.generateSlug(name);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    try {
      const category = await this.prisma.blogCategory.create({
        data: {
          name,
          slug: uniqueSlug,
          description,
        },
        include: {
          _count: {
            select: { blogs: true },
          },
        },
      });

      return {
        success: true,
        message: 'Category created successfully',
        data: category,
      };
    } catch (error: any) {
      throw error || 'Something went wrong';
    }
  }

  async findAll() {
    const categories = await this.prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            blogs: { where: { status: BlogStatus.PUBLISHED } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories,
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        blogs: {
          where: { status: BlogStatus.PUBLISHED },
          include: {
            _count: {
              select: {
                comments: { where: { status: BlogCommentStatus.APPROVED } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 blogs in this category
        },
        _count: {
          select: { blogs: { where: { status: BlogStatus.PUBLISHED } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      success: true,
      data: category,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    try {
      const { name, description } = updateCategoryDto;

      let uniqueSlug: string | undefined;
      if (name && name !== existingCategory.name) {
        const baseSlug = this.generateSlug(name);
        uniqueSlug = await this.ensureUniqueSlug(baseSlug, id);
      }

      const updatedData: UpdateCategoryDto = {
        ...(name && { name }),
        ...(uniqueSlug && { slug: uniqueSlug }),
        ...(description && { description }),
      };

      const category = await this.prisma.blogCategory.update({
        where: { id },
        data: updatedData,
        include: {
          _count: {
            select: { blogs: true },
          },
        },
      });

      return {
        success: true,
        message: 'Category updated successfully',
        data: category,
      };
    } catch (error) {
      throw error || 'Something went wrong';
    }
  }

  async remove(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { blogs: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.blogs > 0) {
      throw new BadRequestException(
        'Cannot delete category that has blogs. Please reassign or delete the blogs first.',
      );
    }

    await this.prisma.blogCategory.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
