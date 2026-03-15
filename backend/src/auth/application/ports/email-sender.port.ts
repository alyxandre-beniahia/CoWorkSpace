/**
 * Port pour l'envoi d'emails (vérification, reset mot de passe).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export interface IEmailSender {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const AUTH_EMAIL_SENDER = 'IEmailSender';
