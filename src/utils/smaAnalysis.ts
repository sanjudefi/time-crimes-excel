/**
 * SMA Trend Context Analysis
 *
 * Calculates SMA 50 on 15-minute candles and tracks price position
 * relative to the SMA for each time slot.
 *
 * Purpose:
 * - Identify time slots where price tends to be ABOVE SMA (bullish context)
 * - Identify time slots where price tends to be BELOW SMA (bearish context)
 * - Filter trade signals based on SMA trend alignment
 */

import { utcToToronto } from './timezone';

/**
 * OHLC Row interface (matches parser output)
 */
export interface OHLCRow {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * SMA position classification
 */
export type SMAPosition = 'ABOVE_SMA' | 'BELOW_SMA' | 'NO_SMA';

/**
 * Candle with SMA information
 */
export interface CandleWithSMA {
  timestamp: string;
  torontoDate: Date;
  close: number;
  sma50?: number;
  position: SMAPosition;
}

/**
 * SMA statistics for a specific time slot
 */
export interface SMATimeSlotStats {
  timeSlot: string;           // "06:30"
  totalCount: number;         // Total candles in this slot
  aboveSMACount: number;      // Candles where close > SMA
  belowSMACount: number;      // Candles where close < SMA
  aboveSMAPercent: number;    // % above SMA
  belowSMAPercent: number;    // % below SMA
  dominantTrend: 'ABOVE' | 'BELOW' | 'NEUTRAL';
}

/**
 * Complete SMA analysis result
 */
export interface SMAAnalysisResult {
  year?: number;              // Year analyzed (or undefined for all years)
  timeSlots: SMATimeSlotStats[];
  totalCandles: number;
  candlesWithSMA: number;
  candlesWithoutSMA: number;
}

/**
 * Calculate SMA 50 for all candles
 *
 * SMA 50 = Simple Moving Average of the last 50 close prices
 *
 * For each candle:
 * - Look back at previous 49 candles + current candle
 * - Calculate average of 50 closes
 * - If < 50 candles available, SMA is undefined
 *
 * @param rows - OHLC data (must be sorted by timestamp ascending)
 * @returns Array of candles with SMA information
 */
export function calculateSMA50(rows: OHLCRow[]): CandleWithSMA[] {
  const candlesWithSMA: CandleWithSMA[] = [];
  const SMA_PERIOD = 50;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const torontoDate = utcToToronto(row.timestamp);

    // Calculate SMA 50 if we have enough historical data
    let sma50: number | undefined = undefined;
    let position: SMAPosition = 'NO_SMA';

    if (i >= SMA_PERIOD - 1) {
      // We have at least 50 candles (including current)
      let sum = 0;
      for (let j = i - SMA_PERIOD + 1; j <= i; j++) {
        sum += rows[j].close;
      }
      sma50 = sum / SMA_PERIOD;

      // Classify position
      if (row.close > sma50) {
        position = 'ABOVE_SMA';
      } else if (row.close < sma50) {
        position = 'BELOW_SMA';
      } else {
        // Extremely rare case where close exactly equals SMA
        position = 'ABOVE_SMA'; // Default to above in this edge case
      }
    }

    candlesWithSMA.push({
      timestamp: row.timestamp,
      torontoDate,
      close: row.close,
      sma50,
      position
    });
  }

  return candlesWithSMA;
}

/**
 * Aggregate SMA statistics by time slot for a specific year
 *
 * For each 15-minute time slot (e.g., "06:30", "14:45"):
 * - Count how many times close was ABOVE SMA 50
 * - Count how many times close was BELOW SMA 50
 * - Calculate percentages
 * - Determine dominant trend
 *
 * @param candlesWithSMA - Candles with SMA information
 * @param year - Year to filter (or undefined for all years)
 * @returns SMA analysis result
 */
export function aggregateSMAByTimeSlot(
  candlesWithSMA: CandleWithSMA[],
  year?: number
): SMAAnalysisResult {
  // Map: timeSlot -> { above: count, below: count }
  const timeSlotMap = new Map<string, { above: number; below: number }>();

  let totalCandles = 0;
  let candlesWithSMACount = 0;
  let candlesWithoutSMACount = 0;

  for (const candle of candlesWithSMA) {
    // Filter by year if specified
    if (year !== undefined) {
      const candleYear = candle.torontoDate.getFullYear();
      if (candleYear !== year) {
        continue;
      }
    }

    totalCandles++;

    // Skip candles without SMA (first 49 candles)
    if (candle.position === 'NO_SMA') {
      candlesWithoutSMACount++;
      continue;
    }

    candlesWithSMACount++;

    // Get time slot (HH:MM)
    const timeSlot = candle.torontoDate.toTimeString().slice(0, 5);

    // Initialize time slot if not exists
    if (!timeSlotMap.has(timeSlot)) {
      timeSlotMap.set(timeSlot, { above: 0, below: 0 });
    }

    const stats = timeSlotMap.get(timeSlot)!;

    // Increment counts
    if (candle.position === 'ABOVE_SMA') {
      stats.above++;
    } else if (candle.position === 'BELOW_SMA') {
      stats.below++;
    }
  }

  // Convert to array of SMATimeSlotStats
  const timeSlots: SMATimeSlotStats[] = [];

  for (const [timeSlot, stats] of timeSlotMap.entries()) {
    const total = stats.above + stats.below;
    const aboveSMAPercent = total > 0 ? (stats.above / total) * 100 : 0;
    const belowSMAPercent = total > 0 ? (stats.below / total) * 100 : 0;

    // Determine dominant trend (≥60% threshold)
    let dominantTrend: 'ABOVE' | 'BELOW' | 'NEUTRAL';
    if (aboveSMAPercent >= 60) {
      dominantTrend = 'ABOVE';
    } else if (belowSMAPercent >= 60) {
      dominantTrend = 'BELOW';
    } else {
      dominantTrend = 'NEUTRAL';
    }

    timeSlots.push({
      timeSlot,
      totalCount: total,
      aboveSMACount: stats.above,
      belowSMACount: stats.below,
      aboveSMAPercent: Math.round(aboveSMAPercent * 10) / 10,
      belowSMAPercent: Math.round(belowSMAPercent * 10) / 10,
      dominantTrend
    });
  }

  // Sort by time slot
  timeSlots.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return {
    year,
    timeSlots,
    totalCandles,
    candlesWithSMA: candlesWithSMACount,
    candlesWithoutSMA: candlesWithoutSMACount
  };
}

/**
 * Filter time slots based on SMA alignment
 *
 * Used to filter existing time dominance results to only show
 * slots that align with SMA trend.
 *
 * For LONG bias: Require ≥60% above SMA
 * For SHORT bias: Require ≥60% below SMA
 *
 * @param timeSlot - Time slot to check (e.g., "06:30")
 * @param bias - Expected bias ('UP' or 'DOWN')
 * @param smaStats - SMA analysis result
 * @param threshold - Minimum % required (default 60)
 * @returns true if slot passes SMA filter
 */
export function passesSMAFilter(
  timeSlot: string,
  bias: 'UP' | 'DOWN',
  smaStats: SMAAnalysisResult,
  threshold: number = 60
): boolean {
  // Find this time slot in SMA stats
  const slotStats = smaStats.timeSlots.find(s => s.timeSlot === timeSlot);

  if (!slotStats) {
    return false; // No SMA data for this slot
  }

  // Check alignment
  if (bias === 'UP') {
    // For LONG bias, require price above SMA
    return slotStats.aboveSMAPercent >= threshold;
  } else {
    // For SHORT bias, require price below SMA
    return slotStats.belowSMAPercent >= threshold;
  }
}

/**
 * Get SMA statistics for a specific time slot
 */
export function getSMAStatsForSlot(
  timeSlot: string,
  smaStats: SMAAnalysisResult
): SMATimeSlotStats | null {
  return smaStats.timeSlots.find(s => s.timeSlot === timeSlot) || null;
}
