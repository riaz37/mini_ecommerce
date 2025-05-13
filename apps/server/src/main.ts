import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.use(cookieParser());

  // Updated CORS configuration
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000'||
      'https://ecommerce37.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('The E-commerce API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('customers', 'Customer management endpoints')
    .addTag('orders', 'Order management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger is running on: ${await app.getUrl()}/api`);
}
bootstrap();
