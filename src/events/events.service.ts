/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  CloudinaryService,
  UploadedImage,
} from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createEventDto: CreateEventDto, files?: Express.Multer.File[]) {
    try {
      const { imageDetails, date, ...eventData } = createEventDto;

      // Validate that only one image is provided
      if (files && files.length > 1) {
        throw new BadRequestException('You can only add one image to an event');
      }

      let uploadedImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        // upload all images at once
        uploadedImages =
          await this.cloudinaryService.uploadMultipleImages(files);
      }

      const eventDate = new Date(date);
      const isPast = eventDate < new Date();

      const event = await this.prisma.event.create({
        data: {
          ...eventData,
          date,
          isPast,
          image:
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
      });

      return {
        success: true,
        message: 'Event created successfully',
        data: event,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryEventDto) {
    const {
      search,
      location,
      isPast,
      organizer,
      date,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (typeof isPast === 'boolean') {
      where.isPast = isPast;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (organizer) {
      where.organizer = {
        contains: organizer,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { organizer: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (date) {
      const dateObj = new Date(date);
      where.date = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lt: new Date(dateObj.setHours(23, 59, 59, 999)),
      };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          image: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: {
        events,
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
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        image: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      success: true,
      data: event,
    };
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    files?: Express.Multer.File[],
  ) {
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
      include: { image: true },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Validate that only one image is provided
    if (files && files.length > 1) {
      throw new BadRequestException('You can only add one image to an event');
    }

    try {
      const { imageDetails, date, ...eventData } = updateEventDto;

      let newImages: UploadedImage[] = [];
      if (files && files.length > 0) {
        newImages = await this.cloudinaryService.uploadMultipleImages(files);
      }

      const updateData: any = {
        ...eventData,
        ...(date && { date }),
      };

      // Handle images update (replace all existing images)
      if (newImages.length > 0) {
        // Delete old images from Cloudinary first
        const oldPublicIds = existingEvent.image.map((img) => img.publicId);
        if (oldPublicIds.length > 0) {
          await this.cloudinaryService.deleteMultipleImages(oldPublicIds);
        }

        // Replace database image records
        updateData.image = {
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

      const event = await this.prisma.event.update({
        where: { id },
        data: updateData,
        include: {
          image: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        success: true,
        message: 'Event updated successfully',
        data: event,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { image: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.image.length > 0) {
      const publicIds = event.image.map((img) => img.publicId);
      await this.cloudinaryService.deleteMultipleImages(publicIds);
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Event deleted successfully',
    };
  }
}
