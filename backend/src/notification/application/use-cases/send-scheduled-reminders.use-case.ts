import type { IReservationsForReminder } from '../ports/reservations-for-reminder.port';
import { SendReservationReminder24hUseCase } from './send-reservation-reminder24h.use-case';

/**
 * Use case "cron" : récupère les réservations qui commencent dans les 24h
 * et envoie un email de rappel pour chacune.
 */
export class SendScheduledRemindersUseCase {
  constructor(
    private readonly reservationsForReminder: IReservationsForReminder,
    private readonly sendReminderUseCase: SendReservationReminder24hUseCase,
  ) {}

  async run(): Promise<{ sent: number }> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const payloads = await this.reservationsForReminder.findReservationsStartingBetween(
      now,
      in24h,
    );
    for (const payload of payloads) {
      await this.sendReminderUseCase.run(payload);
    }
    return { sent: payloads.length };
  }
}
