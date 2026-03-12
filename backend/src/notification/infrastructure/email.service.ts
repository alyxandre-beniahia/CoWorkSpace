import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

/**
 * Service d'envoi d'emails via l'API Resend.
 * Si RESEND_API_KEY est absent (dev), les envois sont loggés en console sans appel API.
 */
@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly appUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.RESEND_FROM ?? "CoWork'Space <onboarding@resend.dev>";
    this.appUrl = process.env.APP_URL ?? 'http://localhost:5173';
  }

  /**
   * Envoie l'email de vérification d'inscription avec le lien vers la page de validation.
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/verification-email?token=${encodeURIComponent(token)}`;
    const subject = "CoWork'Space – Validez votre adresse email";
    const html = `
      <p>Bonjour,</p>
      <p>Merci de vous être inscrit sur CoWork'Space. Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email.</p>
      <p>L'équipe CoWork'Space</p>
    `.trim();

    if (!this.resend) {
      console.log(`[Email] Vérification envoyée à ${to} avec lien ${verificationUrl}`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });
      if (error) {
        console.error('[Email] Erreur Resend (vérification):', error);
      }
    } catch (err) {
      console.error('[Email] Erreur envoi vérification:', err);
    }
  }

  /**
   * Envoie l'email de réinitialisation de mot de passe avec le lien vers la page reset.
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-mot-de-passe?token=${encodeURIComponent(token)}`;
    const subject = "CoWork'Space – Réinitialisation de votre mot de passe";
    const html = `
      <p>Bonjour,</p>
      <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte CoWork'Space.</p>
      <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Ce lien est valide pendant une durée limitée. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      <p>L'équipe CoWork'Space</p>
    `.trim();

    if (!this.resend) {
      console.log(`[Email] Reset MDP envoyé à ${to} avec lien ${resetUrl}`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });
      if (error) {
        console.error('[Email] Erreur Resend (reset MDP):', error);
      }
    } catch (err) {
      console.error('[Email] Erreur envoi reset MDP:', err);
    }
  }

  /**
   * Notifie le membre que son inscription a été validée par un administrateur (US-ADM-01).
   */
  async sendRegistrationApprovedEmail(to: string): Promise<void> {
    const loginUrl = `${this.appUrl}/login`;
    const subject = "CoWork'Space – Votre inscription a été validée";
    const html = `
      <p>Bonjour,</p>
      <p>Votre inscription sur CoWork'Space a été validée par un administrateur.</p>
      <p>Vous pouvez maintenant vous connecter : <a href="${loginUrl}">${loginUrl}</a></p>
      <p>L'équipe CoWork'Space</p>
    `.trim();

    if (!this.resend) {
      console.log(`[Email] Inscription validée envoyé à ${to}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });
      if (error) console.error('[Email] Erreur Resend (inscription validée):', error);
    } catch (err) {
      console.error('[Email] Erreur envoi inscription validée:', err);
    }
  }

  /**
   * Notifie le membre que son inscription a été refusée (US-ADM-01).
   */
  async sendRegistrationRejectedEmail(to: string): Promise<void> {
    const subject = "CoWork'Space – Votre inscription n'a pas été retenue";
    const html = `
      <p>Bonjour,</p>
      <p>Votre inscription sur CoWork'Space n'a pas été retenue par l'équipe d'administration.</p>
      <p>Pour toute question, vous pouvez contacter l'équipe CoWork'Space.</p>
      <p>L'équipe CoWork'Space</p>
    `.trim();

    if (!this.resend) {
      console.log(`[Email] Inscription refusée envoyé à ${to}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject,
        html,
      });
      if (error) console.error('[Email] Erreur Resend (inscription refusée):', error);
    } catch (err) {
      console.error('[Email] Erreur envoi inscription refusée:', err);
    }
  }
}
