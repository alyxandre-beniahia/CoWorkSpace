import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  // Écouter sur 0.0.0.0 pour accepter les connexions depuis l'hôte (Docker port mapping)
  await app.listen(port, '0.0.0.0');
  console.log(`Backend CoWork'Space listening on port ${port}`);
}
bootstrap();
