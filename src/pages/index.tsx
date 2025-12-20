/**
 * Main Page Component
 * Complete UI flow for Binance OHLC Analytics
 */

import React, { useState } from 'react';
import Head from 'next/head';
import SettingsPanel from '../components/SettingsPanel';
import FilterControls from '../components/FilterControls';
import DateRangeFilter from '../components/DateRangeFilter';
import ResultsDisplay from '../components/ResultsDisplay';
import PatternRelationshipTable from '../components/PatternRelationshipTable';
import TodayPlaybook from '../components/TodayPlaybook';
import HistoricalComparison from '../components/HistoricalComparison';
import PriceLookup from '../components/PriceLookup';
import TradeSetupSimulator from '../components/TradeSetupSimulator';
import { calculateDateRange } from '../utils/datePresets';
import { PatternRelationship } from '../utils/patternAnalysis';
import { TodayAnalysis } from '../utils/todayMode';
import { HistoricalComparisonResult, ComparisonType, getCurrentDateInfo } from '../utils/historicalComparison';

interface TimeSlotStats {
  timeSlot: string;
  upCount: number;
  downCount: number;
  ignoredCount: number;
  totalCount: number;
  dominance: number;
  bias: 'UP' | 'DOWN' | 'NEUTRAL';
}

interface AnalysisResult {
  totalUp: number;
  totalDown: number;
  totalIgnored: number;
  timeSlots: TimeSlotStats[];
  top5TimeSlots: TimeSlotStats[];
  availableYears: number[];
  patterns?: PatternRelationship[];
  todayAnalysis?: TodayAnalysis;
  historicalComparison?: HistoricalComparisonResult;
  priceLookup?: {
    openTime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  };
  tradeSimulation?: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    totalProfitLossPercent: number;
    trades: Array<{
      date: string;
      entryPrice: number;
      exitPrice: number;
      resultPercent: number;
      outcome: 'WIN' | 'LOSS' | 'STOPPED' | 'NEUTRAL';
    }>;
  };
}

export default function Home() {
  // Settings state
  const [filename, setFilename] = useState('');
  const [noiseThreshold, setNoiseThreshold] = useState(0.02);

  // Filter state
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [datePreset, setDatePreset] = useState('all'); // Date range preset
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [interval, setInterval] = useState(15); // Default 15 minutes
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // All days selected by default
  const [timeRangeStart, setTimeRangeStart] = useState('06:00');
  const [timeRangeEnd, setTimeRangeEnd] = useState('23:45');

  // Advanced features state
  const [enablePatterns, setEnablePatterns] = useState(false);
  const [enableTodayMode, setEnableTodayMode] = useState(false);
  const [enableHistoricalComparison, setEnableHistoricalComparison] = useState(false);
  const [historicalComparisonType, setHistoricalComparisonType] = useState<ComparisonType>('DATE');

  // Get current date info for defaults
  const currentDateInfo = getCurrentDateInfo();
  const [historicalTargetMonth, setHistoricalTargetMonth] = useState(currentDateInfo.month);
  const [historicalTargetDay, setHistoricalTargetDay] = useState(currentDateInfo.day);
  const [historicalTargetWeek, setHistoricalTargetWeek] = useState(currentDateInfo.week);

  // Price Lookup state
  const [enablePriceLookup, setEnablePriceLookup] = useState(false);
  const [priceLookupDate, setPriceLookupDate] = useState('');
  const [priceLookupTime, setPriceLookupTime] = useState('09:30');

  // Trade Setup Simulator state
  const [enableTradeSimulator, setEnableTradeSimulator] = useState(false);
  const [simulatorDays, setSimulatorDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [simulatorEntryTime, setSimulatorEntryTime] = useState('09:30');
  const [simulatorExitTime, setSimulatorExitTime] = useState('16:00');
  const [simulatorDirection, setSimulatorDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [simulatorStopLoss, setSimulatorStopLoss] = useState(2);
  const [simulatorTakeProfit, setSimulatorTakeProfit] = useState(5);
  const [simulatorStartDate, setSimulatorStartDate] = useState('');
  const [simulatorEndDate, setSimulatorEndDate] = useState('');

  // Results state
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTimeSlotTable, setShowTimeSlotTable] = useState(false);

  const handleAnalyze = async () => {
    // Validate filename is selected
    if (!filename) {
      setError('Please select a source file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          year: selectedYear,
          dateStart: datePreset === 'custom' ? customStartDate : calculateDateRange(datePreset).startDate,
          dateEnd: datePreset === 'custom' ? customEndDate : calculateDateRange(datePreset).endDate,
          interval,
          selectedDays,
          timeRangeStart,
          timeRangeEnd,
          noiseThreshold,
          enablePatterns,
          enableTodayMode,
          enableHistoricalComparison,
          historicalComparisonType,
          historicalTargetMonth,
          historicalTargetDay,
          historicalTargetWeek,
          patternMinSampleSize: 30,
          patternMinConfidence: 60,
          // Price Lookup parameters
          enablePriceLookup,
          priceLookupDate,
          priceLookupTime,
          // Trade Simulator parameters
          enableTradeSimulator,
          simulatorDays,
          simulatorEntryTime,
          simulatorExitTime,
          simulatorDirection,
          simulatorStopLoss,
          simulatorTakeProfit,
          simulatorStartDate,
          simulatorEndDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Analysis failed');
      }

      const data: AnalysisResult = await response.json();

      // Update available years if this is first analysis or years changed
      if (data.availableYears.length > 0) {
        setAvailableYears(data.availableYears);
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (start: string, end: string) => {
    setTimeRangeStart(start);
    setTimeRangeEnd(end);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  return (
    <>
      <Head>
        <title>Time Crimes Excel - Binance OHLC Analytics</title>
        <meta name="description" content="Analyze Binance OHLC crypto data with timezone conversion and time-based statistics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Time Crimes Excel
            </h1>
            <p className="text-lg text-gray-600">
              Binance OHLC Analytics Tool - Toronto Time Analysis
            </p>
          </div>

          {/* Settings Panel */}
          <SettingsPanel
            filename={filename}
            onFilenameChange={setFilename}
            noiseThreshold={noiseThreshold}
            onNoiseThresholdChange={setNoiseThreshold}
          />

          {/* Filter Controls */}
          <FilterControls
            availableYears={availableYears}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            interval={interval}
            onIntervalChange={setInterval}
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
            timeRangeStart={timeRangeStart}
            timeRangeEnd={timeRangeEnd}
            onTimeRangeChange={handleTimeRangeChange}
          />

          {/* Date Range Filter */}
          <DateRangeFilter
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomDateChange={handleCustomDateChange}
          />

          {/* Advanced Features Toggle */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🚀 Advanced Features
            </h2>
            <div className="space-y-4">
              {/* Pattern Analysis Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    📊 Pattern Analysis
                  </h3>
                  <p className="text-xs text-gray-600">
                    Detect intra-day time slot relationships (SAME/OPPOSITE direction patterns)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={enablePatterns}
                    onChange={(e) => setEnablePatterns(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Today Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    🎯 Today Mode (Daily Playbook)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Analyze today's candles and project remaining time slots based on patterns
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={enableTodayMode}
                    onChange={(e) => setEnableTodayMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Historical Anniversary Analysis Toggle */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    📅 Historical Anniversary
                  </h3>
                  <p className="text-xs text-gray-600">
                    Compare same date/week/month across last 5 years (high/low prices, trends)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={enableHistoricalComparison}
                    onChange={(e) => setEnableHistoricalComparison(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Historical Comparison Controls (shown when enabled) */}
              {enableHistoricalComparison && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Comparison Type
                      </label>
                      <select
                        value={historicalComparisonType}
                        onChange={(e) => setHistoricalComparisonType(e.target.value as ComparisonType)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="DATE">Same Date</option>
                        <option value="WEEK">Same Week</option>
                        <option value="MONTH">Same Month</option>
                      </select>
                    </div>

                    {historicalComparisonType === 'DATE' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Month
                          </label>
                          <select
                            value={historicalTargetMonth}
                            onChange={(e) => setHistoricalTargetMonth(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                              <option key={idx} value={idx}>{month}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Day
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={historicalTargetDay}
                            onChange={(e) => setHistoricalTargetDay(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                          />
                        </div>
                      </>
                    )}

                    {historicalComparisonType === 'WEEK' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Week Number (1-52)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={historicalTargetWeek}
                          onChange={(e) => setHistoricalTargetWeek(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    )}

                    {historicalComparisonType === 'MONTH' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Month
                        </label>
                        <select
                          value={historicalTargetMonth}
                          onChange={(e) => setHistoricalTargetMonth(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                            <option key={idx} value={idx}>{month}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {historicalComparisonType === 'DATE' && `Comparing ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][historicalTargetMonth]} ${historicalTargetDay} across last 5 years`}
                    {historicalComparisonType === 'WEEK' && `Comparing Week ${historicalTargetWeek} across last 5 years`}
                    {historicalComparisonType === 'MONTH' && `Comparing ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][historicalTargetMonth]} across last 5 years`}
                  </div>
                </div>
              )}

              {/* Price Lookup Toggle */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    🔍 Price Lookup
                  </h3>
                  <p className="text-xs text-gray-600">
                    Look up exact price data at a specific date/time for TradingView verification
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={enablePriceLookup}
                    onChange={(e) => setEnablePriceLookup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Price Lookup Controls (shown when enabled) */}
              {enablePriceLookup && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={priceLookupDate}
                        onChange={(e) => setPriceLookupDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Time (Toronto)
                      </label>
                      <input
                        type="time"
                        value={priceLookupTime}
                        onChange={(e) => setPriceLookupTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Setup Simulator Toggle */}
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    📈 Trade Setup Simulator
                  </h3>
                  <p className="text-xs text-gray-600">
                    Backtest a specific trade setup with entry/exit times, stop loss, and take profit
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={enableTradeSimulator}
                    onChange={(e) => setEnableTradeSimulator(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Trade Simulator Controls (shown when enabled) */}
              {enableTradeSimulator && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                          <label key={idx} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={simulatorDays.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSimulatorDays([...simulatorDays, idx].sort());
                                } else {
                                  setSimulatorDays(simulatorDays.filter(d => d !== idx));
                                }
                              }}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                            />
                            <span className="ml-1 text-xs text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Entry Time
                      </label>
                      <input
                        type="time"
                        value={simulatorEntryTime}
                        onChange={(e) => setSimulatorEntryTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Exit Time
                      </label>
                      <input
                        type="time"
                        value={simulatorExitTime}
                        onChange={(e) => setSimulatorExitTime(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Direction
                      </label>
                      <select
                        value={simulatorDirection}
                        onChange={(e) => setSimulatorDirection(e.target.value as 'LONG' | 'SHORT')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="LONG">LONG</option>
                        <option value="SHORT">SHORT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stop Loss % (0-10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={simulatorStopLoss}
                        onChange={(e) => setSimulatorStopLoss(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Take Profit % (0-20)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={simulatorTakeProfit}
                        onChange={(e) => setSimulatorTakeProfit(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={simulatorStartDate}
                        onChange={(e) => setSimulatorStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={simulatorEndDate}
                        onChange={(e) => setSimulatorEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(enablePatterns || enableTodayMode || enableHistoricalComparison || enablePriceLookup || enableTradeSimulator) && (
                <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    ⚡ Note: Advanced features may increase processing time for large datasets
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="mb-8">
            <button
              onClick={handleAnalyze}
              disabled={loading || selectedDays.length === 0 || !filename}
              className={`
                w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-lg
                transition-colors shadow-lg
                ${loading || selectedDays.length === 0 || !filename
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Generate Analysis'
              )}
            </button>
            {!filename && (
              <p className="mt-2 text-sm text-red-600">
                Please select a source file
              </p>
            )}
            {selectedDays.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                Please select at least one day of the week
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <>
              {/* Price Lookup Results */}
              {results.priceLookup && (
                <PriceLookup lookupResult={results.priceLookup} />
              )}

              {/* Trade Setup Simulator Results */}
              {results.tradeSimulation && (
                <TradeSetupSimulator simulationResult={results.tradeSimulation} />
              )}

              {/* Show/Hide Time Slot Table Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowTimeSlotTable(!showTimeSlotTable)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                >
                  {showTimeSlotTable ? 'Hide Time Slot Table' : 'Show Time Slot Table'}
                </button>
              </div>

              {/* Conditionally Render Time Slot Table */}
              {showTimeSlotTable && (
                <ResultsDisplay
                  totalUp={results.totalUp}
                  totalDown={results.totalDown}
                  totalIgnored={results.totalIgnored}
                  timeSlots={results.timeSlots}
                  top5TimeSlots={results.top5TimeSlots}
                />
              )}

              {/* Today Mode Playbook */}
              {results.todayAnalysis && (
                <TodayPlaybook todayAnalysis={results.todayAnalysis} />
              )}

              {/* Pattern Relationships */}
              {results.patterns && (
                <PatternRelationshipTable patterns={results.patterns} />
              )}

              {/* Historical Anniversary Comparison */}
              {results.historicalComparison && (
                <HistoricalComparison historicalComparison={results.historicalComparison} />
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-300">
            <p className="text-center text-sm text-gray-600">
              Time Crimes Excel - Built for Vercel - Production-Ready Analytics Tool
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
