import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import { Filter, ArrowDown, Users, ShoppingCart, CreditCard, CheckCircle, TrendingDown } from 'lucide-react';

export default function FunnelPage() {
  const [funnel, setFunnel] = useState(null);
  const [deviceType, setDeviceType] = useState('');
  const [trafficSource, setTrafficSource] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, [deviceType, trafficSource]);

  const fetchFunnelData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (deviceType) params.append('deviceType', deviceType);
      if (trafficSource) params.append('trafficSource', trafficSource);

      const res = await api.get(`/analytics/funnel?${params.toString()}`);
      if (res.data.success) {
        setFunnel(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load funnel analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (idx) => {
    switch (idx) {
      case 0: return Users;
      case 1: return Filter;
      case 2: return ShoppingCart;
      case 3: return CreditCard;
      case 4: return CheckCircle;
      default: return Filter;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">E-Commerce Conversion Funnel Analytics</h2>
          <p className="text-xs text-slate-400">Granular 5-stage conversion & drop-off diagnostics calculated from MySQL website event clickstreams</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Device Type:</label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Devices</option>
            <option value="DESKTOP">Desktop</option>
            <option value="MOBILE">Mobile</option>
            <option value="TABLET">Tablet</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Traffic Source:</label>
          <select
            value={trafficSource}
            onChange={(e) => setTrafficSource(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Traffic Sources</option>
            <option value="GoogleAds">Google Ads</option>
            <option value="Facebook">Facebook Ads</option>
            <option value="Instagram">Instagram Ads</option>
            <option value="Organic">Organic Search</option>
            <option value="Direct">Direct Traffic</option>
            <option value="Email">Email</option>
          </select>
        </div>
      </div>

      {/* Funnel Overview Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Visitors (Sessions)"
          value={(funnel?.totalSessions || 0).toLocaleString()}
          icon={Users}
          description="Unique web browsing sessions"
        />
        <StatCard
          title="Completed Purchases"
          value={(funnel?.totalPurchases || 0).toLocaleString()}
          icon={CheckCircle}
          description="Orders completed from browsing sessions"
        />
        <StatCard
          title="End-to-End Conversion Rate"
          value={`${funnel?.overallConversionRate || 0}%`}
          icon={TrendingDown}
          description="Visitors successfully converting to purchase"
        />
      </div>

      {/* Visual Funnel Flow */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white mb-4">Sequential Stage Conversion & Drop-off</h3>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading clickstream event data...</div>
        ) : (
          funnel?.stages?.map((s, idx) => {
            const Icon = getStageIcon(idx);
            const widthPct = Math.max(15, (s.count / (funnel.stages[0].count || 1)) * 100);

            return (
              <div key={s.stage} className="space-y-2">
                {idx > 0 && (
                  <div className="flex items-center justify-between pl-8 pr-4 text-xs text-slate-400 py-1">
                    <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>{s.dropOffCount.toLocaleString()} Drop-offs ({s.dropOffRate}% abandon)</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{s.conversionRate}% step conversion</span>
                  </div>
                )}

                <div className="relative bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3.5 z-10">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{idx + 1}. {s.stage}</h4>
                      <p className="text-xs text-slate-400">{s.count.toLocaleString()} sessions reached stage</p>
                    </div>
                  </div>

                  <div className="text-right z-10">
                    <span className="text-lg font-bold text-white">{s.conversionRate}%</span>
                    <p className="text-[10px] text-slate-400">conversion</p>
                  </div>

                  {/* Gradient Fill bar */}
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-indigo-500/15 border-r border-indigo-500/30 rounded-xl transition-all duration-500 pointer-events-none"
                    style={{ width: `${widthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
