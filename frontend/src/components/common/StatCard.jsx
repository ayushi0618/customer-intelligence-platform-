import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, change, changeType = 'positive', icon: Icon, description, subtitle }) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md hover:border-slate-600 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>

        {change !== undefined && (
          <div className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
            isNegative ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
            'bg-slate-700 text-slate-300'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 mr-1" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {(description || subtitle) && (
        <p className="text-xs text-slate-400 mt-2 truncate">
          {description || subtitle}
        </p>
      )}
    </div>
  );
}
