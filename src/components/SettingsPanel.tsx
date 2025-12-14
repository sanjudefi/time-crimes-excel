/**
 * Settings Panel Component
 * Source file input, timezone info, and decimal noise filter
 */

import React from 'react';

interface SettingsPanelProps {
  filename: string;
  onFilenameChange: (filename: string) => void;
  noiseThreshold: number;
  onNoiseThresholdChange: (threshold: number) => void;
}

export default function SettingsPanel({
  filename,
  onFilenameChange,
  noiseThreshold,
  onNoiseThresholdChange
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source File Input */}
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
            Source File Name
          </label>
          <input
            type="text"
            id="filename"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder="solana.csv"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            File must exist in /source directory (e.g., solana.csv or solana.xlsx)
          </p>
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

      {/* Timezone Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Timezone Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Source Timezone:</span>
            <span className="ml-2 text-gray-700">UTC</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Convert To:</span>
            <span className="ml-2 text-gray-700">Toronto (America/Toronto)</span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Interval:</span>
            <span className="ml-2 text-gray-700">15 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
