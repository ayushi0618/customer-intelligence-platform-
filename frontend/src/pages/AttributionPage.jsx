import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import { GitCompare, Info, BarChart2, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttributionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttributionData();
  }, []);

  const fetchAttributionData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attribution/compare');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load attribution metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Multi-Touch Marketing Attribution Engine</h2>
          <p className="text-xs text-slate-400">Comparative multi-model revenue allocation (First-Touch vs Last-Touch vs Multi-Touch Linear)</p>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 text-indigo-400 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Analytical Allocation Methodology Notice</p>
          <p className="mt-0.5 text-slate-300">
            Attribution modeling distributes historical revenue across customer touchpoints. It represents an analytical allocation model to compare channel impact rather than causal proof.
          </p>
        </div>
      </div>

      {/* Channel Attribution Comparison Bar Chart */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-1">Channel Revenue Comparison Across Models</h3>
        <p className="text-xs text-slate-400 mb-4">First-Touch (Initial Discovery) vs Last-Touch (Conversion Driver) vs Multi-Touch (Linear)</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.channelSummary || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="channel" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                formatter={(val) => [`$${val.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="firstTouchRevenue" name="First Touch $" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastTouchRevenue" name="Last Touch $" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="multiTouchRevenue" name="Multi-Touch $" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Attribution Comparison Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-bold text-white">Campaign Attribution Diagnostics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Campaign Code</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Spend</th>
                <th className="py-3 px-4">First-Touch Rev (ROI)</th>
                <th className="py-3 px-4">Last-Touch Rev (ROI)</th>
                <th className="py-3 px-4">Multi-Touch Rev (ROI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">Loading attribution results...</td>
                </tr>
              ) : data?.campaigns?.map((c) => (
                <tr key={c.campaignId} className="hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.code}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{c.channel}</td>
                  <td className="py-3 px-4 text-slate-300">${c.actualSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-indigo-400 font-medium">
                    ${c.firstTouch.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[10px] text-slate-400 block">({c.firstTouch.roi}% ROI)</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-medium">
                    ${c.lastTouch.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[10px] text-slate-400 block">({c.lastTouch.roi}% ROI)</span>
                  </td>
                  <td className="py-3 px-4 text-amber-400 font-medium">
                    ${c.multiTouch.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[10px] text-slate-400 block">({c.multiTouch.roi}% ROI)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
