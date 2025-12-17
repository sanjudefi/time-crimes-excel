/**
 * Historical Anniversary Comparison Component
 *
 * Shows what happened on the same date/week/month across the last 5 years:
 * - High/low prices
 * - Price changes
 * - Bullish/bearish trends
 * - Volatility
 *
 * Helps identify seasonal patterns and historical behavior.
 */

import React from 'react';
import { HistoricalComparisonResult } from '../utils/historicalComparison';

interface HistoricalComparisonProps {
  historicalComparison: HistoricalComparisonResult;
}

export default function HistoricalComparison({ historicalComparison }: HistoricalComparisonProps) {
  const { comparisonType, targetLabel, historicalData, summary } = historicalComparison;

  // Get trend color classes
  const getTrendClasses = (trend: string) => {
    if (trend === 'BULLISH') return 'bg-green-100 text-green-800';
    if (trend === 'BEARISH') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get row background for high/low highlighting
  const getRowClasses = (year: number) => {
    if (year === summary.highestYear) return 'bg-green-50';
    if (year === summary.lowestYear) return 'bg-red-50';
    if (year === summary.mostVolatileYear) return 'bg-yellow-50';
    return 'bg-white';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          📅 Historical Anniversary Analysis
        </h2>
        <p className="text-sm text-gray-600">
          Comparing <strong>{targetLabel}</strong> across the last 5 years -{' '}
          {comparisonType === 'DATE' && 'same date'}
          {comparisonType === 'WEEK' && 'same week'}
          {comparisonType === 'MONTH' && 'same month'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Average Trend</div>
          <div className="text-2xl font-bold text-blue-900">
            {summary.averageTrend}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {summary.bullishYears} bullish, {summary.bearishYears} bearish
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Avg High/Low</div>
          <div className="text-lg font-bold text-green-900">
            ${summary.averageHigh.toLocaleString()}
          </div>
          <div className="text-xs text-green-700">
            ${summary.averageLow.toLocaleString()}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium mb-1">Avg Change</div>
          <div className={`text-2xl font-bold ${summary.averageChangePercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {summary.averageChangePercent >= 0 ? '+' : ''}{summary.averageChangePercent}%
          </div>
          <div className="text-xs text-purple-700">
            ${summary.averageChange.toLocaleString()}
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-orange-600 font-medium mb-1">Notable Years</div>
          <div className="text-xs text-orange-800 space-y-1">
            <div>🟢 Highest: {summary.highestYear}</div>
            <div>🔴 Lowest: {summary.lowestYear}</div>
            <div>⚡ Most Volatile: {summary.mostVolatileYear}</div>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year / Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                High
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Low
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Open → Close
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Change
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volatility
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candles
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {historicalData.map((data, index) => (
              <tr key={index} className={`${getRowClasses(data.year)} hover:opacity-75`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{data.year}</div>
                  <div className="text-xs text-gray-500">
                    {data.dateRange.start} to {data.dateRange.end}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-700">
                    ${data.highPrice.toLocaleString()}
                  </div>
                  {data.year === summary.highestYear && (
                    <div className="text-xs text-green-600">🏆 Highest</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-red-700">
                    ${data.lowPrice.toLocaleString()}
                  </div>
                  {data.year === summary.lowestYear && (
                    <div className="text-xs text-red-600">📉 Lowest</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  <div>${data.openPrice.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">→ ${data.closePrice.toLocaleString()}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className={`text-sm font-semibold ${data.priceChangePercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent}%
                  </div>
                  <div className={`text-xs ${data.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.priceChange >= 0 ? '+' : ''}${data.priceChange.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full font-medium ${getTrendClasses(data.trend)}`}>
                    {data.trend}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {data.volatility}%
                  </div>
                  {data.year === summary.mostVolatileYear && (
                    <div className="text-xs text-orange-600">⚡ Most Volatile</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {data.candleCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historicalData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No historical data available for this period.</p>
          <p className="text-sm">Try selecting a different date/week/month.</p>
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Interpret:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>
            <strong>BULLISH years:</strong> Price closed higher than it opened during this period
            (positive change %)
          </li>
          <li>
            <strong>BEARISH years:</strong> Price closed lower than it opened during this period
            (negative change %)
          </li>
          <li>
            <strong>Volatility:</strong> Higher % means larger price swings during the period
            (more volatile)
          </li>
          <li>
            <strong>Highlighted rows:</strong> Green = highest high, Red = lowest low, Yellow = most volatile
          </li>
          <li>
            <strong>Usage:</strong> Look for consistent patterns across years. If 4 out of 5 years were bullish,
            this period tends to favor upward movement.
          </li>
        </ul>
      </div>
    </div>
  );
}
