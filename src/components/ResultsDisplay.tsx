/**
 * Results Display Component
 * Summary cards, top 5 trade windows, full time slot table
 */

import React from 'react';

interface TimeSlotStats {
  timeSlot: string;
  upCount: number;
  downCount: number;
  ignoredCount: number;
  totalCount: number;
  dominance: number;
  bias: 'UP' | 'DOWN' | 'NEUTRAL';
}

interface ResultsDisplayProps {
  totalUp: number;
  totalDown: number;
  totalIgnored: number;
  timeSlots: TimeSlotStats[];
  top5TimeSlots: TimeSlotStats[];
}

export default function ResultsDisplay({
  totalUp,
  totalDown,
  totalIgnored,
  timeSlots,
  top5TimeSlots
}: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-green-800 mb-1">Total UP Candles</h3>
            <p className="text-3xl font-bold text-green-900">{totalUp.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-sm font-semibold text-red-800 mb-1">Total DOWN Candles</h3>
            <p className="text-3xl font-bold text-red-900">{totalDown.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-md p-6 border-l-4 border-gray-500">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Total Ignored (Noise)</h3>
            <p className="text-3xl font-bold text-gray-900">{totalIgnored.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Top 5 Trade Windows */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Top 5 Trade Windows</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Slot (Toronto)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dominance %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bias
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {top5TimeSlots.map((slot, index) => (
                <tr key={slot.timeSlot} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {slot.timeSlot}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {slot.dominance.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${slot.bias === 'UP'
                        ? 'bg-green-100 text-green-800'
                        : slot.bias === 'DOWN'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                      }
                    `}>
                      {slot.bias}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Time Slot Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">All Time Slots</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DOWN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ignored
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dominance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bias
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((slot) => {
                  // Determine row color based on dominance
                  let rowClass = '';
                  if (slot.dominance >= 60) {
                    rowClass = slot.bias === 'UP' ? 'bg-green-50' : slot.bias === 'DOWN' ? 'bg-red-50' : '';
                  }

                  return (
                    <tr key={slot.timeSlot} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {slot.timeSlot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {slot.upCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {slot.downCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {slot.ignoredCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slot.totalCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {slot.dominance.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          ${slot.bias === 'UP'
                            ? 'bg-green-100 text-green-800'
                            : slot.bias === 'DOWN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {slot.bias}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
