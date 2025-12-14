/**
 * Timezone Conversion Utility
 * Handles UTC to Toronto time conversion with automatic DST handling
 */

import { utcToZonedTime, format } from 'date-fns-tz';
import { parse, getYear, getDay } from 'date-fns';

const TORONTO_TZ = 'America/Toronto';

/**
 * Convert UTC timestamp string to Toronto Date object
 * Automatically handles DST transitions
 * Supports multiple formats: "2020-08-11 6:00:00", "2020-08-11 06:00:00", "2020-08-11T06:00:00"
 *
 * @param utcTimestamp - UTC timestamp string
 * @returns Date object in Toronto timezone
 */
export function utcToToronto(utcTimestamp: string): Date {
  try {
    // Clean and normalize the timestamp
    let cleanTimestamp = utcTimestamp.trim();

    // Replace 'T' with space if present (ISO format)
    cleanTimestamp = cleanTimestamp.replace('T', ' ');

    // Normalize to ensure double-digit hours/minutes/seconds
    // Handles: "2020-08-11 6:00:00" -> "2020-08-11 06:00:00"
    cleanTimestamp = cleanTimestamp.replace(
      /(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/,
      (match, year, month, day, hour, minute, second) => {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
      }
    );

    // Try parsing with date-fns
    let utcDate = parse(cleanTimestamp, 'yyyy-MM-dd HH:mm:ss', new Date());

    // Check if parse was successful
    if (isNaN(utcDate.getTime())) {
      // Fallback: try native Date parsing
      utcDate = new Date(cleanTimestamp);

      // If still invalid, throw error
      if (isNaN(utcDate.getTime())) {
        throw new Error(`Unable to parse timestamp: "${utcTimestamp}"`);
      }
    }

    // Convert to Toronto timezone (handles DST automatically)
    const torontoDate = utcToZonedTime(utcDate, TORONTO_TZ);

    return torontoDate;
  } catch (error) {
    console.error('Timestamp parsing error:', error, 'Input:', utcTimestamp);
    throw new Error(`Invalid timestamp format: "${utcTimestamp}". Expected format: "YYYY-MM-DD HH:MM:SS"`);
  }
}

/**
 * Format Toronto date to time slot string (HH:mm)
 *
 * @param torontoDate - Date in Toronto timezone
 * @returns Time slot string (e.g., "06:00")
 */
export function formatTimeSlot(torontoDate: Date): string {
  return format(torontoDate, 'HH:mm', { timeZone: TORONTO_TZ });
}

/**
 * Get year from Toronto date
 *
 * @param torontoDate - Date in Toronto timezone
 * @returns Year number
 */
export function getTorontoYear(torontoDate: Date): number {
  return getYear(torontoDate);
}

/**
 * Get day of week from Toronto date
 *
 * @param torontoDate - Date in Toronto timezone
 * @returns Day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getTorontoDayOfWeek(torontoDate: Date): number {
  return getDay(torontoDate);
}

/**
 * Get day name from day index
 *
 * @param dayIndex - Day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Day name
 */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

/**
 * Check if time slot falls within the specified range
 *
 * @param timeSlot - Time slot string (e.g., "06:00")
 * @param startTime - Start time (e.g., "06:00")
 * @param endTime - End time (e.g., "23:45")
 * @returns true if time slot is within range
 */
export function isTimeInRange(timeSlot: string, startTime: string, endTime: string): boolean {
  const [slotHour, slotMin] = timeSlot.split(':').map(Number);
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const slotMinutes = slotHour * 60 + slotMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return slotMinutes >= startMinutes && slotMinutes <= endMinutes;
}
