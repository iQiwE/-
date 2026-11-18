import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from './app.module';

function ensureEnvLoaded(): void {
  const candidates = [path.resolve(process.cwd(), '.env'), path.resolve(__dirname, '..', '.env')];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2];
        }
      }
      break;
    }
  }
}

export function getUploadsDir(): string {
  const dir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function bootstrap() {
  ensureEnvLoaded();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Доверяем первому прокси (Render / Railway / Nginx) для корректной работы rate-limit и Secure cookies
  app.set('trust proxy', 1);

  // 1. Защита HTTP-заголовков (Helmet: XSS-filter, HSTS, X-Frame-Options, nosniff)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. Парсинг защищенных HttpOnly куки (JWT-токен)
  app.use(cookieParser());

  // 3. Защита от брутфорса и парсинга (express-rate-limit)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message: 'Слишком много запросов с вашего IP-адреса. Пожалуйста, повторите попытку позже.',
    },
  });

  const authBruteforceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message: 'Превышен лимит попыток авторизации. Пожалуйста, подождите 15 минут.',
    },
  });

  app.use('/api/v1', globalLimiter);
  app.use('/api/v1/auth/login', authBruteforceLimiter);
  app.use('/api/v1/auth/register', authBruteforceLimiter);

  const uploadsDir = getUploadsDir();
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  app.setGlobalPrefix('api/v1');

  // 4. Строгая политика CORS без Origin: '*'
  const envOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.102:3000',
    'http://192.168.3.119:3000',
    'http://192.168.0.123:3000',
    ...envOrigins,
  ]);
  allowedOrigins.delete('*');

  const localLanOriginRegex =
    /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        (process.env.NODE_ENV !== 'production' && localLanOriginRegex.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}
bootstrap();
