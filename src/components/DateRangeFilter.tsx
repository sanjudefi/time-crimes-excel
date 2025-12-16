/**
 * Date Range Filter Component
 * Preset options and custom date range selector
 */

import React from 'react';

interface DateRangeFilterProps {
  datePreset: string;
  onDatePresetChange: (preset: string) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
}

const DATE_PRESETS = [
  { value: 'all', label: 'All Time' },
  { value: '1week', label: 'Last Week' },
  { value: '1month', label: 'Last Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
];

export default function DateRangeFilter({
  datePreset,
  onDatePresetChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}: DateRangeFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Date Range</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Preset Dropdown */}
        <div>
          <label htmlFor="datePreset" className="block text-sm font-medium text-gray-700 mb-2">
            Date Range Preset
          </label>
          <select
            id="datePreset"
            value={datePreset}
            onChange={(e) => onDatePresetChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {DATE_PRESETS.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Quick date range selection
          </p>
        </div>

        {/* Custom Start Date */}
        {datePreset === 'custom' && (
          <>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={customStartDate}
                onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Custom End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={customEndDate}
                onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
      </div>

      {/* DST Information */}
      <div className="mt-6 p-4 bg-amber-50 rounded-md border border-amber-200">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">Toronto Timezone (EST/EDT)</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">🕐 Winter (EST):</span> UTC-5
            <span className="text-xs ml-2 text-gray-600">(November - March)</span>
          </p>
          <p>
            <span className="font-medium">☀️ Summer (EDT):</span> UTC-4
            <span className="text-xs ml-2 text-gray-600">(March - November)</span>
          </p>
          <p className="text-xs text-amber-800 mt-2">
            ℹ️ System automatically adjusts for Daylight Saving Time transitions
          </p>
        </div>
      </div>
    </div>
  );
}
