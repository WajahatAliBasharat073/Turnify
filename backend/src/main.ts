import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet sets secure HTTP response headers
  app.use(helmet());

  // Performance: Compress response bodies for smaller payload sizes
  app.use(compression());

  // CORS: Enable Cross-Origin Resource Sharing with strict settings in production
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // API Versioning (e.g., /v1/users)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe Configuration
  // Enforces validation on all incoming DTOs using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip non-whitelisted properties from DTOs
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to match standard DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Native type conversion based on TypeScript types
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Enhance security by hiding validation messages in production
    }),
  );

  // Swagger OpenAPI Documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CleanConnect API')
      .setDescription('The API for CleanConnect - Property host and cleaner marketplace')
      .setVersion('1.0')
      .addBearerAuth() // Configure JWT Authorization in Swagger UI
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Ensure graceful shutdown of the application
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`CleanConnect API is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger documentation at: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
