/**
 * Codes RRULE pour les jours (BYDAY).
 * Index 0 = dimanche, 1 = lundi, … 6 = samedi (aligné sur Date.getDay()).
 */
const RRULE_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

export type RecurrenceFreq = 'none' | 'daily' | 'weekly';

/**
 * Construit une règle RRULE à partir de la fréquence et des jours (pour hebdomadaire).
 * @param recurrenceFreq 'none' | 'daily' | 'weekly'
 * @param recurrenceWeekdays Indices 0–6 (0 = dimanche) pour weekly ; ignorés si daily.
 * @returns Chaîne RRULE ou null si pas récurrent.
 */
export function buildRecurrenceRule(
  recurrenceFreq: RecurrenceFreq,
  recurrenceWeekdays: number[],
): string | null {
  if (recurrenceFreq === 'none') return null;
  if (recurrenceFreq === 'daily') return 'FREQ=DAILY';
  if (recurrenceFreq === 'weekly') {
    const days =
      recurrenceWeekdays.length > 0
        ? recurrenceWeekdays
            .filter((d) => d >= 0 && d <= 6)
            .sort((a, b) => a - b)
            .map((d) => RRULE_DAYS[d])
            .join(',')
        : 'MO';
    return `FREQ=WEEKLY;BYDAY=${days}`;
  }
  return null;
}
