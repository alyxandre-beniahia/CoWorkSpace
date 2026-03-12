import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SpaceModule } from './space/space.module';

@Module({
  imports: [PrismaModule, AuthModule, SpaceModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
