/**
 * Erreurs métier du domaine notification (ex. échec envoi après retry).
 */
export class NotificationSendError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NotificationSendError';
    Object.setPrototypeOf(this, NotificationSendError.prototype);
  }
}
