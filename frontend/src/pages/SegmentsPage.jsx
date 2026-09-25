import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { RefreshCw, Award, PieChart as PieIcon, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SegmentsPage() {
  const [data, setData] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOv, resDist] = await Promise.all([
        api.get('/rfm/overview'),
        api.get('/rfm/distribution')
      ]);
      if (resOv.data.success) setData(resOv.data.data);
      if (resDist.data.success) setMatrix(resDist.data.data);
    } catch (err) {
      console.error('Failed to load RFM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post('/rfm/recalculate');
      await fetchData();
    } catch (err) {
      console.error('Recalculation failed:', err);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">RFM Customer Segmentation Engine</h2>
          <p className="text-xs text-slate-400">Deterministic quintile scoring across Recency, Frequency, and Monetary Value</p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          <span>{recalculating ? 'Recalculating...' : 'Recalculate RFM Scores'}</span>
        </button>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Scored Customers"
          value={(data?.totals?.totalCustomers || 0).toLocaleString()}
          icon={Users}
          description="Total active profiles scored"
        />
        <StatCard
          title="Average Recency Score"
          value={`${data?.totals?.averageRScore || 0} / 5`}
          icon={Award}
          description="Mean Recency quintile (5 = most recent)"
        />
        <StatCard
          title="Average Frequency Score"
          value={`${data?.totals?.averageFScore || 0} / 5`}
          icon={Award}
          description="Mean Frequency quintile (5 = most purchases)"
        />
        <StatCard
          title="Average Monetary Score"
          value={`${data?.totals?.averageMScore || 0} / 5`}
          icon={Award}
          description="Mean Monetary quintile (5 = highest spend)"
        />
      </div>

      {/* Segment Revenue Comparison Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Attributed Revenue by Segment</h3>
          <p className="text-xs text-slate-400 mb-4">Total revenue generated per deterministic RFM category</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.segments || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="segmentName" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5x5 Matrix Cell Distribution Heatmap */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">5x5 R-F Matrix Heatmap</h3>
          <p className="text-xs text-slate-400 mb-4">Recency vs Frequency grid density</p>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[5, 4, 3, 2, 1].map(r => (
              [1, 2, 3, 4, 5].map(f => {
                const cell = matrix.find(m => m.rScore === r && m.fScore === f);
                const cnt = cell ? cell.customerCount : 0;
                const opacity = Math.min(1.0, Math.max(0.1, cnt / 800));
                return (
                  <div
                    key={`${r}-${f}`}
                    title={`R:${r} F:${f} - ${cnt} Customers`}
                    className="p-2 rounded border border-slate-700/50 flex flex-col justify-center transition-all hover:scale-105"
                    style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
                  >
                    <span className="text-[10px] font-mono text-slate-300">R{r}F{f}</span>
                    <span className="text-xs font-bold text-white mt-0.5">{cnt}</span>
                  </div>
                );
              })
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-700">
            <span>R5 = High Recency</span>
            <span>F5 = High Frequency</span>
          </div>
        </div>
      </div>

      {/* RFM Segment Summary Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-bold text-white">Segment Performance Diagnostics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Segment Name</th>
                <th className="py-3 px-4">Customer Count</th>
                <th className="py-3 px-4">Total Spend</th>
                <th className="py-3 px-4">Avg Spend</th>
                <th className="py-3 px-4">Avg Orders</th>
                <th className="py-3 px-4">Avg Inactivity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data?.segments?.map((seg) => (
                <tr key={seg.segmentName} className="hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-semibold text-white">
                    <StatusBadge status={seg.segmentName} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200">{seg.customerCount.toLocaleString()}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">${seg.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-3 px-4 text-slate-300">${seg.avgMonetary.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-300">{seg.avgFrequency}</td>
                  <td className="py-3 px-4 text-slate-400">{seg.avgRecencyDays} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
