import { Module } from '@nestjs/common';
import { HousesService } from './houses.service';
import { HousesController } from './houses.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
