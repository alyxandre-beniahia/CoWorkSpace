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

const RRULE_DAYS_LIST = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Parse une règle RRULE pour préremplir le formulaire d’édition.
 */
export function parseRecurrenceRule(rule: string | null | undefined): {
  freq: RecurrenceFreq;
  weekdays: number[];
} {
  if (!rule) return { freq: 'none', weekdays: [] };
  if (rule.includes('FREQ=DAILY')) return { freq: 'daily', weekdays: [] };
  if (rule.includes('FREQ=WEEKLY')) {
    const byday = rule.split(';').find((s) => s.startsWith('BYDAY='))?.replace('BYDAY=', '').split(',') ?? [];
    const weekdays = byday.map((d) => RRULE_DAYS_LIST.indexOf(d)).filter((i) => i >= 0);
    return { freq: 'weekly', weekdays };
  }
  return { freq: 'none', weekdays: [] };
}

/** Formate une date pour input datetime-local (heure locale). */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
