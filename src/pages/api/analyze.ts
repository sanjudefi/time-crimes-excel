/**
 * Vercel API Route: /api/analyze
 * Analyzes OHLC data from /source directory
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, parseXLSX, fileExists, getSourceFilePath } from '../../utils/parser';
import { aggregateData, AnalysisFilters, AnalysisResult } from '../../utils/aggregator';
import { buildDaySignatures, calculatePairwisePatterns, PatternRelationship, PatternAnalysisConfig } from '../../utils/patternAnalysis';
import { generateTodayAnalysis, TodayAnalysis, TodayModeConfig } from '../../utils/todayMode';
import { calculateSMA50, aggregateSMAByTimeSlot, SMAAnalysisResult } from '../../utils/smaAnalysis';
import { utcToToronto } from '../../utils/timezone';

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
  enableSMA?: boolean;
  patternMinSampleSize?: number;
  patternMinConfidence?: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

interface ExtendedAnalysisResult extends AnalysisResult {
  patterns?: PatternRelationship[];
  todayAnalysis?: TodayAnalysis;
  smaAnalysis?: SMAAnalysisResult;
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
      enableSMA = false,
      patternMinSampleSize = 30,
      patternMinConfidence = 60
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

    // SMA Analysis (if enabled)
    if (enableSMA) {
      // Calculate SMA 50 for all candles
      const candlesWithSMA = calculateSMA50(rows);

      // Aggregate by time slot for the selected year
      const smaAnalysis = aggregateSMAByTimeSlot(candlesWithSMA, year);

      extendedResult.smaAnalysis = smaAnalysis;
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
