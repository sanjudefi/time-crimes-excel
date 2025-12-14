/**
 * Data Parsing Utility
 * Stream parsing for CSV and XLSX files
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface OHLCRow {
  timestamp: string;  // UTC timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Parse CSV file and yield rows one by one
 * Memory-efficient streaming approach for large files
 *
 * @param filePath - Absolute path to CSV file
 * @yields OHLCRow objects
 */
export async function* parseCSV(filePath: string): AsyncGenerator<OHLCRow> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });

  let isFirstRow = true;

  return new Promise<AsyncGenerator<OHLCRow>>((resolve, reject) => {
    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: function(results: Papa.ParseStepResult<any>) {
        if (isFirstRow) {
          isFirstRow = false;
        }

        const row = results.data;

        // Extract and validate columns
        const timestamp = row['Open time'] || row['timestamp'] || row['Timestamp'];
        const open = parseFloat(row['Open'] || row['open']);
        const high = parseFloat(row['High'] || row['high']);
        const low = parseFloat(row['Low'] || row['low']);
        const close = parseFloat(row['Close'] || row['close']);
        const volume = row['Volume'] ? parseFloat(row['Volume']) : undefined;

        if (!timestamp || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
          return; // Skip invalid rows
        }

        return {
          timestamp,
          open,
          high,
          low,
          close,
          volume
        };
      },
      complete: function() {
        resolve();
      },
      error: function(error: Error) {
        reject(error);
      }
    });
  });
}

/**
 * Parse XLSX file synchronously
 * For XLSX, we read the entire file (acceptable for 28-30MB files)
 *
 * @param filePath - Absolute path to XLSX file
 * @returns Array of OHLCRow objects
 */
export function parseXLSX(filePath: string): OHLCRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  const rows: OHLCRow[] = [];

  for (const row of jsonData as any[]) {
    // Extract and validate columns (support multiple naming conventions)
    const timestamp = row['Open time'] || row['timestamp'] || row['Timestamp'];
    const open = parseFloat(row['Open'] || row['open']);
    const high = parseFloat(row['High'] || row['high']);
    const low = parseFloat(row['Low'] || row['low']);
    const close = parseFloat(row['Close'] || row['close']);
    const volume = row['Volume'] ? parseFloat(row['Volume']) : undefined;

    if (!timestamp || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
      continue; // Skip invalid rows
    }

    rows.push({
      timestamp: String(timestamp),
      open,
      high,
      low,
      close,
      volume
    });
  }

  return rows;
}

/**
 * Get file path in source directory
 *
 * @param filename - Name of file (e.g., "solana.csv")
 * @returns Absolute path to file
 */
export function getSourceFilePath(filename: string): string {
  // In Vercel, the project root is available
  const projectRoot = process.cwd();
  return path.join(projectRoot, 'source', filename);
}

/**
 * Check if file exists and is readable
 *
 * @param filename - Name of file
 * @returns true if file exists and is readable
 */
export function fileExists(filename: string): boolean {
  const filePath = getSourceFilePath(filename);
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}
