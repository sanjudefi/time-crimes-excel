/**
 * Historical Anniversary Analysis
 *
 * Compares what happened on the same date/week/month across multiple years.
 * Helps identify seasonal patterns and historical price behavior.
 *
 * Example: Compare December 20th across 2024, 2023, 2022, 2021, 2020
 * - What were the high/low prices?
 * - Was it bullish or bearish?
 * - How volatile was the period?
 */

import { utcToToronto } from './timezone';
import { OHLCRow } from './patternAnalysis';

export type ComparisonType = 'DATE' | 'WEEK' | 'MONTH' | 'CUSTOM_RANGE';
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

/**
 * Statistics for a specific historical period
 */
export interface HistoricalPeriodStats {
  year: number;
  period: string;           // "2024-12-20" or "2024-W51" or "2024-12"
  periodLabel: string;      // "December 20, 2024" or "Week 51, 2024"
  highPrice: number;
  lowPrice: number;
  openPrice: number;        // First candle open
  closePrice: number;       // Last candle close
  priceChange: number;      // close - open
  priceChangePercent: number;
  trend: TrendDirection;
  volatility: number;       // (high - low) / low * 100
  candleCount: number;
  dateRange: {
    start: string;          // YYYY-MM-DD
    end: string;            // YYYY-MM-DD
  };
}

/**
 * Complete historical comparison result
 */
export interface HistoricalComparisonResult {
  comparisonType: ComparisonType;
  targetPeriod: string;     // "12-20" or "W51" or "12"
  targetLabel: string;      // "December 20" or "Week 51" or "December"
  historicalData: HistoricalPeriodStats[];
  summary: {
    averageHigh: number;
    averageLow: number;
    averageChange: number;
    averageChangePercent: number;
    bullishYears: number;
    bearishYears: number;
    neutralYears: number;
    averageTrend: TrendDirection;
    highestYear: number;
    lowestYear: number;
    mostVolatileYear: number;
  };
}

/**
 * Get week number for a date
 * ISO week date system (week starts on Monday)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get month name from month number (0-11)
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Analyze historical data for a specific date across multiple years
 *
 * Example: Compare December 20th across 2024, 2023, 2022, 2021, 2020
 */
export function analyzeSameDateAcrossYears(
  rows: OHLCRow[],
  targetMonth: number,  // 0-11 (0=January, 11=December)
  targetDay: number,    // 1-31
  yearsToCompare: number = 5
): HistoricalComparisonResult {
  // Group candles by year-month-day
  const dateMap = new Map<string, OHLCRow[]>();

  for (const row of rows) {
    const torontoDate = utcToToronto(row.timestamp);
    const month = torontoDate.getMonth();
    const day = torontoDate.getDate();

    // Only process candles matching the target month and day
    if (month === targetMonth && day === targetDay) {
      const year = torontoDate.getFullYear();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(row);
    }
  }

  // Calculate stats for each year
  const historicalData: HistoricalPeriodStats[] = [];

  for (const [dateKey, candles] of dateMap.entries()) {
    if (candles.length === 0) continue;

    const year = parseInt(dateKey.split('-')[0]);
    const stats = calculatePeriodStats(candles, dateKey, year);
    stats.periodLabel = `${getMonthName(targetMonth)} ${targetDay}, ${year}`;
    historicalData.push(stats);
  }

  // Sort by year descending (most recent first)
  historicalData.sort((a, b) => b.year - a.year);

  // Limit to specified number of years
  const limitedData = historicalData.slice(0, yearsToCompare);

  // Calculate summary
  const summary = calculateSummary(limitedData);

  return {
    comparisonType: 'DATE',
    targetPeriod: `${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`,
    targetLabel: `${getMonthName(targetMonth)} ${targetDay}`,
    historicalData: limitedData,
    summary
  };
}

/**
 * Analyze historical data for a specific week across multiple years
 */
export function analyzeSameWeekAcrossYears(
  rows: OHLCRow[],
  targetWeek: number,
  yearsToCompare: number = 5
): HistoricalComparisonResult {
  const weekMap = new Map<string, OHLCRow[]>();

  for (const row of rows) {
    const torontoDate = utcToToronto(row.timestamp);
    const week = getWeekNumber(torontoDate);

    if (week === targetWeek) {
      const year = torontoDate.getFullYear();
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`;

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      weekMap.get(weekKey)!.push(row);
    }
  }

  const historicalData: HistoricalPeriodStats[] = [];

  for (const [weekKey, candles] of weekMap.entries()) {
    if (candles.length === 0) continue;

    const year = parseInt(weekKey.split('-')[0]);
    const stats = calculatePeriodStats(candles, weekKey, year);
    stats.periodLabel = `Week ${targetWeek}, ${year}`;
    historicalData.push(stats);
  }

  historicalData.sort((a, b) => b.year - a.year);
  const limitedData = historicalData.slice(0, yearsToCompare);
  const summary = calculateSummary(limitedData);

  return {
    comparisonType: 'WEEK',
    targetPeriod: `W${String(targetWeek).padStart(2, '0')}`,
    targetLabel: `Week ${targetWeek}`,
    historicalData: limitedData,
    summary
  };
}

/**
 * Analyze historical data for a specific month across multiple years
 */
export function analyzeSameMonthAcrossYears(
  rows: OHLCRow[],
  targetMonth: number,  // 0-11
  yearsToCompare: number = 5
): HistoricalComparisonResult {
  const monthMap = new Map<string, OHLCRow[]>();

  for (const row of rows) {
    const torontoDate = utcToToronto(row.timestamp);
    const month = torontoDate.getMonth();

    if (month === targetMonth) {
      const year = torontoDate.getFullYear();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      monthMap.get(monthKey)!.push(row);
    }
  }

  const historicalData: HistoricalPeriodStats[] = [];

  for (const [monthKey, candles] of monthMap.entries()) {
    if (candles.length === 0) continue;

    const year = parseInt(monthKey.split('-')[0]);
    const stats = calculatePeriodStats(candles, monthKey, year);
    stats.periodLabel = `${getMonthName(targetMonth)} ${year}`;
    historicalData.push(stats);
  }

  historicalData.sort((a, b) => b.year - a.year);
  const limitedData = historicalData.slice(0, yearsToCompare);
  const summary = calculateSummary(limitedData);

  return {
    comparisonType: 'MONTH',
    targetPeriod: String(targetMonth + 1).padStart(2, '0'),
    targetLabel: getMonthName(targetMonth),
    historicalData: limitedData,
    summary
  };
}

/**
 * Calculate statistics for a period (day/week/month)
 */
function calculatePeriodStats(
  candles: OHLCRow[],
  periodKey: string,
  year: number
): HistoricalPeriodStats {
  if (candles.length === 0) {
    throw new Error('No candles provided for period stats calculation');
  }

  // Sort candles by timestamp
  const sortedCandles = [...candles].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate high, low, open, close
  let highPrice = -Infinity;
  let lowPrice = Infinity;

  for (const candle of sortedCandles) {
    if (candle.high > highPrice) highPrice = candle.high;
    if (candle.low < lowPrice) lowPrice = candle.low;
  }

  const openPrice = sortedCandles[0].open;
  const closePrice = sortedCandles[sortedCandles.length - 1].close;
  const priceChange = closePrice - openPrice;
  const priceChangePercent = (priceChange / openPrice) * 100;

  // Determine trend
  let trend: TrendDirection;
  if (priceChangePercent > 1) {
    trend = 'BULLISH';
  } else if (priceChangePercent < -1) {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  // Calculate volatility
  const volatility = ((highPrice - lowPrice) / lowPrice) * 100;

  // Get date range
  const firstDate = utcToToronto(sortedCandles[0].timestamp);
  const lastDate = utcToToronto(sortedCandles[sortedCandles.length - 1].timestamp);

  return {
    year,
    period: periodKey,
    periodLabel: periodKey, // Will be overridden by caller
    highPrice: Math.round(highPrice * 100) / 100,
    lowPrice: Math.round(lowPrice * 100) / 100,
    openPrice: Math.round(openPrice * 100) / 100,
    closePrice: Math.round(closePrice * 100) / 100,
    priceChange: Math.round(priceChange * 100) / 100,
    priceChangePercent: Math.round(priceChangePercent * 100) / 100,
    trend,
    volatility: Math.round(volatility * 100) / 100,
    candleCount: sortedCandles.length,
    dateRange: {
      start: firstDate.toISOString().split('T')[0],
      end: lastDate.toISOString().split('T')[0]
    }
  };
}

/**
 * Calculate summary statistics across all historical periods
 */
function calculateSummary(data: HistoricalPeriodStats[]): HistoricalComparisonResult['summary'] {
  if (data.length === 0) {
    return {
      averageHigh: 0,
      averageLow: 0,
      averageChange: 0,
      averageChangePercent: 0,
      bullishYears: 0,
      bearishYears: 0,
      neutralYears: 0,
      averageTrend: 'NEUTRAL',
      highestYear: 0,
      lowestYear: 0,
      mostVolatileYear: 0
    };
  }

  const totalHigh = data.reduce((sum, d) => sum + d.highPrice, 0);
  const totalLow = data.reduce((sum, d) => sum + d.lowPrice, 0);
  const totalChange = data.reduce((sum, d) => sum + d.priceChange, 0);
  const totalChangePercent = data.reduce((sum, d) => sum + d.priceChangePercent, 0);

  const bullishYears = data.filter(d => d.trend === 'BULLISH').length;
  const bearishYears = data.filter(d => d.trend === 'BEARISH').length;
  const neutralYears = data.filter(d => d.trend === 'NEUTRAL').length;

  let averageTrend: TrendDirection;
  if (bullishYears > bearishYears && bullishYears > neutralYears) {
    averageTrend = 'BULLISH';
  } else if (bearishYears > bullishYears && bearishYears > neutralYears) {
    averageTrend = 'BEARISH';
  } else {
    averageTrend = 'NEUTRAL';
  }

  // Find highest, lowest, and most volatile years
  const highestEntry = data.reduce((max, d) => d.highPrice > max.highPrice ? d : max);
  const lowestEntry = data.reduce((min, d) => d.lowPrice < min.lowPrice ? d : min);
  const mostVolatileEntry = data.reduce((max, d) => d.volatility > max.volatility ? d : max);

  return {
    averageHigh: Math.round((totalHigh / data.length) * 100) / 100,
    averageLow: Math.round((totalLow / data.length) * 100) / 100,
    averageChange: Math.round((totalChange / data.length) * 100) / 100,
    averageChangePercent: Math.round((totalChangePercent / data.length) * 100) / 100,
    bullishYears,
    bearishYears,
    neutralYears,
    averageTrend,
    highestYear: highestEntry.year,
    lowestYear: lowestEntry.year,
    mostVolatileYear: mostVolatileEntry.year
  };
}

/**
 * Get current date information for UI (Toronto time)
 */
export function getCurrentDateInfo(): {
  month: number;
  day: number;
  week: number;
  monthName: string;
} {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const week = getWeekNumber(now);
  const monthName = getMonthName(month);

  return { month, day, week, monthName };
}
