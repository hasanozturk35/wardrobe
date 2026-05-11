import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logger.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('\n❌ MISSING REQUIRED ENV VARS — App cannot start:');
    missing.forEach(v => console.error(`   • ${v}`));
    console.error('\nAdd these to Railway → Variables tab, then redeploy.\n');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const rawOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(o => o.trim());
  const isAllowedOrigin = (origin: string) => rawOrigins.includes(origin);

  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Allow large payloads for base64 image uploads (try-on selfie)
  const { json, urlencoded } = await import('express');
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Global Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: rawOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
