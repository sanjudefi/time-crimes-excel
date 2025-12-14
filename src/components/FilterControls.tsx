/**
 * Filter Controls Component
 * Year dropdown, day-of-week multi-select, time range
 */

import React from 'react';

interface FilterControlsProps {
  availableYears: number[];
  selectedYear: number | undefined;
  onYearChange: (year: number | undefined) => void;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  timeRangeStart: string;
  timeRangeEnd: string;
  onTimeRangeChange: (start: string, end: string) => void;
}

const DAYS = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
  { index: 6, name: 'Saturday' },
  { index: 0, name: 'Sunday' },
];

export default function FilterControls({
  availableYears,
  selectedYear,
  onYearChange,
  selectedDays,
  onDaysChange,
  timeRangeStart,
  timeRangeEnd,
  onTimeRangeChange
}: FilterControlsProps) {
  const handleDayToggle = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      onDaysChange(selectedDays.filter(d => d !== dayIndex));
    } else {
      onDaysChange([...selectedDays, dayIndex]);
    }
  };

  const handleSelectAllDays = () => {
    onDaysChange([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleDeselectAllDays = () => {
    onDaysChange([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Year Dropdown */}
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            id="year"
            value={selectedYear ?? 'all'}
            onChange={(e) => onYearChange(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range (Toronto Time)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={timeRangeStart}
              onChange={(e) => onTimeRangeChange(e.target.value, timeRangeEnd)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">→</span>
            <input
              type="time"
              value={timeRangeEnd}
              onChange={(e) => onTimeRangeChange(timeRangeStart, e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Day of Week Multi-Select */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Days of Week
          </label>
          <div className="space-x-2">
            <button
              onClick={handleSelectAllDays}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAllDays}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {DAYS.map(day => (
            <label
              key={day.index}
              className={`
                flex items-center justify-center px-4 py-3 rounded-md border-2 cursor-pointer transition-colors
                ${selectedDays.includes(day.index)
                  ? 'bg-blue-100 border-blue-500 text-blue-900'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selectedDays.includes(day.index)}
                onChange={() => handleDayToggle(day.index)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{day.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
