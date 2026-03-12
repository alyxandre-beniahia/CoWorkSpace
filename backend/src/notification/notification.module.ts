import { Module, Global } from '@nestjs/common';
import { EmailService } from './infrastructure/email.service';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationModule {}
