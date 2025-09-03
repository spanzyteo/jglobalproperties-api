import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryProvider } from 'src/config/cloudinary.config';

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
