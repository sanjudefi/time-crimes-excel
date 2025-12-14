/**
 * Vercel API Route: /api/preview
 * Shows preview of first few rows from a data file
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { parseCSV, parseXLSX, fileExists, getSourceFilePath } from '../../utils/parser';

interface PreviewResponse {
  filename: string;
  rowCount: number;
  previewRows: any[];
  columns: string[];
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreviewResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename } = req.body;

    // Validate required fields
    if (!filename) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'filename is required'
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

    // Get first 10 rows for preview
    const previewRows = rows.slice(0, 10);

    // Extract column names from first row
    const columns = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];

    // Return preview
    return res.status(200).json({
      filename,
      rowCount: rows.length,
      previewRows,
      columns
    });

  } catch (error) {
    console.error('Preview error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
