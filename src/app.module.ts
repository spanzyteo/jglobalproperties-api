import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LandsModule } from './lands/lands.module';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ReviewsModule } from './reviews/reviews.module';
import { HousesModule } from './houses/houses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    LandsModule,
    CloudinaryModule,
    ReviewsModule,
    HousesModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {}
