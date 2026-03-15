/** Heures autorisées pour les réservations : 7h à 20h. */
export const RESERVATION_MIN_HOUR = 7;
export const RESERVATION_MAX_HOUR = 20;

/** Fuseau horaire du bâtiment (toujours Paris pour cohérence). */
const BUILDING_TIMEZONE = 'Europe/Paris';

/** Nombre d'heures "ouvrées" par jour pour le calcul du taux d'occupation. */
export const RESERVATION_HOURS_PER_DAY = RESERVATION_MAX_HOUR - RESERVATION_MIN_HOUR;

/**
 * Retourne les minutes depuis minuit dans le fuseau du bâtiment (le client envoie des dates en UTC).
 */
function minutesSinceMidnightInTimezone(d: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  const second = parseInt(parts.find((p) => p.type === 'second')!.value, 10);
  return hour * 60 + minute + second / 60;
}

/**
 * Vérifie que le créneau est entièrement dans la plage 7h-20h (dans le fuseau du bâtiment).
 * Le client envoie les dates en UTC (toISOString), on les interprète donc en Europe/Paris.
 */
export function isWithinReservationWindow(start: Date, end: Date): boolean {
  const startMinutes = minutesSinceMidnightInTimezone(start, BUILDING_TIMEZONE);
  const endMinutes = minutesSinceMidnightInTimezone(end, BUILDING_TIMEZONE);
  const minMinutes = RESERVATION_MIN_HOUR * 60;
  const maxMinutes = RESERVATION_MAX_HOUR * 60;
  return startMinutes >= minMinutes && endMinutes <= maxMinutes;
}

export const RESERVATION_WINDOW_MESSAGE =
  'Les réservations ne sont autorisées qu\'entre 7h et 20h.';

export const RESERVATION_FUTURE_MESSAGE =
  'Les réservations ne peuvent se faire qu\'à partir de la prochaine heure.';

/**
 * Retourne les parties de date (année, mois, jour) dans le fuseau Paris pour une date.
 */
function getDatePartsInParis(d: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUILDING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
  return { year, month, day };
}

/** Heure d'été Paris (approximative : fin mars à fin octobre). */
function isParisSummer(year: number, month: number, day: number): boolean {
  if (month > 4 && month < 10) return true;
  if (month < 4 || month > 10) return false;
  if (month === 4) return day >= 1;
  return day <= 31; // October
}

/** Début du jour (00:00) à Paris pour (year, month, day) en instant UTC. */
function dateAtParisMidnight(year: number, month: number, day: number): Date {
  const offset = isParisSummer(year, month, day) ? 2 : 1;
  return new Date(Date.UTC(year, month - 1, day, -offset, 0, 0, 0));
}

/** Début du jour (07:00) à Paris pour (year, month, day). */
function dateAtParisHour(year: number, month: number, day: number, hour: number): Date {
  const offset = isParisSummer(year, month, day) ? 2 : 1;
  return new Date(Date.UTC(year, month - 1, day, hour - offset, 0, 0, 0));
}

/**
 * Retourne la durée en heures d'un créneau, en ne comptant que la partie comprise entre 7h et 20h chaque jour (heure Paris).
 */
export function durationHoursWithinWindow(start: Date, end: Date): number {
  if (end <= start) return 0;
  let totalHours = 0;
  const endTime = end.getTime();
  let cursor = getDatePartsInParis(start);
  const endParts = getDatePartsInParis(end);

  const endDayStart = dateAtParisMidnight(endParts.year, endParts.month, endParts.day);
  let dayStart = dateAtParisMidnight(cursor.year, cursor.month, cursor.day);

  while (dayStart.getTime() < endDayStart.getTime() + 24 * 3600 * 1000) {
    const windowStart = dateAtParisHour(cursor.year, cursor.month, cursor.day, RESERVATION_MIN_HOUR);
    const windowEnd = dateAtParisHour(cursor.year, cursor.month, cursor.day, RESERVATION_MAX_HOUR);
    const segmentStart = Math.max(start.getTime(), windowStart.getTime());
    const segmentEnd = Math.min(endTime, windowEnd.getTime());
    if (segmentEnd > segmentStart) {
      totalHours += (segmentEnd - segmentStart) / (1000 * 60 * 60);
    }
    dayStart = new Date(dayStart.getTime() + 24 * 3600 * 1000);
    cursor = getDatePartsInParis(dayStart);
  }
  return totalHours;
}

/** Prochaine heure (début) en Paris à partir de maintenant. */
export function getNextHourStartParis(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUILDING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((x) => x.type === 'hour')!.value, 10);
  const minute = parseInt(parts.find((x) => x.type === 'minute')!.value, 10);
  const needNextHour = minute > 0 || hour === 23;
  const nextHour = needNextHour ? (hour === 23 ? 0 : hour + 1) : hour;
  const nextDay = needNextHour && hour === 23;
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const p = nextDay ? getDatePartsInParis(tomorrow) : getDatePartsInParis(now);
  return dateAtParisHour(p.year, p.month, p.day, nextHour);
}

/** Vérifie que le début de la réservation est dans le futur (à partir de la prochaine heure Paris). */
export function isStartInFuture(start: Date): boolean {
  return start.getTime() >= getNextHourStartParis().getTime();
}

/** Début (00:00) et fin (23:59:59.999) du jour en cours à Paris. */
export function getTodayStartEndParis(): { start: Date; end: Date } {
  const now = new Date();
  const p = getDatePartsInParis(now);
  const start = dateAtParisMidnight(p.year, p.month, p.day);
  const end = new Date(dateAtParisMidnight(p.year, p.month, p.day).getTime() + 24 * 3600 * 1000 - 1);
  return { start, end };
}

/** Lundi 00:00 et dimanche 23:59:59 de la semaine en cours à Paris. */
export function getWeekStartEndParis(): { start: Date; end: Date } {
  const now = new Date();
  const p = getDatePartsInParis(now);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUILDING_TIMEZONE,
    weekday: 'short',
    hour12: false,
  });
  const parts = formatter.formatToParts(dateAtParisMidnight(p.year, p.month, p.day));
  const dayName = parts.find((x) => x.type === 'weekday')!.value;
  const monOffset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const daysBack = monOffset[dayName] ?? 0;
  const todayMidnight = dateAtParisMidnight(p.year, p.month, p.day);
  const monday = new Date(todayMidnight.getTime() - daysBack * 24 * 3600 * 1000);
  const mondayParts = getDatePartsInParis(monday);
  const start = dateAtParisMidnight(mondayParts.year, mondayParts.month, mondayParts.day);
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000 - 1);
  return { start, end };
}
