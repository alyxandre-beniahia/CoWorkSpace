import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SpaceModule } from './space/space.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationModule,
    AuthModule,
    SpaceModule,
    AdminModule,
    ReservationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
