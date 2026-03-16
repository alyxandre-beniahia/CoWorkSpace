import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SendScheduledRemindersUseCase } from '../../application/use-cases/send-scheduled-reminders.use-case';

/**
 * Exécute l'envoi des rappels 24h une fois par jour à 8h (timezone du serveur).
 */
@Injectable()
export class ReminderSchedulerService {
  constructor(
    private readonly sendScheduledRemindersUseCase: SendScheduledRemindersUseCase,
  ) {}

  @Cron('0 8 * * *')
  async handleReminderCron(): Promise<void> {
    const result = await this.sendScheduledRemindersUseCase.run();
    if (result.sent > 0) {
      console.log(`[ReminderScheduler] ${result.sent} rappel(s) 24h envoyé(s).`);
    }
  }
}
