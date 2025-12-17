/**
 * SMA Trend Context Component
 *
 * Displays SMA 50 trend context for each time slot:
 * - Shows % of time price is ABOVE SMA 50
 * - Shows % of time price is BELOW SMA 50
 * - Highlights dominant trends
 * - Helps traders understand intraday trend context
 */

import React, { useState } from 'react';
import { SMAAnalysisResult } from '../utils/smaAnalysis';

interface SMATrendContextProps {
  smaAnalysis: SMAAnalysisResult;
}

export default function SMATrendContext({ smaAnalysis }: SMATrendContextProps) {
  const [sortBy, setSortBy] = useState<'timeSlot' | 'abovePercent' | 'belowPercent'>('timeSlot');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minThreshold, setMinThreshold] = useState(60);

  // Filter slots with significant trend (above or below threshold)
  const significantSlots = smaAnalysis.timeSlots.filter(
    slot => slot.aboveSMAPercent >= minThreshold || slot.belowSMAPercent >= minThreshold
  );

  // Sort slots
  const sortedSlots = [...smaAnalysis.timeSlots].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'timeSlot') {
      comparison = a.timeSlot.localeCompare(b.timeSlot);
    } else if (sortBy === 'abovePercent') {
      comparison = a.aboveSMAPercent - b.aboveSMAPercent;
    } else {
      comparison = a.belowSMAPercent - b.belowSMAPercent;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'timeSlot' | 'abovePercent' | 'belowPercent') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get row background color based on dominant trend
  const getRowClasses = (slot: typeof smaAnalysis.timeSlots[0]) => {
    if (slot.aboveSMAPercent >= 60) {
      return 'bg-green-50';
    } else if (slot.belowSMAPercent >= 60) {
      return 'bg-red-50';
    }
    return 'bg-white';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          📈 SMA Trend Context (Yearly)
        </h2>
        <p className="text-sm text-gray-600">
          SMA 50 based on 15-minute candles (Toronto time). Shows how often price is above/below
          the trend during each time slot.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Year</div>
          <div className="text-2xl font-bold text-blue-900">
            {smaAnalysis.year || 'All Years'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Candles with SMA</div>
          <div className="text-2xl font-bold text-green-900">
            {smaAnalysis.candlesWithSMA.toLocaleString()}
          </div>
          <div className="text-xs text-green-700">
            {smaAnalysis.candlesWithoutSMA} skipped (first 49)
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Strong Trends</div>
          <div className="text-2xl font-bold text-purple-900">
            {significantSlots.length}
          </div>
          <div className="text-xs text-purple-700">
            ≥{minThreshold}% above or below SMA
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Threshold for Highlighting
        </label>
        <input
          type="range"
          min="50"
          max="80"
          step="5"
          value={minThreshold}
          onChange={(e) => setMinThreshold(Number(e.target.value))}
          className="w-full md:w-64"
        />
        <div className="text-xs text-gray-600 mt-1">
          {minThreshold}% (highlighting {significantSlots.length} slots)
        </div>
      </div>

      {/* SMA Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('timeSlot')}
              >
                Time Slot {sortBy === 'timeSlot' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('abovePercent')}
              >
                % Above SMA 50 {sortBy === 'abovePercent' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('belowPercent')}
              >
                % Below SMA 50 {sortBy === 'belowPercent' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dominant Trend
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sample Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedSlots.map((slot, index) => (
              <tr key={index} className={`${getRowClasses(slot)} hover:opacity-75`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {slot.timeSlot}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ minWidth: '80px' }}>
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${slot.aboveSMAPercent}%` }}
                      />
                    </div>
                    <span className={`font-medium ${slot.aboveSMAPercent >= minThreshold ? 'text-green-700' : 'text-gray-700'}`}>
                      {slot.aboveSMAPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ minWidth: '80px' }}>
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${slot.belowSMAPercent}%` }}
                      />
                    </div>
                    <span className={`font-medium ${slot.belowSMAPercent >= minThreshold ? 'text-red-700' : 'text-gray-700'}`}>
                      {slot.belowSMAPercent}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      slot.dominantTrend === 'ABOVE'
                        ? 'bg-green-100 text-green-800'
                        : slot.dominantTrend === 'BELOW'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {slot.dominantTrend}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {slot.totalCount} candles
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Interpret SMA Context:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>
            <strong>Green rows (≥60% ABOVE):</strong> Price tends to be above SMA 50 during this time slot
            → Bullish intraday context, favor LONG setups
          </li>
          <li>
            <strong>Red rows (≥60% BELOW):</strong> Price tends to be below SMA 50 during this time slot
            → Bearish intraday context, favor SHORT setups
          </li>
          <li>
            <strong>White rows (NEUTRAL):</strong> No clear SMA trend during this time slot
            → Mixed context, use other signals
          </li>
          <li>
            <strong>Usage:</strong> Combine with time dominance analysis for stronger trade signals.
            Only take LONG setups when time slot shows both UP dominance AND above SMA context.
          </li>
        </ul>
      </div>
    </div>
  );
}
