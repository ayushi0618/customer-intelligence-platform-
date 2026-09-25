import React from 'react';

export default function StatusBadge({ status, type = 'default' }) {
  if (!status) return null;

  const getStyle = () => {
    const s = String(status).toUpperCase();

    // Churn Risk
    if (s === 'HIGH') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (s === 'MEDIUM') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (s === 'LOW') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

    // Recommendation priority
    if (s === 'CRITICAL') return 'bg-red-600/20 text-red-300 border-red-500/40 animate-pulse';
    
    // Statuses
    if (s === 'ACTIVE' || s === 'DELIVERED' || s === 'COMPLETED' || s === 'ACCEPTED' || s === 'CHAMPIONS') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (s === 'PENDING' || s === 'PROCESSING' || s === 'REVIEWED' || s === 'NEED ATTENTION') {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (s === 'DORMANT' || s === 'CHURNED' || s === 'DISMISSED' || s === 'CANCELLED' || s === 'AT RISK') {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (s === 'NEW' || s === 'NEW CUSTOMERS' || s === 'POTENTIAL LOYALISTS') {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }

    return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()}`}>
      {status}
    </span>
  );
}
