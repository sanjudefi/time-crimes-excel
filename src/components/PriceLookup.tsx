/**
 * Price Lookup Component
 * Allows users to lookup exact price at a specific date/time for TradingView verification
 */

import React from 'react';

interface PriceLookupData {
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceLookupProps {
  lookupResult: PriceLookupData | null;
}

export default function PriceLookup({ lookupResult }: PriceLookupProps) {
  if (!lookupResult) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        🔍 Price Lookup (TradingView Verification)
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="text-sm font-semibold text-blue-900 mb-2">
          {lookupResult.openTime} (Toronto Time)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Open</div>
            <div className="text-lg font-bold text-gray-900">
              ${lookupResult.open.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">High</div>
            <div className="text-lg font-bold text-green-600">
              ${lookupResult.high.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Low</div>
            <div className="text-lg font-bold text-red-600">
              ${lookupResult.low.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Close</div>
            <div className="text-lg font-bold text-gray-900">
              ${lookupResult.close.toFixed(4)}
            </div>
          </div>
        </div>
        {lookupResult.volume && (
          <div className="mt-3">
            <div className="text-xs text-gray-600">Volume</div>
            <div className="text-md font-semibold text-gray-700">
              {lookupResult.volume.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 rounded p-3">
        <div className="font-semibold mb-1">💡 How to verify:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Open TradingView and find the same candle at this time</li>
          <li>Compare Open, High, Low, Close values</li>
          <li>Note: TradingView shows UTC time by default, adjust timezone if needed</li>
          <li>Minor differences may exist due to data source variations</li>
        </ul>
      </div>
    </div>
  );
}
