/**
 * Port pour l'expansion des règles de récurrence (RRULE) en occurrences.
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export type RecurrenceOccurrence = {
  startDatetime: Date;
  endDatetime: Date;
};

export interface IRecurrenceExpander {
  expand(
    recurrenceRule: string,
    firstStart: Date,
    firstEnd: Date,
    recurrenceEndAt: Date,
    timeZone?: string,
  ): RecurrenceOccurrence[];
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const RESERVATION_RECURRENCE_EXPANDER = 'IRecurrenceExpander';
