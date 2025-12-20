/**
 * Trade Setup Simulator Component
 * Backtests a specific trade setup (entry/exit times, direction, stop loss, take profit)
 */

import React from 'react';

interface TradeResult {
  date: string;
  entryPrice: number;
  exitPrice: number;
  resultPercent: number;
  outcome: 'WIN' | 'LOSS' | 'STOPPED' | 'NEUTRAL';
}

interface SimulationResult {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  totalProfitLossPercent: number;
  trades: TradeResult[];
}

interface TradeSetupSimulatorProps {
  simulationResult: SimulationResult | null;
}

export default function TradeSetupSimulator({ simulationResult }: TradeSetupSimulatorProps) {
  if (!simulationResult) {
    return null;
  }

  const winRate = simulationResult.totalTrades > 0
    ? (simulationResult.winCount / simulationResult.totalTrades * 100).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        📈 Trade Setup Simulator Results
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-blue-900">
            {simulationResult.totalTrades}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Wins</div>
          <div className="text-2xl font-bold text-green-900">
            {simulationResult.winCount}
          </div>
          <div className="text-xs text-green-700 mt-1">
            Win Rate: {winRate}%
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Losses</div>
          <div className="text-2xl font-bold text-red-900">
            {simulationResult.lossCount}
          </div>
        </div>
        <div className={`border rounded-lg p-4 ${
          simulationResult.totalProfitLossPercent >= 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-xs text-gray-600 mb-1">Total P/L</div>
          <div className={`text-2xl font-bold ${
            simulationResult.totalProfitLossPercent >= 0
              ? 'text-green-900'
              : 'text-red-900'
          }`}>
            {simulationResult.totalProfitLossPercent >= 0 ? '+' : ''}
            {simulationResult.totalProfitLossPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Individual Trades Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Individual Trades
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {simulationResult.trades.map((trade, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {trade.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${trade.entryPrice.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${trade.exitPrice.toFixed(4)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${
                      trade.resultPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.resultPercent >= 0 ? '+' : ''}
                      {trade.resultPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${trade.outcome === 'WIN'
                          ? 'bg-green-100 text-green-800'
                          : trade.outcome === 'LOSS'
                          ? 'bg-red-100 text-red-800'
                          : trade.outcome === 'STOPPED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {trade.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {simulationResult.totalTrades === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trades found for the selected parameters
        </div>
      )}
    </div>
  );
}
