import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  //Enable cors
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ?? 3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
