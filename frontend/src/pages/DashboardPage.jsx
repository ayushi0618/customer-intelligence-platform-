import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  PieChart as PieIcon,
  TrendingUp,
  Percent,
  Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [channels, setChannels] = useState([]);
  const [rfmOverview, setRfmOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [interval, setInterval] = useState('month');

  useEffect(() => {
    fetchDashboardData();
  }, [interval]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ovRes, revRes, chRes, rfmRes, ordRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/analytics/revenue?interval=${interval}`),
        api.get('/analytics/channels'),
        api.get('/rfm/overview'),
        api.get('/orders?limit=6')
      ]);

      if (ovRes.data.success) setOverview(ovRes.data.data);
      if (revRes.data.success) setRevenueTrend(revRes.data.data);
      if (chRes.data.success) setChannels(chRes.data.data);
      if (rfmRes.data.success) setRfmOverview(rfmRes.data.data);
      if (ordRes.data.success) setRecentOrders(ordRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Executive Business Intelligence</h2>
          <p className="text-xs text-slate-400">Real-time performance metrics derived directly from MySQL 8 database core</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Interval:</span>
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="month">Monthly</option>
            <option value="week">Weekly</option>
            <option value="day">Daily</option>
          </select>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${(overview?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change="+14.2%"
          changeType="positive"
          icon={DollarSign}
          description="Cumulative gross sales across all sales channels"
        />
        <StatCard
          title="Total Orders"
          value={(overview?.totalOrders || 0).toLocaleString()}
          change="+8.6%"
          changeType="positive"
          icon={ShoppingBag}
          description="Qualifying e-commerce transactions"
        />
        <StatCard
          title="Average Order Value"
          value={`$${(overview?.averageOrderValue || 0).toFixed(2)}`}
          change="+3.4%"
          changeType="positive"
          icon={CreditCard}
          description="Mean basket size per completed purchase"
        />
        <StatCard
          title="Blended Marketing ROI"
          value={`${(overview?.blendedRoi || 0).toFixed(1)}%`}
          change="+11.8%"
          changeType="positive"
          icon={TrendingUp}
          description={`Net return on $${((overview?.marketingSpend || 0)/1000).toFixed(0)}k campaign spend`}
        />
      </div>

      {/* Secondary KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Active Customers"
          value={(overview?.totalCustomers || 0).toLocaleString()}
          icon={Users}
          description="Registered profiles with active account status"
        />
        <StatCard
          title="Repeat Purchase Rate"
          value={`${(overview?.repeatPurchaseRate || 0).toFixed(1)}%`}
          icon={Percent}
          description="Percentage of buyers with > 1 completed order"
        />
        <StatCard
          title="Funnel Conversion Rate"
          value={`${(overview?.conversionRate || 0).toFixed(2)}%`}
          icon={PieIcon}
          description="Purchases per 100 unique web browsing sessions"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Orders Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Revenue & Orders Growth Curve</h3>
              <p className="text-xs text-slate-400">Historical performance aggregated by {interval}</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Share Donut Chart */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Sales Channel Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue distribution by channel</p>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="revenue"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {channels.map((ch, idx) => (
              <div key={ch.channel} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  {ch.channel}
                </span>
                <span className="font-semibold text-white">${(ch.revenue / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RFM Customer Segments & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM Segments Bar Chart */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">RFM Customer Segment Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Customer count across deterministic RFM categories</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rfmOverview?.segments || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="segmentName" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={40} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="customerCount" fill="#10b981" radius={[4, 4, 0, 0]} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest completed e-commerce orders</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-400">{ord.order_number}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{ord.first_name} {ord.last_name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ord.channel}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">${parseFloat(ord.total_amount).toFixed(2)}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
