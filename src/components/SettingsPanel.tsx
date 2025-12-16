/**
 * Settings Panel Component
 * Source file selector, preview, timezone info, and decimal noise filter
 */

import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  filename: string;
  onFilenameChange: (filename: string) => void;
  noiseThreshold: number;
  onNoiseThresholdChange: (threshold: number) => void;
}

interface FileInfo {
  name: string;
  size: number;
  sizeFormatted: string;
  modified: string;
}

interface PreviewData {
  rowCount: number;
  previewRows: any[];
}

export default function SettingsPanel({
  filename,
  onFilenameChange,
  noiseThreshold,
  onNoiseThresholdChange
}: SettingsPanelProps) {
  const [availableFiles, setAvailableFiles] = useState<FileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load available files on mount
  useEffect(() => {
    fetchAvailableFiles();
  }, []);

  // Load preview when filename changes
  useEffect(() => {
    if (filename) {
      fetchPreview(filename);
    }
  }, [filename]);

  const fetchAvailableFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setAvailableFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchPreview = async (file: string) => {
    setLoadingPreview(true);
    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file })
      });
      if (response.ok) {
        const data = await response.json();
        setPreview({
          rowCount: data.rowCount,
          previewRows: data.previewRows
        });
      } else {
        setPreview(null);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const selectedFile = availableFiles.find(f => f.name === filename);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source File Dropdown */}
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
            Source File
          </label>
          <select
            id="filename"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            disabled={loadingFiles}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {loadingFiles ? (
              <option>Loading files...</option>
            ) : availableFiles.length === 0 ? (
              <option>No files found in /source</option>
            ) : (
              <>
                <option value="">Select a file...</option>
                {availableFiles.map(file => (
                  <option key={file.name} value={file.name}>
                    {file.name} ({file.sizeFormatted})
                  </option>
                ))}
              </>
            )}
          </select>
          {selectedFile && (
            <p className="text-xs text-gray-500 mt-1">
              Modified: {new Date(selectedFile.modified).toLocaleString()}
            </p>
          )}
        </div>

        {/* Decimal Noise Filter */}
        <div>
          <label htmlFor="noiseThreshold" className="block text-sm font-medium text-gray-700 mb-2">
            Decimal Noise Filter (%)
          </label>
          <input
            type="number"
            id="noiseThreshold"
            value={noiseThreshold}
            onChange={(e) => onNoiseThresholdChange(parseFloat(e.target.value))}
            step="0.01"
            min="0"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ignore candles with price change below this threshold (default: 0.02%)
          </p>
        </div>
      </div>

      {/* File Preview */}
      {preview && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            File Preview ({preview.rowCount.toLocaleString()} total rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">Timestamp</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">Open</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">High</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">Low</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">Close</th>
                  <th className="px-2 py-1 text-left font-medium text-gray-600">Volume</th>
                </tr>
              </thead>
              <tbody>
                {preview.previewRows.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-200">
                    <td className="px-2 py-1 text-gray-700">{row.timestamp}</td>
                    <td className="px-2 py-1 text-gray-700">{row.open}</td>
                    <td className="px-2 py-1 text-gray-700">{row.high}</td>
                    <td className="px-2 py-1 text-gray-700">{row.low}</td>
                    <td className="px-2 py-1 text-gray-700">{row.close}</td>
                    <td className="px-2 py-1 text-gray-700">{row.volume || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loadingPreview && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200 text-center text-sm text-gray-600">
          Loading preview...
        </div>
      )}

      {/* Timezone Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Timezone Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Source Timezone:</span>
            <span className="ml-2 text-gray-700">UTC (Coordinated Universal Time)</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Convert To:</span>
            <span className="ml-2 text-gray-700">Toronto (America/Toronto)</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Winter (EST):</span>
            <span className="ml-2 text-gray-700">UTC-5 (Nov-Mar)</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Summer (EDT):</span>
            <span className="ml-2 text-gray-700">UTC-4 (Mar-Nov)</span>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          ℹ️ DST transitions handled automatically - no manual adjustment needed
        </p>
      </div>
    </div>
  );
}
