/**
 * Pattern Relationship Table Component
 *
 * Displays intra-day time slot pattern relationships:
 * - Which time slots tend to move in the SAME direction
 * - Which time slots tend to move in OPPOSITE directions
 * - Confidence scores and sample sizes
 */

import React, { useState } from 'react';
import { PatternRelationship } from '../utils/patternAnalysis';

interface PatternRelationshipTableProps {
  patterns: PatternRelationship[];
}

export default function PatternRelationshipTable({ patterns }: PatternRelationshipTableProps) {
  const [sortBy, setSortBy] = useState<'confidence' | 'sampleSize' | 'slotA'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRelationship, setFilterRelationship] = useState<'ALL' | 'SAME' | 'OPPOSITE'>('ALL');
  const [minConfidence, setMinConfidence] = useState(60);

  // Filter patterns
  const filteredPatterns = patterns.filter(p => {
    if (filterRelationship !== 'ALL' && p.relationship !== filterRelationship) {
      return false;
    }
    if (p.confidence < minConfidence) {
      return false;
    }
    return true;
  });

  // Sort patterns
  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'confidence') {
      comparison = a.confidence - b.confidence;
    } else if (sortBy === 'sampleSize') {
      comparison = a.sampleSize - b.sampleSize;
    } else {
      comparison = a.slotA.localeCompare(b.slotA);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'confidence' | 'sampleSize' | 'slotA') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (patterns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          📊 Pattern Relationships
        </h2>
        <p className="text-gray-600">
          Enable Pattern Analysis to see time slot relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        📊 Intra-Day Time Slot Pattern Relationships
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Shows which 15-minute time slots tend to move together (SAME direction) or
        opposite (OPPOSITE direction) within the same trading day.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship Type
          </label>
          <select
            value={filterRelationship}
            onChange={(e) => setFilterRelationship(e.target.value as 'ALL' | 'SAME' | 'OPPOSITE')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="ALL">All Relationships</option>
            <option value="SAME">SAME Direction Only</option>
            <option value="OPPOSITE">OPPOSITE Direction Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Confidence %
          </label>
          <input
            type="number"
            min="50"
            max="100"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            Showing <strong>{sortedPatterns.length}</strong> of{' '}
            <strong>{patterns.length}</strong> patterns
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('slotA')}
              >
                Slot A {sortBy === 'slotA' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('slotA')}
              >
                Slot B {sortBy === 'slotA' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Relationship
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('confidence')}
              >
                Confidence {sortBy === 'confidence' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sampleSize')}
              >
                Sample Size {sortBy === 'sampleSize' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPatterns.map((pattern, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pattern.slotA}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {pattern.relationship === 'SAME' ? '→' : '⇄'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pattern.slotB}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      pattern.relationship === 'SAME'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {pattern.relationship}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ minWidth: '60px' }}>
                      <div
                        className={`h-2 rounded-full ${
                          pattern.confidence >= 70
                            ? 'bg-green-500'
                            : pattern.confidence >= 60
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${pattern.confidence}%` }}
                      />
                    </div>
                    <span className="font-medium">{pattern.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {pattern.sampleSize} days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedPatterns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No patterns match the current filters.
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Interpret:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>
            <strong>SAME:</strong> When Slot A moves UP/DOWN, Slot B tends to move in the same direction
            (continuation pattern)
          </li>
          <li>
            <strong>OPPOSITE:</strong> When Slot A moves UP, Slot B tends to move DOWN, and vice versa
            (mean reversion pattern)
          </li>
          <li>
            <strong>Confidence:</strong> Percentage of days where the relationship held true
          </li>
          <li>
            <strong>Sample Size:</strong> Number of days analyzed (minimum 30 for reliability)
          </li>
        </ul>
      </div>
    </div>
  );
}
