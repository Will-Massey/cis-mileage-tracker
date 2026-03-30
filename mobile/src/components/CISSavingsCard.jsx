/**
 * CIS Tax Savings Card - Mobile Optimized
 * Displays tax savings specific to CIS contractors
 */

import React from 'react';
import { formatCurrency } from '../utils/CISCalculator';

const CISSavingsCard = ({ 
  totalMiles = 0, 
  totalClaim = 0, 
  taxSaved = 0, 
  cisRate = '20%',
  monthlyMiles = 0,
  monthlyClaim = 0,
  monthlyTaxSaved = 0
}) => {
  // Calculate progress towards 10,000 mile threshold
  const progressToThreshold = Math.min((totalMiles / 10000) * 100, 100);
  const milesRemaining = Math.max(10000 - totalMiles, 0);
  
  // Determine rate status
  const isOverThreshold = totalMiles >= 10000;
  const currentRate = isOverThreshold ? '25p' : '45p';

  // Check if user has any data
  const hasData = totalMiles > 0 || totalClaim > 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-200">CIS Tax Savings</h2>
          <p className="text-xs text-slate-400">{cisRate} deduction rate</p>
        </div>
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <span className="text-xl">💰</span>
        </div>
      </div>

      {/* Main Savings Display */}
      <div className="text-center mb-4">
        <span className="text-4xl font-bold text-green-400">{formatCurrency(taxSaved)}</span>
        <p className="text-slate-400 text-sm mt-1">tax saved this year</p>
      </div>

      {/* Stats - Stacked on very small screens, 3-col on larger */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{totalMiles.toFixed(0)}</p>
          <p className="text-xs text-slate-400">Miles</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-yellow-400 truncate">{formatCurrency(totalClaim)}</p>
          <p className="text-xs text-slate-400">Claim</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{cisRate}</p>
          <p className="text-xs text-slate-400">Rate</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">10k mile threshold</span>
          <span className="text-xs font-medium text-slate-300">{progressToThreshold.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressToThreshold}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 text-center">
          {isOverThreshold 
            ? 'Now earning 25p/mile' 
            : `${milesRemaining.toFixed(0)} miles left at 45p`
          }
        </p>
      </div>

      {/* Current Rate */}
      <div className={`rounded-xl p-3 text-center ${isOverThreshold ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
        <span className={`text-sm font-semibold ${isOverThreshold ? 'text-amber-400' : 'text-green-400'}`}>
          Earning {currentRate} per mile
        </span>
      </div>

      {/* Empty State - Show Value Proposition */}
      {!hasData && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <p className="text-sm text-blue-200 mb-2">
            <strong className="text-blue-400">💡 Example:</strong>
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Drive 100 miles → Claim £45 → <span className="text-green-400 font-semibold">Save £9 in tax</span> (at 20% CIS rate)
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Tap "Start Tracking" to begin recording trips!
          </p>
        </div>
      )}

      {/* How it Works - Always Visible */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">How it works:</strong> HMRC lets you claim 
          business miles. At {cisRate} CIS rate, you save {(parseFloat(cisRate) / 100 * 100).toFixed(0)}p tax per £1 claimed.
        </p>
      </div>
    </div>
  );
};

export default CISSavingsCard;
