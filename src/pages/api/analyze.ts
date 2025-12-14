/**
 * Vercel API Route: /api/analyze
 * Analyzes OHLC data from /source directory
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, parseXLSX, fileExists, getSourceFilePath } from '../../utils/parser';
import { aggregateData, AnalysisFilters, AnalysisResult } from '../../utils/aggregator';

interface AnalyzeRequest {
  filename: string;
  year?: number;
  selectedDays: number[];
  timeRangeStart: string;
  timeRangeEnd: string;
  noiseThreshold: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResult | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      filename,
      year,
      selectedDays,
      timeRangeStart,
      timeRangeEnd,
      noiseThreshold
    } = req.body as AnalyzeRequest;

    // Validate required fields
    if (!filename) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'filename is required'
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
      selectedDays,
      timeRangeStart,
      timeRangeEnd,
      noiseThreshold
    };

    // Aggregate data
    const result = aggregateData(rows, filters);

    // Return result
    return res.status(200).json(result);

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
