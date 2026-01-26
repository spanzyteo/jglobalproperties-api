/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto, MediaResponseDto } from './dto/create-media.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}
  async upload(
    file: Express.Multer.File,
    dto: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    if (!file) throw new BadRequestException('File is required');
    const uploaded = await this.cloudinary.uploadImage(file); // Converts to WebP internally

    // Save metadata to DB
    const media = await this.prisma.media.create({
      data: {
        url: uploaded.url,
        publicId: uploaded.public_id,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        width: (file as any).metadata?.width || null,
        height: (file as any).metadata?.height || null,
        alt: dto.alt,
        caption: dto.caption,
      },
      select: {
        id: true,
        url: true,
        alt: true,
        width: true,
        height: true,
      },
    });

    return {
      id: media.id,
      url: media.url,
      alt: media.alt ?? undefined,
      width: media.width ?? undefined,
      height: media.height ?? undefined,
    };
  }

  async list({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count(),
    ]);
    return { data, meta: { page, total } };
  }

  async delete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    await this.cloudinary.deleteImage(media.publicId);
    await this.prisma.media.delete({ where: { id } });
    return { success: true };
  }
}
