/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLandDto } from './dto/create-land.dto';
import { UpdateLandDto } from './dto/update-land.dto';
import { QueryLandDto } from './dto/query-land.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadedImage } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class LandsService {
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
      const existing = await this.prisma.land.findUnique({
        where: { slug },
        select: { id: true },
      });

      // If no existing land with this slug, or it's the same land we're updating
      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug;
      }

      // If slug exists, append counter and try again
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createLandDto: CreateLandDto, files?: Express.Multer.File[]) {
    try {
      const { units, imageDetails, title, ...landData } = createLandDto;

      const baseSlug = this.generateSlug(title);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      let uploadedImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        // upload all images at once
        uploadedImages =
          await this.cloudinaryService.uploadMultipleImages(files);
      }

      const land = await this.prisma.land.create({
        data: {
          ...landData,
          title,
          slug: uniqueSlug,
          units: units
            ? {
                create: units,
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
          units: true,
          images: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              reviews: { where: { status: 'APPROVED' } },
              favorites: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Land created successfully',
        data: land,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryLandDto) {
    const {
      search,
      state,
      location,
      status,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { overview: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (status) where.status = status;

    const [lands, total] = await Promise.all([
      this.prisma.land.findMany({
        where,
        include: {
          units: {
            where: { available: true },
            orderBy: { price: 'asc' },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              reviews: { where: { status: 'APPROVED' } },
              favorites: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.land.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: {
        lands,
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
    const land = await this.prisma.land.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: { where: { status: 'APPROVED' } },
            favorites: true,
          },
        },
      },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    return {
      success: true,
      data: land,
    };
  }

  async findBySlug(slug: string) {
    const land = await this.prisma.land.findUnique({
      where: { slug },
      include: {
        units: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: { where: { status: 'APPROVED' } },
            favorites: true,
          },
        },
      },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    return {
      success: true,
      data: land,
    };
  }

  async update(
    id: string,
    updateLandDto: UpdateLandDto,
    files?: Express.Multer.File[],
  ) {
    const existingLand = await this.prisma.land.findUnique({
      where: { id },
      include: { units: true, images: true },
    });

    if (!existingLand) {
      throw new NotFoundException('Land not found');
    }

    try {
      const { units, imageDetails, title, ...landData } = updateLandDto;

      let uniqueSlug: string | undefined;
      if (title && title !== existingLand.title) {
        const baseSlug = this.generateSlug(title);
        uniqueSlug = await this.ensureUniqueSlug(baseSlug, id);
      }

      let newImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        newImages = await this.cloudinaryService.uploadMultipleImages(files);
      }

      const updateData: any = {
        ...landData,
        ...(title && { title }),
        ...(uniqueSlug && { slug: uniqueSlug }),
      };

      if (units) {
        // Delete existing units and create new ones
        updateData.units = {
          deleteMany: {},
          create: units,
        };
      }

      // Handle images update (replace all existing images)
      if (newImages.length > 0) {
        // Delete old images from Cloudinary first
        const oldPublicIds = existingLand.images.map((img) => img.publicId);
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

      const land = await this.prisma.land.update({
        where: { id },
        data: updateData,
        include: {
          units: true,
          images: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              reviews: { where: { status: 'APPROVED' } },
              favorites: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Land updated successfully',
        data: land,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const land = await this.prisma.land.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!land) {
      throw new NotFoundException('Land not found');
    }

    if (land.images.length > 0) {
      const publicIds = land.images.map((img) => img.publicId);
      await this.cloudinaryService.deleteMultipleImages(publicIds);
    }

    await this.prisma.land.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Land deleted successfully',
    };
  }
}
