import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

const DEFAULT_JWT_SECRETS = new Set([
  'development-secret-change-me',
  'change-me',
]);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  const configService = app.get(ConfigService);

  const corsRaw = configService.get<string>('app.corsOrigins', '');
  const origins = corsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length > 0) {
    app.enableCors({ origin: origins, credentials: true });
    logger.log(`CORS enabled for: ${origins.join(', ')}`);
  }

  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  const jwtSecret = configService.get<string>('auth.jwtSecret', '');
  if (
    nodeEnv === 'production' &&
    (!jwtSecret || DEFAULT_JWT_SECRETS.has(jwtSecret))
  ) {
    logger.warn(
      'JWT_SECRET is missing or using a well-known default in production. Set a long random value.',
    );
  }

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = configService.get<number>('app.port', 3000);

  await app.listen(port);
  logger.log(`Application is running on http://localhost:${port}/api`);
}

bootstrap();
