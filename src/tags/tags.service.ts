import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BlogCommentStatus, BlogStatus } from 'generated/prisma';

@Injectable()
export class TagsService {
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
      const existing = await this.prisma.blogTag.findUnique({
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
  async create(createTagDto: CreateTagDto) {
    const { name } = createTagDto;

    const baseSlug = this.generateSlug(name);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    try {
      const tag = await this.prisma.blogTag.create({
        data: {
          name,
          slug: uniqueSlug,
        },
        include: {
          _count: {
            select: { blogs: true },
          },
        },
      });

      return {
        success: true,
        message: 'Tag created successfully',
        data: tag,
      };
    } catch (error) {
      throw error || 'Failed to create tag';
    }
  }

  async findAll() {
    const tags = await this.prisma.blogTag.findMany({
      include: {
        _count: {
          select: {
            blogs: {
              where: {
                blog: { status: BlogStatus.PUBLISHED },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: tags,
    };
  }

  async findOne(id: string) {
    const tag = await this.prisma.blogTag.findUnique({
      where: { id },
      include: {
        blogs: {
          where: {
            blog: { status: BlogStatus.PUBLISHED },
          },
          include: {
            blog: {
              include: {
                category: true,
                _count: {
                  select: {
                    comments: { where: { status: BlogCommentStatus.APPROVED } },
                  },
                },
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            blogs: {
              where: {
                blog: { status: BlogStatus.PUBLISHED },
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return {
      success: true,
      data: tag,
    };
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const existingTag = await this.prisma.blogTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag not found');
    }

    try {
      const { name } = updateTagDto;
      let uniqueSlug: string | undefined;

      if (name && name !== existingTag.name) {
        const baseSlug = this.generateSlug(name);
        uniqueSlug = await this.ensureUniqueSlug(baseSlug, id);
      }

      const updatedData: UpdateTagDto = {
        ...(name && { name }),
        ...(uniqueSlug && { slug: uniqueSlug }),
      };

      const tag = await this.prisma.blogTag.update({
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
        message: 'Tag updated successfully',
        data: tag,
      };
    } catch (error) {
      throw error || 'Failed to update tag';
    }
  }

  async remove(id: string) {
    const tag = await this.prisma.blogTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { blogs: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Tags can be safely deleted even if they have blogs (many-to-many relationship)
    await this.prisma.blogTag.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Tag deleted successfully',
    };
  }
}
