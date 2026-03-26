import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const WORK_HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 - 19:00

export function getWeekDays(referenceDate: Date): Date[] {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).slice(0, 5); // Mon-Fri
}

export function getWeekLabel(referenceDate: Date): string {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const startLabel = format(start, 'd MMM', { locale: es });
  const endLabel = format(end, 'd MMM yyyy', { locale: es });
  return `${startLabel} - ${endLabel}`;
}

export function nextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function prevWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function formatDayHeader(date: Date): { day: string; num: string; isToday: boolean } {
  return {
    day: format(date, 'EEE', { locale: es }).toUpperCase(),
    num: format(date, 'd'),
    isToday: isSameDay(date, new Date()),
  };
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseISODate(dateStr: string): Date {
  return parseISO(dateStr);
}

/** Returns top offset % and height % within the calendar grid (7:00 - 20:00 = 780 min) */
export const CALENDAR_START_MIN = 7 * 60; // 420
export const CALENDAR_END_MIN = 20 * 60;  // 1200
export const CALENDAR_TOTAL_MIN = CALENDAR_END_MIN - CALENDAR_START_MIN; // 780

export function getEventPosition(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime) - CALENDAR_START_MIN;
  const endMin = timeToMinutes(endTime) - CALENDAR_START_MIN;
  const top = (startMin / CALENDAR_TOTAL_MIN) * 100;
  const height = ((endMin - startMin) / CALENDAR_TOTAL_MIN) * 100;
  return { top, height };
}
