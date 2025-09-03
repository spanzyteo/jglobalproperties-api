import { Module } from '@nestjs/common';
import { LandsService } from './lands.service';
import { LandsController } from './lands.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [LandsController],
  providers: [LandsService],
  exports: [LandsService],
})
export class LandsModule {}
