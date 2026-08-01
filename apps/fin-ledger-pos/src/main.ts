import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from '@fin-ledger/filters';
import { PiiScrubberLogger } from '@fin-ledger/loggers';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DebugExceptionFilter } from './debug.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // logger: new PiiScrubberLogger(),
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new DebugExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Inventory Ledger API')
    .setDescription('The core API for managing inventory')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(process.env.HTTP_PORT || 8080);
}
bootstrap();
