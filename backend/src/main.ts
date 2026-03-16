import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      // Requêtes sans Origin (Postman, curl, same-origin) : autoriser
      if (!origin) return callback(null, true);
      // Docker / dev : localhost, 127.0.0.1, 0.0.0.0 avec n'importe quel port
      const allowed =
        /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin) ||
        /^https?:\/\/\[::1\](:\d+)?$/.test(origin);
      callback(null, allowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 204,
  });
  const port = process.env.PORT ?? 3000;
  // Écouter sur 0.0.0.0 pour accepter les connexions depuis l'hôte (Docker port mapping)
  await app.listen(port, '0.0.0.0');
  console.log(`Backend CoWork'Space listening on port ${port}`);
}
bootstrap();
