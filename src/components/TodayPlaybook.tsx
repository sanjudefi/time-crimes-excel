/**
 * Today Playbook Component
 *
 * Daily Trading Playbook showing:
 * - Today's completed candles (what has already happened)
 * - Morning bias analysis
 * - Projected future time slots based on pattern relationships
 * - Color-coded bias indicators (LONG/SHORT/AVOID)
 * - Confidence scores and reasoning
 */

import React, { useState } from 'react';
import { TodayAnalysis, TodayProjection, TodayCandle } from '../utils/todayMode';

interface TodayPlaybookProps {
  todayAnalysis: TodayAnalysis;
}

export default function TodayPlaybook({ todayAnalysis }: TodayPlaybookProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [minConfidence, setMinConfidence] = useState(55);

  // Filter projections by confidence
  const filteredProjections = todayAnalysis.projections.filter(
    p => p.confidence >= minConfidence
  );

  // Group projections by strength
  const strongProjections = filteredProjections.filter(p => p.strength === 'STRONG');
  const weakProjections = filteredProjections.filter(p => p.strength === 'WEAK');

  // Get bias color classes
  const getBiasClasses = (bias: string, strength: string) => {
    if (strength === 'STRONG') {
      if (bias === 'LONG') return 'bg-green-100 text-green-800 border-green-300';
      if (bias === 'SHORT') return 'bg-red-100 text-red-800 border-red-300';
      return 'bg-gray-100 text-gray-800 border-gray-300';
    } else {
      // WEAK
      if (bias === 'LONG') return 'bg-green-50 text-green-700 border-green-200';
      if (bias === 'SHORT') return 'bg-red-50 text-red-700 border-red-200';
      return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction === 'UP') return '🟢';
    if (direction === 'DOWN') return '🔴';
    return '⚪';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          🎯 Today's Trading Playbook
        </h2>
        <div className="text-sm text-gray-600">
          {todayAnalysis.date}
        </div>
      </div>

      {/* Morning Bias Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Morning Bias</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">
              {getDirectionIcon(todayAnalysis.morningBias)}
            </span>
            <div>
              <div className="text-lg font-bold text-gray-800">
                {todayAnalysis.morningBias}
              </div>
              <div className="text-xs text-gray-600">
                {todayAnalysis.morningStrength}% confidence
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Based on {todayAnalysis.completedCandles.filter(c => c.timeSlot < '12:00').length} morning candles
          </div>
        </div>
      </div>

      {/* Completed Candles Section */}
      {showCompleted && todayAnalysis.completedCandles.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              ✅ Completed Candles ({todayAnalysis.completedCandles.length})
            </h3>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showCompleted ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {todayAnalysis.completedCandles.map((candle, index) => (
              <div
                key={index}
                className="p-2 border rounded text-center text-xs"
                style={{
                  backgroundColor: candle.direction === 'UP' ? '#dcfce7' :
                                   candle.direction === 'DOWN' ? '#fee2e2' : '#f3f4f6',
                  borderColor: candle.direction === 'UP' ? '#86efac' :
                               candle.direction === 'DOWN' ? '#fca5a5' : '#d1d5db'
                }}
              >
                <div className="font-semibold">{candle.timeSlot}</div>
                <div className="text-xs">
                  {getDirectionIcon(candle.direction)} {candle.changePercent}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projections Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Confidence %
        </label>
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={minConfidence}
          onChange={(e) => setMinConfidence(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-600 text-center">
          {minConfidence}% (showing {filteredProjections.length} of {todayAnalysis.projections.length} projections)
        </div>
      </div>

      {/* Strong Bias Projections */}
      {strongProjections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🔥 Strong Bias Signals (≥65% confidence)
          </h3>
          <div className="space-y-2">
            {strongProjections.map((projection, index) => (
              <ProjectionCard key={index} projection={projection} getBiasClasses={getBiasClasses} getDirectionIcon={getDirectionIcon} />
            ))}
          </div>
        </div>
      )}

      {/* Weak Bias Projections */}
      {weakProjections.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            💡 Weak Bias Signals (55-65% confidence)
          </h3>
          <div className="space-y-2">
            {weakProjections.map((projection, index) => (
              <ProjectionCard key={index} projection={projection} getBiasClasses={getBiasClasses} getDirectionIcon={getDirectionIcon} />
            ))}
          </div>
        </div>
      )}

      {filteredProjections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No projections available.</p>
          <p className="text-sm">
            {todayAnalysis.completedCandles.length === 0
              ? 'No completed candles yet today.'
              : 'Try lowering the confidence threshold or wait for more candles to complete.'}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Disclaimer</h3>
        <p className="text-xs text-yellow-800">
          Patterns are <strong>statistical tendencies</strong>, not guarantees.
          Use as a <strong>timing filter</strong>, not a standalone signal.
          Always combine with your own analysis, risk management, and trading strategy.
          Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

// Projection Card Component
function ProjectionCard({
  projection,
  getBiasClasses,
  getDirectionIcon
}: {
  projection: TodayProjection;
  getBiasClasses: (bias: string, strength: string) => string;
  getDirectionIcon: (direction: string) => string;
}) {
  return (
    <div
      className={`p-4 border-2 rounded-lg ${getBiasClasses(projection.bias, projection.strength)}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getDirectionIcon(projection.expectedDirection)}</span>
          <div>
            <div className="text-lg font-bold">{projection.timeSlot}</div>
            <div className="text-xs opacity-75">
              Expected: {projection.expectedDirection}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            projection.bias === 'LONG' ? 'text-green-700' :
            projection.bias === 'SHORT' ? 'text-red-700' : 'text-gray-700'
          }`}>
            {projection.bias}
          </div>
          <div className="text-xs opacity-75">
            {projection.strength}
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Confidence</span>
          <span className="font-semibold">{projection.confidence}%</span>
        </div>
        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              projection.confidence >= 70 ? 'bg-green-600' :
              projection.confidence >= 60 ? 'bg-yellow-600' : 'bg-orange-600'
            }`}
            style={{ width: `${projection.confidence}%` }}
          />
        </div>
      </div>

      <div className="text-xs opacity-90 mb-1">
        <strong>Reason:</strong> {projection.reason}
      </div>

      <div className="text-xs opacity-75">
        Sample: {projection.sampleSize} days
      </div>
    </div>
  );
}
