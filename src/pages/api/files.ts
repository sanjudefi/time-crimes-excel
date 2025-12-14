/**
 * Vercel API Route: /api/files
 * Lists available data files in /source directory
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  modified: string;
}

interface FilesResponse {
  files: FileInfo[];
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilesResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sourcePath = path.join(process.cwd(), 'source');

    // Check if source directory exists
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({
        error: 'Source directory not found',
        details: '/source directory does not exist'
      });
    }

    // Read directory contents
    const files = fs.readdirSync(sourcePath);

    // Filter and map to FileInfo
    const fileInfos: FileInfo[] = files
      .filter(file => {
        // Only include CSV and XLSX files
        const ext = file.toLowerCase().split('.').pop();
        return ext === 'csv' || ext === 'xlsx';
      })
      .map(file => {
        const filePath = path.join(sourcePath, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => {
        // Sort by modified date (newest first)
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      });

    return res.status(200).json({
      files: fileInfos
    });

  } catch (error) {
    console.error('Error listing files:', error);

    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
