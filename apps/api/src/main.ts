import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route lives under /api, which keeps the URL space free for the
  // Next.js rewrite in apps/web/next.config.ts.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown keys instead of persisting them.
      whitelist: true,
      // Reject them loudly rather than silently, so client bugs surface early.
      forbidNonWhitelisted: true,
      // JSON bodies arrive as strings/plain objects; turn them into DTO
      // instances so @IsInt() and friends see real numbers.
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Only needed for direct browser -> API calls. Requests proxied through
  // Next.js are same-origin and never hit this.
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
