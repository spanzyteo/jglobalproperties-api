import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    // This function runs when the app starts and configures cloudinary
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'), // Gets from .env
      api_key: configService.get<string>('CLOUDINARY_API_KEY'), // Gets from .env
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'), // Gets from .env
    });
  },
  inject: [ConfigService],
};
