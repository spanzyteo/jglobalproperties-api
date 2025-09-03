/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';
import { QueryHouseDto } from './dto/query-house.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadedImage } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class HousesService {
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
      const existing = await this.prisma.house.findUnique({
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

  async create(createHouseDto: CreateHouseDto, files?: Express.Multer.File[]) {
    try {
      const { units, imageDetails, title, ...houseData } = createHouseDto;

      const baseSlug = this.generateSlug(title);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      let uploadedImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        // upload all images at once
        uploadedImages =
          await this.cloudinaryService.uploadMultipleImages(files);
      }

      const house = await this.prisma.house.create({
        data: {
          ...houseData,
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
            },
          },
        },
      });

      return {
        success: true,
        message: 'house created successfully',
        data: house,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryHouseDto) {
    const {
      search,
      state,
      location,
      category,
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
    if (category) where.category = category;

    const [house, total] = await Promise.all([
      this.prisma.house.findMany({
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
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.house.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: {
        house,
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
    const house = await this.prisma.house.findUnique({
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
          },
        },
      },
    });

    if (!house) {
      throw new NotFoundException('house not found');
    }

    return {
      success: true,
      data: house,
    };
  }

  async findBySlug(slug: string) {
    const house = await this.prisma.house.findUnique({
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
          },
        },
      },
    });

    if (!house) {
      throw new NotFoundException('house not found');
    }

    return {
      success: true,
      data: house,
    };
  }

  async update(
    id: string,
    updateHouseDto: UpdateHouseDto,
    files?: Express.Multer.File[],
  ) {
    const existingHouse = await this.prisma.house.findUnique({
      where: { id },
      include: { units: true, images: true },
    });

    if (!existingHouse) {
      throw new NotFoundException('House not found');
    }

    try {
      const { units, imageDetails, title, ...houseData } = updateHouseDto;

      let uniqueSlug: string | undefined;
      if (title && title !== existingHouse.title) {
        const baseSlug = this.generateSlug(title);
        uniqueSlug = await this.ensureUniqueSlug(baseSlug, id);
      }

      let newImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        newImages = await this.cloudinaryService.uploadMultipleImages(files);
      }

      const updateData: any = {
        ...houseData,
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
        const oldPublicIds = existingHouse.images.map((img) => img.publicId);
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

      const house = await this.prisma.house.update({
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
            },
          },
        },
      });

      return {
        success: true,
        message: 'House updated successfully',
        data: house,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const house = await this.prisma.house.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!house) {
      throw new NotFoundException('house not found');
    }

    if (house.images.length > 0) {
      const publicIds = house.images.map((img) => img.publicId);
      await this.cloudinaryService.deleteMultipleImages(publicIds);
    }

    await this.prisma.house.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'House deleted successfully',
    };
  }
}
