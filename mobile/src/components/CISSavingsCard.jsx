/**
 * CIS Tax Savings Card
 * Displays tax savings specific to CIS contractors
 * Shows real-time savings as they track mileage
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

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Your CIS Tax Savings</h2>
          <p className="text-sm text-slate-400">Based on {cisRate} CIS deduction rate</p>
        </div>
        <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Main Savings Display */}
      <div className="text-center mb-8">
        <div className="inline-block">
          <span className="text-5xl font-bold text-green-400">{formatCurrency(taxSaved)}</span>
          <p className="text-slate-400 mt-1">tax saved this year</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{totalMiles.toFixed(0)}</p>
          <p className="text-xs text-slate-400 mt-1">Total Miles</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalClaim)}</p>
          <p className="text-xs text-slate-400 mt-1">Claim Amount</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{cisRate}</p>
          <p className="text-xs text-slate-400 mt-1">CIS Rate</p>
        </div>
      </div>

      {/* 10,000 Mile Threshold Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Progress to 10,000 mile threshold</span>
          <span className="text-sm font-medium text-slate-300">{progressToThreshold.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressToThreshold}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-slate-500">0 miles</span>
          <span className="text-slate-400">
            {isOverThreshold 
              ? 'Threshold reached - now earning 25p/mile'
              : `${milesRemaining.toFixed(0)} miles at 45p rate`
            }
          </span>
          <span className="text-slate-500">10,000</span>
        </div>
      </div>

      {/* Current Rate Indicator */}
      <div className={`
        rounded-2xl p-4 text-center
        ${isOverThreshold ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-green-500/20 border border-green-500/30'}
      `}>
        <div className="flex items-center justify-center gap-2">
          <div className={`
            w-3 h-3 rounded-full
            ${isOverThreshold ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}
          `} />
          <span className={`
            font-semibold
            ${isOverThreshold ? 'text-amber-400' : 'text-green-400'}
          `}>
            Currently earning {currentRate} per mile
          </span>
        </div>
      </div>

      {/* Monthly Summary (if data provided) */}
      {(monthlyMiles > 0 || monthlyClaim > 0) && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">This Month</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-semibold">{monthlyMiles.toFixed(0)}</p>
              <p className="text-xs text-slate-500">miles</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{formatCurrency(monthlyClaim)}</p>
              <p className="text-xs text-slate-500">claimed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-400">{formatCurrency(monthlyTaxSaved)}</p>
              <p className="text-xs text-slate-500">saved</p>
            </div>
          </div>
        </div>
      )}

      {/* Educational Note */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-200">
            <strong className="text-blue-400">How it works:</strong> HMRC allows you to claim 
            {isOverThreshold ? ' 25p' : ' 45p'} per business mile. At {cisRate} CIS rate, 
            every £1 claimed saves you {(parseFloat(cisRate) / 100 * 100).toFixed(0)}p in tax!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CISSavingsCard;
