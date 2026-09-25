import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { Lightbulb, Filter, RefreshCw, CheckCircle2, XCircle, ArrowUpRight, MessageSquare } from 'lucide-react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [type, setType] = useState('');

  // Status update modal / inline action state
  const [actionRecId, setActionRecId] = useState(null);
  const [actionStatus, setActionStatus] = useState('ACCEPTED');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [page, status, priority, type]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        status,
        priority,
        type
      });
      const res = await api.get(`/recommendations?${params.toString()}`);
      if (res.data.success) {
        setRecommendations(res.data.data);
        setTotal(res.data.meta.total);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/recommendations/generate');
      await fetchRecommendations();
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/recommendations/${id}/status`, {
        status: newStatus,
        notes: actionNotes || `Status updated to ${newStatus}`
      });
      setActionRecId(null);
      setActionNotes('');
      fetchRecommendations();
    } catch (err) {
      console.error('Failed to update recommendation status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Marketing Decision Support & Recommendation Engine</h2>
          <p className="text-xs text-slate-400">Explainable marketing rules evaluating Customer 360, RFM, ML predictions, and support status</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Evaluating Rules...' : 'Re-Evaluate Recommendation Rules'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Priority:</label>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Status:</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Rule Type:</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Recommendation Types</option>
            <option value="WIN_BACK_DISCOUNT">Win-Back Discount</option>
            <option value="VIP_LOYALTY">VIP Loyalty Perks</option>
            <option value="CROSS_SELL">Cross-Sell Category</option>
            <option value="FEEDBACK_REQUEST">Request Feedback</option>
            <option value="REDUCE_FREQUENCY">Reduce Communication Frequency</option>
            <option value="RESOLVE_SUPPORT_FIRST">Resolve Support Issue First</option>
          </select>
        </div>
      </div>

      {/* Recommendation Grid / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Evaluating recommendation rules...</div>
        ) : recommendations.length === 0 ? (
          <div className="p-12 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400">
            No active recommendations match the selected filters.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> {rec.type}
                  </span>
                  <StatusBadge status={rec.priority} />
                  <StatusBadge status={rec.status} />
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span>Target Customer: {rec.customerName}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-normal">{rec.customerEmail}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {rec.reason}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Recommended Channel: <strong className="text-slate-200">{rec.recommendedChannel}</strong></span>
                  <span>Created {new Date(rec.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Workflow Buttons */}
              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-700/60 flex-shrink-0">
                {rec.status !== 'ACCEPTED' && rec.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, 'ACCEPTED')}
                    className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Action</span>
                  </button>
                )}

                {rec.status !== 'DISMISSED' && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, 'DISMISSED')}
                    className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                )}

                {rec.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, 'COMPLETED')}
                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
