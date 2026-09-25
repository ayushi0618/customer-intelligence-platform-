import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { Megaphone, DollarSign, TrendingUp, Target, Eye, MousePointer } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [channel]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channel) params.append('channel', channel);
      const res = await api.get(`/campaigns?${params.toString()}`);
      if (res.data.success) {
        setCampaigns(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Marketing Campaigns & Channel ROI</h2>
          <p className="text-xs text-slate-400">Multi-channel performance tracking calculated directly from MySQL event streams</p>
        </div>

        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Channels</option>
          <option value="GOOGLE_SEARCH">Google Search</option>
          <option value="FACEBOOK_ADS">Facebook Ads</option>
          <option value="INSTAGRAM_ADS">Instagram Ads</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="AFFILIATE">Affiliate</option>
          <option value="TIKTOK">TikTok</option>
        </select>
      </div>

      {/* Campaign Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Impressions</th>
                <th className="py-3 px-4">Clicks (CTR)</th>
                <th className="py-3 px-4">Conversions</th>
                <th className="py-3 px-4">Spend</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">CPA</th>
                <th className="py-3 px-4">ROI</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    Loading marketing campaign metrics from MySQL...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No marketing campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.channel}</td>
                    <td className="py-3 px-4 text-slate-300">{c.impressions.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{c.clicks.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-400 block">({c.ctr}%)</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{c.conversions}</td>
                    <td className="py-3 px-4 text-slate-300">${c.actualSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">${c.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-slate-300">${c.cpa.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-indigo-400">{c.roi}%</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
