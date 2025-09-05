import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://fesow.vercel.app'
  ],
  credentials: true,
});


  app.setGlobalPrefix('api/v1/locals');

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
