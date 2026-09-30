import { RateGroup, HeadcountEntry } from '../types';
import { formatDateDMY, formatINR } from './formatters';
import { calculateOtRate } from './wageCalculator';

export interface WhatsAppFormatOptions {
  date: string;
  siteName: string;
  groups: RateGroup[];
  shiftHours?: number;
}

/**
 * Formats daily headcount attendance into the exact standard WhatsApp format:
 *
 * Example:
 * 25/3/2026
 * 37 sector Attendance
 * 1 mesan 850
 * 2 helper 1200
 * 4 helper 2200
 * 1 helper 1 hours ot 68
 */
export function formatDailyAttendanceWhatsApp({
  date,
  siteName,
  groups,
  shiftHours = 8,
}: WhatsAppFormatOptions): string {
  const formattedDate = formatDateDMY(date, false);
  const cleanSiteName = siteName?.trim() || 'Site';

  // Filter valid groups
  const validGroups = groups.filter(
    (g) => typeof g.count === 'number' && g.count > 0 && typeof g.dayRate === 'number' && g.dayRate > 0
  );

  const lines: string[] = [];
  lines.push(formattedDate);
  lines.push(`  ${cleanSiteName} Attendance`);

  // Base wage lines
  validGroups.forEach((g) => {
    const count = typeof g.count === 'number' ? g.count : 0;
    const dayRate = typeof g.dayRate === 'number' ? g.dayRate : 0;
    const roleLabel = g.workerType === 'mesan' ? 'mesan' : g.workerType === 'helper' ? 'helper' : g.workerType;
    const baseTotal = count * dayRate;

    lines.push(`  ${count} ${roleLabel} ${baseTotal}`);
  });

  // Overtime (OT) lines
  validGroups.forEach((g) => {
    const otWorkers = typeof g.otWorkers === 'number' ? g.otWorkers : 0;
    const otHours = typeof g.otHours === 'number' ? g.otHours : 0;
    const dayRate = typeof g.dayRate === 'number' ? g.dayRate : 0;

    if (otWorkers > 0 && otHours > 0 && dayRate > 0) {
      const roleLabel = g.workerType === 'mesan' ? 'mesan' : g.workerType === 'helper' ? 'helper' : g.workerType;
      const hourlyOtRate = calculateOtRate(dayRate, shiftHours);
      const otAmount = otWorkers * otHours * hourlyOtRate;

      lines.push(`  ${otWorkers} ${roleLabel} ${otHours} hours ot ${otAmount}`);
    }
  });

  return lines.join('\n');
}

/**
 * Aggregates all entries for a given date and formats them into WhatsApp format.
 */
export function formatEntryListForDateWhatsApp(
  date: string,
  siteName: string,
  entries: HeadcountEntry[],
  shiftHours = 8
): string {
  const dateEntries = entries.filter((e) => e.date === date);
  const allGroups = dateEntries.flatMap((e) => e.groups);
  return formatDailyAttendanceWhatsApp({
    date,
    siteName,
    groups: allGroups,
    shiftHours,
  });
}

/**
 * Formats multiple dates for period WhatsApp report
 */
export function formatPeriodAttendanceWhatsApp(
  siteName: string,
  startDate: string,
  endDate: string,
  entries: HeadcountEntry[],
  shiftHours = 8
): string {
  const cleanSiteName = siteName?.trim() || 'Site';
  const startDMY = formatDateDMY(startDate, false);
  const endDMY = formatDateDMY(endDate, false);

  // Group entries by date
  const dateMap = new Map<string, RateGroup[]>();
  entries.forEach((e) => {
    const existing = dateMap.get(e.date) || [];
    dateMap.set(e.date, [...existing, ...e.groups]);
  });

  const sortedDates = Array.from(dateMap.keys()).sort();

  if (sortedDates.length === 0) {
    return `${startDMY} to ${endDMY}\n${cleanSiteName} Attendance\nNo attendance entries recorded.`;
  }

  const sections = sortedDates.map((d) =>
    formatDailyAttendanceWhatsApp({
      date: d,
      siteName: cleanSiteName,
      groups: dateMap.get(d) || [],
      shiftHours,
    })
  );

  const totalAmount = entries.reduce((sum, e) => sum + (e.totalWageAmount || 0), 0);
  const totalWorkers = entries.reduce((sum, e) => sum + (e.totalWorkers || 0), 0);

  return `${sections.join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━\n📊 Total Workers: ${totalWorkers}\n💰 Total Amount: ${formatINR(totalAmount, true)}`;
}

/**
 * Opens WhatsApp with the given text
 */
export function openWhatsAppWithMessage(text: string): void {
  const encoded = encodeURIComponent(text);
  const waUrl = `https://wa.me/?text=${encoded}`;
  window.open(waUrl, '_blank');
}

/**
 * Copies text to user's clipboard
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure / webview contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
