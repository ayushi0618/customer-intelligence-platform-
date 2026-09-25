import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Activity,
  Award,
  AlertTriangle,
  Lightbulb,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function Customer360Modal({ customerId, onClose }) {
  const [data, setData] = useState(null);
  const [journey, setJourney] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomer360Data();
    }
  }, [customerId]);

  const fetchCustomer360Data = async () => {
    setLoading(true);
    try {
      const [res360, resJ] = await Promise.all([
        api.get(`/customers/${customerId}/360`),
        api.get(`/customers/${customerId}/journey`)
      ]);
      if (res360.data.success) setData(res360.data.data);
      if (resJ.data.success) setJourney(resJ.data.data.timeline || []);
    } catch (err) {
      console.error('Failed to load Customer 360 profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {data?.profile?.firstName?.[0] || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{data?.profile?.name || 'Loading Customer...'}</h2>
                {data?.rfm?.segmentName && <StatusBadge status={data.rfm.segmentName} />}
                {data?.predictions?.churnRisk && <StatusBadge status={data.predictions.churnRisk} type="risk" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Customer ID #{customerId} • Registered {data?.profile?.registrationDate?.slice(0, 10)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          {[
            { id: 'overview', label: '360 Overview' },
            { id: 'journey', label: 'Customer Journey Timeline' },
            { id: 'recommendations', label: 'Recommendations & Actions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
              <span>Loading Customer 360 unified profile...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Demographics & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Contact & Geography</p>
                      <p className="text-slate-200 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {data.profile.email}</p>
                      <p className="text-slate-200 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {data.profile.phone || 'N/A'}</p>
                      <p className="text-slate-200 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {data.profile.city}, {data.profile.state}, {data.profile.country}</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">Acquisition & Channel</p>
                      <p className="text-slate-200"><span className="text-slate-400">Acquisition Channel:</span> <span className="font-semibold">{data.profile.acquisitionChannel}</span></p>
                      <p className="text-slate-200"><span className="text-slate-400">Preferred Channel:</span> <span className="font-semibold">{data.profile.preferredChannel}</span></p>
                      <p className="text-slate-200"><span className="text-slate-400">Status:</span> <StatusBadge status={data.profile.status} /></p>
                    </div>
                  </div>

                  {/* Transactional & Financial Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Total Spend</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">${data.transactions.totalSpend.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Orders Count</p>
                      <p className="text-xl font-bold text-white mt-1">{data.transactions.orderCount}</p>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Order Value</p>
                      <p className="text-xl font-bold text-white mt-1">${data.transactions.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Recency</p>
                      <p className="text-xl font-bold text-indigo-400 mt-1">{data.transactions.daysSinceLastOrder ?? 'N/A'} days</p>
                    </div>
                  </div>

                  {/* RFM & Predictive Machine Learning Signals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RFM Card */}
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-400" /> RFM Score Breakdown
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Cell #{data.rfm?.rfmCell || 'N/A'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-900/60 p-2 rounded-lg">
                          <p className="text-slate-400 text-[10px]">Recency (R)</p>
                          <p className="text-lg font-bold text-white">{data.rfm?.rScore || '-'}/5</p>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg">
                          <p className="text-slate-400 text-[10px]">Frequency (F)</p>
                          <p className="text-lg font-bold text-white">{data.rfm?.fScore || '-'}/5</p>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg">
                          <p className="text-slate-400 text-[10px]">Monetary (M)</p>
                          <p className="text-lg font-bold text-white">{data.rfm?.mScore || '-'}/5</p>
                        </div>
                      </div>
                    </div>

                    {/* Predictive Machine Learning Card */}
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-400" /> Machine Learning Signals
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-slate-400">Churn Probability:</span>
                          <span className="font-bold text-rose-400">
                            {data.predictions?.churnProbability !== null ? `${(data.predictions.churnProbability * 100).toFixed(1)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-slate-400">Predicted 180-Day CLV:</span>
                          <span className="font-bold text-emerald-400">
                            ${data.predictions?.predictedClv180d !== null ? data.predictions.predictedClv180d.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-slate-400">K-Means Cluster:</span>
                          <span className="font-medium text-indigo-300">
                            {data.predictions?.clusterLabel || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Channel Digital & Support Telemetry */}
                  <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Multi-Channel Telemetry Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-[10px]">Web Sessions</p>
                        <p className="text-base font-bold text-white">{data.digitalEngagement.webSessionCount}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-[10px]">Campaign Clicks</p>
                        <p className="text-base font-bold text-white">{data.marketingEngagement.campaignClicks}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-[10px]">Emails Opened</p>
                        <p className="text-base font-bold text-white">{data.marketingEngagement.emailsOpened}</p>
                      </div>
                      <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                        <p className="text-slate-400 text-[10px]">Support Tickets</p>
                        <p className="text-base font-bold text-white">{data.supportAndFeedback.ticketCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'journey' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Chronological multi-channel activity trace reconstructed from real MySQL event logs</p>
                  <div className="relative border-l-2 border-slate-800 pl-6 space-y-6 ml-2">
                    {journey.map((item, idx) => (
                      <div key={idx} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-900"></div>

                        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5 shadow-md">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-white">{item.title}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-900 font-mono text-[10px] text-indigo-300 border border-slate-800">
                              {item.channel}
                            </span>
                            {item.details && (
                              <span>{JSON.stringify(item.details)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Active Explainable Recommendations</h4>
                  {data.recommendations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                      No active recommendations generated for this customer profile.
                    </div>
                  ) : (
                    data.recommendations.map(rec => (
                      <div key={rec.id} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-400" /> {rec.type}
                          </span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={rec.priority} />
                            <StatusBadge status={rec.status} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed mb-3">{rec.reason}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                          <span>Target Channel: <strong className="text-white">{rec.recommendedChannel}</strong></span>
                          <span>Created {new Date(rec.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
