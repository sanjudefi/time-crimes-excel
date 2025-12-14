/**
 * Main Page Component
 * Complete UI flow for Binance OHLC Analytics
 */

import React, { useState } from 'react';
import Head from 'next/head';
import SettingsPanel from '../components/SettingsPanel';
import FilterControls from '../components/FilterControls';
import ResultsDisplay from '../components/ResultsDisplay';

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
}

export default function Home() {
  // Settings state
  const [filename, setFilename] = useState('solana.csv');
  const [noiseThreshold, setNoiseThreshold] = useState(0.02);

  // Filter state
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // All days selected by default
  const [timeRangeStart, setTimeRangeStart] = useState('06:00');
  const [timeRangeEnd, setTimeRangeEnd] = useState('23:45');

  // Results state
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
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
          selectedDays,
          timeRangeStart,
          timeRangeEnd,
          noiseThreshold
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
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
            timeRangeStart={timeRangeStart}
            timeRangeEnd={timeRangeEnd}
            onTimeRangeChange={handleTimeRangeChange}
          />

          {/* Analyze Button */}
          <div className="mb-8">
            <button
              onClick={handleAnalyze}
              disabled={loading || selectedDays.length === 0}
              className={`
                w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-lg
                transition-colors shadow-lg
                ${loading || selectedDays.length === 0
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
            <ResultsDisplay
              totalUp={results.totalUp}
              totalDown={results.totalDown}
              totalIgnored={results.totalIgnored}
              timeSlots={results.timeSlots}
              top5TimeSlots={results.top5TimeSlots}
            />
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
