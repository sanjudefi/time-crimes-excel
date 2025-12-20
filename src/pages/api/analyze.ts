/**
 * Vercel API Route: /api/analyze
 * Analyzes OHLC data from /source directory
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, parseXLSX, fileExists, getSourceFilePath } from '../../utils/parser';
import { aggregateData, AnalysisFilters, AnalysisResult } from '../../utils/aggregator';
import { buildDaySignatures, calculatePairwisePatterns, PatternRelationship, PatternAnalysisConfig } from '../../utils/patternAnalysis';
import { generateTodayAnalysis, TodayAnalysis, TodayModeConfig } from '../../utils/todayMode';
import { analyzeSameDateAcrossYears, analyzeSameWeekAcrossYears, analyzeSameMonthAcrossYears, HistoricalComparisonResult, ComparisonType, getCurrentDateInfo } from '../../utils/historicalComparison';
import { utcToToronto } from '../../utils/timezone';

interface PriceLookupData {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface AnalyzeRequest {
  filename: string;
  year?: number;
  dateStart?: string;
  dateEnd?: string;
  interval: number;
  selectedDays: number[];
  timeRangeStart: string;
  timeRangeEnd: string;
  noiseThreshold: number;
  enablePatterns?: boolean;
  enableTodayMode?: boolean;
  enableHistoricalComparison?: boolean;
  historicalComparisonType?: ComparisonType;
  historicalTargetMonth?: number;
  historicalTargetDay?: number;
  historicalTargetWeek?: number;
  patternMinSampleSize?: number;
  patternMinConfidence?: number;
  enablePriceLookup?: boolean;
  priceLookupDate?: string;  // Format: YYYY-MM-DD
  priceLookupTime?: string;  // Format: HH:MM
  enableTradeSimulator?: boolean;
  simulatorDays?: number[];
  simulatorEntryTime?: string;  // Format: HH:MM
  simulatorExitTime?: string;   // Format: HH:MM
  simulatorDirection?: 'LONG' | 'SHORT';
  simulatorStopLoss?: number;   // Percentage
  simulatorTakeProfit?: number; // Percentage
  simulatorStartDate?: string;  // Format: YYYY-MM-DD
  simulatorEndDate?: string;    // Format: YYYY-MM-DD
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface TradeSimulationResult {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  totalProfitLossPercent: number;
  trades: Array<{
    date: string;
    entryPrice: number;
    exitPrice: number;
    resultPercent: number;
    outcome: 'WIN' | 'LOSS' | 'STOPPED' | 'NEUTRAL';
  }>;
}

interface ExtendedAnalysisResult extends AnalysisResult {
  patterns?: PatternRelationship[];
  todayAnalysis?: TodayAnalysis;
  historicalComparison?: HistoricalComparisonResult;
  priceLookup?: PriceLookupData;
  tradeSimulation?: TradeSimulationResult;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedAnalysisResult | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      filename,
      year,
      dateStart,
      dateEnd,
      interval,
      selectedDays,
      timeRangeStart,
      timeRangeEnd,
      noiseThreshold,
      enablePatterns = false,
      enableTodayMode = false,
      enableHistoricalComparison = false,
      historicalComparisonType = 'DATE',
      historicalTargetMonth,
      historicalTargetDay,
      historicalTargetWeek,
      patternMinSampleSize = 30,
      patternMinConfidence = 60,
      enablePriceLookup = false,
      priceLookupDate,
      priceLookupTime,
      enableTradeSimulator = false,
      simulatorDays = [0, 1, 2, 3, 4, 5, 6],
      simulatorEntryTime = '09:30',
      simulatorExitTime = '16:00',
      simulatorDirection = 'LONG',
      simulatorStopLoss = 2,
      simulatorTakeProfit = 5,
      simulatorStartDate,
      simulatorEndDate
    } = req.body as AnalyzeRequest;

    // Validate required fields
    if (!filename) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'filename is required'
      });
    }

    if (!interval || ![15, 30, 45, 60, 120, 240].includes(interval)) {
      return res.status(400).json({
        error: 'Invalid field',
        details: 'interval must be one of: 15, 30, 45, 60, 120, 240 minutes'
      });
    }

    if (!selectedDays || selectedDays.length === 0) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'selectedDays is required and must not be empty'
      });
    }

    if (!timeRangeStart || !timeRangeEnd) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'timeRangeStart and timeRangeEnd are required'
      });
    }

    if (noiseThreshold === undefined || noiseThreshold < 0) {
      return res.status(400).json({
        error: 'Invalid field',
        details: 'noiseThreshold must be a positive number'
      });
    }

    // Security: Prevent path traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        error: 'Invalid filename',
        details: 'Filename cannot contain path separators or parent directory references'
      });
    }

    // Check if file exists
    if (!fileExists(filename)) {
      return res.status(404).json({
        error: 'File not found',
        details: `File "${filename}" does not exist in /source directory`
      });
    }

    // Get file path
    const filePath = getSourceFilePath(filename);

    // Parse file based on extension
    let rows;
    const extension = filename.toLowerCase().split('.').pop();

    if (extension === 'csv') {
      rows = parseCSV(filePath);
    } else if (extension === 'xlsx') {
      rows = parseXLSX(filePath);
    } else {
      return res.status(400).json({
        error: 'Unsupported file format',
        details: 'Only .csv and .xlsx files are supported'
      });
    }

    // Check if we got any valid rows
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        error: 'No valid data',
        details: 'File contains no valid OHLC data'
      });
    }

    // Create filters object
    const filters: AnalysisFilters = {
      year,
      dateStart,
      dateEnd,
      interval,
      selectedDays,
      timeRangeStart,
      timeRangeEnd,
      noiseThreshold
    };

    // Aggregate data
    const result = aggregateData(rows, filters);

    // Prepare extended result
    const extendedResult: ExtendedAnalysisResult = { ...result };

    // Pattern Analysis (if enabled)
    if (enablePatterns) {
      const patternConfig: PatternAnalysisConfig = {
        minSampleSize: patternMinSampleSize,
        minConfidence: patternMinConfidence,
        noiseThreshold
      };

      // Build day signatures from all data
      const daySignatures = buildDaySignatures(rows, noiseThreshold);

      // Calculate pairwise patterns
      const patterns = calculatePairwisePatterns(daySignatures, patternConfig);

      extendedResult.patterns = patterns;
    }

    // Today Mode Analysis (if enabled)
    if (enableTodayMode) {
      const todayConfig: TodayModeConfig = {
        strongBiasThreshold: 65,
        weakBiasThreshold: 55,
        currentTime: new Date() // Server time in Toronto timezone
      };

      // Get patterns (either from above or recalculate if patterns not enabled)
      let patterns: PatternRelationship[] = [];
      if (extendedResult.patterns) {
        patterns = extendedResult.patterns;
      } else {
        // Recalculate patterns for today mode
        const patternConfig: PatternAnalysisConfig = {
          minSampleSize: patternMinSampleSize,
          minConfidence: patternMinConfidence,
          noiseThreshold
        };
        const daySignatures = buildDaySignatures(rows, noiseThreshold);
        patterns = calculatePairwisePatterns(daySignatures, patternConfig);
      }

      // Generate today analysis
      const todayAnalysis = generateTodayAnalysis(
        rows,
        patterns,
        noiseThreshold,
        todayConfig
      );

      extendedResult.todayAnalysis = todayAnalysis;
    }

    // Historical Comparison (if enabled)
    if (enableHistoricalComparison) {
      let historicalComparison: HistoricalComparisonResult;

      if (historicalComparisonType === 'DATE') {
        // Use provided date or current date
        const currentInfo = getCurrentDateInfo();
        const targetMonth = historicalTargetMonth !== undefined ? historicalTargetMonth : currentInfo.month;
        const targetDay = historicalTargetDay !== undefined ? historicalTargetDay : currentInfo.day;

        historicalComparison = analyzeSameDateAcrossYears(rows, targetMonth, targetDay, 5);
      } else if (historicalComparisonType === 'WEEK') {
        // Use provided week or current week
        const currentInfo = getCurrentDateInfo();
        const targetWeek = historicalTargetWeek !== undefined ? historicalTargetWeek : currentInfo.week;

        historicalComparison = analyzeSameWeekAcrossYears(rows, targetWeek, 5);
      } else if (historicalComparisonType === 'MONTH') {
        // Use provided month or current month
        const currentInfo = getCurrentDateInfo();
        const targetMonth = historicalTargetMonth !== undefined ? historicalTargetMonth : currentInfo.month;

        historicalComparison = analyzeSameMonthAcrossYears(rows, targetMonth, 5);
      } else {
        // Default to DATE comparison
        const currentInfo = getCurrentDateInfo();
        historicalComparison = analyzeSameDateAcrossYears(rows, currentInfo.month, currentInfo.day, 5);
      }

      extendedResult.historicalComparison = historicalComparison;
    }

    // Price Lookup (if enabled)
    if (enablePriceLookup && priceLookupDate && priceLookupTime) {
      // Find the candle that matches the specified date and time
      const matchingCandle = rows.find(row => {
        const torontoDate = utcToToronto(row.timestamp);
        const date = torontoDate.toISOString().split('T')[0];
        const time = torontoDate.toTimeString().slice(0, 5);

        return date === priceLookupDate && time === priceLookupTime;
      });

      if (matchingCandle) {
        const torontoDate = utcToToronto(matchingCandle.timestamp);
        const date = torontoDate.toISOString().split('T')[0];
        const time = torontoDate.toTimeString().slice(0, 8); // HH:MM:SS

        extendedResult.priceLookup = {
          openTime: `${date} ${time}`,
          open: matchingCandle.open,
          high: matchingCandle.high,
          low: matchingCandle.low,
          close: matchingCandle.close,
          volume: matchingCandle.volume
        };
      }
    }

    // Trade Setup Simulator (if enabled)
    if (enableTradeSimulator && simulatorStartDate && simulatorEndDate) {
      const trades: TradeSimulationResult['trades'] = [];
      let totalProfitLoss = 0;
      let winCount = 0;
      let lossCount = 0;

      // Group candles by date
      const candlesByDate: { [key: string]: typeof rows } = {};

      rows.forEach(row => {
        const torontoDate = utcToToronto(row.timestamp);
        const date = torontoDate.toISOString().split('T')[0];
        const dayOfWeek = torontoDate.getDay();

        // Check if date is within simulator range and day is selected
        if (date >= simulatorStartDate && date <= simulatorEndDate && simulatorDays.includes(dayOfWeek)) {
          if (!candlesByDate[date]) {
            candlesByDate[date] = [];
          }
          candlesByDate[date].push(row);
        }
      });

      // Process each trading day
      Object.entries(candlesByDate).forEach(([date, dayCandles]) => {
        // Find entry candle
        const entryCandle = dayCandles.find(row => {
          const torontoDate = utcToToronto(row.timestamp);
          const time = torontoDate.toTimeString().slice(0, 5);
          return time === simulatorEntryTime;
        });

        if (!entryCandle) return;

        const entryPrice = entryCandle.close;
        let exitPrice = entryPrice;
        let outcome: 'WIN' | 'LOSS' | 'STOPPED' | 'NEUTRAL' = 'NEUTRAL';
        let hitStopLoss = false;
        let hitTakeProfit = false;

        // Calculate stop loss and take profit prices
        const stopLossPrice = simulatorDirection === 'LONG'
          ? entryPrice * (1 - simulatorStopLoss / 100)
          : entryPrice * (1 + simulatorStopLoss / 100);

        const takeProfitPrice = simulatorDirection === 'LONG'
          ? entryPrice * (1 + simulatorTakeProfit / 100)
          : entryPrice * (1 - simulatorTakeProfit / 100);

        // Find candles after entry time
        const entryIndex = dayCandles.indexOf(entryCandle);
        const candlesAfterEntry = dayCandles.slice(entryIndex + 1);

        // Check each candle for stop loss or take profit
        for (const candle of candlesAfterEntry) {
          const torontoDate = utcToToronto(candle.timestamp);
          const time = torontoDate.toTimeString().slice(0, 5);

          // Check if we've reached exit time
          if (time === simulatorExitTime) {
            exitPrice = candle.close;
            break;
          }

          // Check stop loss and take profit during the candle
          if (simulatorDirection === 'LONG') {
            // For LONG: check if low hit stop loss or high hit take profit
            if (candle.low <= stopLossPrice && !hitTakeProfit) {
              exitPrice = stopLossPrice;
              hitStopLoss = true;
              break;
            }
            if (candle.high >= takeProfitPrice && !hitStopLoss) {
              exitPrice = takeProfitPrice;
              hitTakeProfit = true;
              break;
            }
          } else {
            // For SHORT: check if high hit stop loss or low hit take profit
            if (candle.high >= stopLossPrice && !hitTakeProfit) {
              exitPrice = stopLossPrice;
              hitStopLoss = true;
              break;
            }
            if (candle.low <= takeProfitPrice && !hitStopLoss) {
              exitPrice = takeProfitPrice;
              hitTakeProfit = true;
              break;
            }
          }

          // If we passed exit time, use previous candle's close
          if (time > simulatorExitTime) {
            break;
          }
        }

        // Calculate result
        const resultPercent = simulatorDirection === 'LONG'
          ? ((exitPrice - entryPrice) / entryPrice) * 100
          : ((entryPrice - exitPrice) / entryPrice) * 100;

        // Determine outcome
        if (hitStopLoss) {
          outcome = 'STOPPED';
          lossCount++;
        } else if (hitTakeProfit) {
          outcome = 'WIN';
          winCount++;
        } else if (resultPercent > 0.1) {
          outcome = 'WIN';
          winCount++;
        } else if (resultPercent < -0.1) {
          outcome = 'LOSS';
          lossCount++;
        } else {
          outcome = 'NEUTRAL';
        }

        totalProfitLoss += resultPercent;

        trades.push({
          date,
          entryPrice,
          exitPrice,
          resultPercent,
          outcome
        });
      });

      extendedResult.tradeSimulation = {
        totalTrades: trades.length,
        winCount,
        lossCount,
        totalProfitLossPercent: totalProfitLoss,
        trades: trades.sort((a, b) => b.date.localeCompare(a.date)) // Sort by date descending
      };
    }

    // Return result
    return res.status(200).json(extendedResult);

  } catch (error) {
    console.error('Analysis error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Increase API route timeout for large files (Vercel Pro allows up to 60s)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};
