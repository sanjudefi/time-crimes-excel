/**
 * Aggregation and Filtering Logic
 * Core business logic for time-based trading statistics
 */

import { OHLCRow } from './parser';
import {
  utcToToronto,
  formatTimeSlot,
  getTorontoYear,
  getTorontoDayOfWeek,
  isTimeInRange
} from './timezone';

export interface TimeSlotStats {
  timeSlot: string;        // e.g., "06:00"
  upCount: number;         // Number of UP candles
  downCount: number;       // Number of DOWN candles
  ignoredCount: number;    // Number of ignored (noise) candles
  totalCount: number;      // Total candles processed
  dominance: number;       // Dominance percentage (0-100)
  bias: 'UP' | 'DOWN' | 'NEUTRAL';  // Dominant direction
}

export interface AnalysisResult {
  totalUp: number;
  totalDown: number;
  totalIgnored: number;
  timeSlots: TimeSlotStats[];
  top5TimeSlots: TimeSlotStats[];
  availableYears: number[];
}

export interface AnalysisFilters {
  year?: number;              // Selected year (undefined = all years)
  selectedDays: number[];     // Day indices (0=Sun, 1=Mon, ..., 6=Sat)
  timeRangeStart: string;     // Start time (e.g., "06:00")
  timeRangeEnd: string;       // End time (e.g., "23:45")
  noiseThreshold: number;     // Decimal threshold (e.g., 0.02 = 2%)
}

/**
 * Calculate percentage change between open and close
 *
 * @param open - Opening price
 * @param close - Closing price
 * @returns Percentage change (absolute value)
 */
function calculatePercentChange(open: number, close: number): number {
  if (open === 0) return 0;
  return Math.abs((close - open) / open);
}

/**
 * Classify candle as UP, DOWN, or IGNORED
 *
 * @param row - OHLC row
 * @param noiseThreshold - Noise threshold (e.g., 0.02)
 * @returns Classification
 */
function classifyCandle(row: OHLCRow, noiseThreshold: number): 'UP' | 'DOWN' | 'IGNORED' {
  const percentChange = calculatePercentChange(row.open, row.close);

  // Check if change is below noise threshold
  if (percentChange < noiseThreshold) {
    return 'IGNORED';
  }

  // Determine direction
  if (row.close > row.open) {
    return 'UP';
  } else if (row.close < row.open) {
    return 'DOWN';
  } else {
    return 'IGNORED';
  }
}

/**
 * Calculate dominance percentage for a time slot
 *
 * @param upCount - Number of UP candles
 * @param downCount - Number of DOWN candles
 * @returns Dominance percentage (0-100)
 */
function calculateDominance(upCount: number, downCount: number): number {
  const total = upCount + downCount;
  if (total === 0) return 0;

  const maxCount = Math.max(upCount, downCount);
  return (maxCount / total) * 100;
}

/**
 * Determine bias from UP and DOWN counts
 *
 * @param upCount - Number of UP candles
 * @param downCount - Number of DOWN candles
 * @returns Bias direction
 */
function determineBias(upCount: number, downCount: number): 'UP' | 'DOWN' | 'NEUTRAL' {
  if (upCount > downCount) return 'UP';
  if (downCount > upCount) return 'DOWN';
  return 'NEUTRAL';
}

/**
 * Aggregate OHLC data by time slots with filtering
 *
 * @param rows - Array of OHLC rows
 * @param filters - Analysis filters
 * @returns Analysis result
 */
export function aggregateData(rows: OHLCRow[], filters: AnalysisFilters): AnalysisResult {
  // Map to track time slot statistics
  const timeSlotMap = new Map<string, {
    up: number;
    down: number;
    ignored: number;
  }>();

  // Track available years
  const yearsSet = new Set<number>();

  // Global counters
  let totalUp = 0;
  let totalDown = 0;
  let totalIgnored = 0;

  // Process each row
  for (const row of rows) {
    // Convert UTC timestamp to Toronto time
    const torontoDate = utcToToronto(row.timestamp);
    const year = getTorontoYear(torontoDate);
    const dayOfWeek = getTorontoDayOfWeek(torontoDate);
    const timeSlot = formatTimeSlot(torontoDate);

    // Track available years
    yearsSet.add(year);

    // Apply year filter
    if (filters.year !== undefined && year !== filters.year) {
      continue;
    }

    // Apply day of week filter
    if (!filters.selectedDays.includes(dayOfWeek)) {
      continue;
    }

    // Apply time range filter
    if (!isTimeInRange(timeSlot, filters.timeRangeStart, filters.timeRangeEnd)) {
      continue;
    }

    // Classify candle
    const classification = classifyCandle(row, filters.noiseThreshold);

    // Initialize time slot if needed
    if (!timeSlotMap.has(timeSlot)) {
      timeSlotMap.set(timeSlot, { up: 0, down: 0, ignored: 0 });
    }

    const stats = timeSlotMap.get(timeSlot)!;

    // Update counts
    if (classification === 'UP') {
      stats.up++;
      totalUp++;
    } else if (classification === 'DOWN') {
      stats.down++;
      totalDown++;
    } else {
      stats.ignored++;
      totalIgnored++;
    }
  }

  // Convert map to array of TimeSlotStats
  const timeSlots: TimeSlotStats[] = [];

  for (const [timeSlot, stats] of timeSlotMap.entries()) {
    const dominance = calculateDominance(stats.up, stats.down);
    const bias = determineBias(stats.up, stats.down);

    timeSlots.push({
      timeSlot,
      upCount: stats.up,
      downCount: stats.down,
      ignoredCount: stats.ignored,
      totalCount: stats.up + stats.down + stats.ignored,
      dominance,
      bias
    });
  }

  // Sort by time slot
  timeSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  // Get top 5 time slots by dominance
  const top5TimeSlots = [...timeSlots]
    .sort((a, b) => b.dominance - a.dominance)
    .slice(0, 5);

  return {
    totalUp,
    totalDown,
    totalIgnored,
    timeSlots,
    top5TimeSlots,
    availableYears: Array.from(yearsSet).sort()
  };
}
