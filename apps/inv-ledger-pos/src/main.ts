import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from '@inv-ledger/filter';
import { PiiScrubberLogger } from '@inv-ledger/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new PiiScrubberLogger(),
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
  await app.listen(process.env.HTTP_PORT || 8080);
}
bootstrap();
