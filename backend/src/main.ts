import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply our custom logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors(); // <--- Enable CORS

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
