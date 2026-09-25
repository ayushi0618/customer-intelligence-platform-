import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { BrainCircuit, RefreshCw, Activity, Award, ShieldAlert, Cpu } from 'lucide-react';

export default function MlDashboardPage() {
  const [models, setModels] = useState([]);
  const [churnPredictions, setChurnPredictions] = useState([]);
  const [clvPredictions, setClvPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    fetchMlData();
  }, []);

  const fetchMlData = async () => {
    setLoading(true);
    try {
      const [mRes, churnRes, clvRes] = await Promise.all([
        api.get('/ml/models'),
        api.get('/predictions/churn?limit=10'),
        api.get('/predictions/clv?limit=10')
      ]);

      if (mRes.data.success) setModels(mRes.data.data);
      if (churnRes.data.success) setChurnPredictions(churnRes.data.data);
      if (clvRes.data.success) setClvPredictions(clvRes.data.data);
    } catch (err) {
      console.error('Failed to load ML metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrainAll = async () => {
    setTraining(true);
    try {
      await api.post('/ml/predict/batch');
      await fetchMlData();
    } catch (err) {
      console.error('Batch retraining failed:', err);
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Machine Learning Governance & Prediction Registry</h2>
          <p className="text-xs text-slate-400">Scikit-learn model governance, evaluation metrics, and batch inference from Python microservice</p>
        </div>

        <button
          onClick={handleRetrainAll}
          disabled={training}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
          <span>{training ? 'Executing ML Pipeline...' : 'Trigger Batch Retraining & Inference'}</span>
        </button>
      </div>

      {/* Active Model Governance Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" /> Active Model Runs (`model_runs` MySQL Registry)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Model Type</th>
                <th className="py-3 px-4">Model Version</th>
                <th className="py-3 px-4">Training Rows</th>
                <th className="py-3 px-4">Primary Evaluation Metrics</th>
                <th className="py-3 px-4">Trained Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">Loading model governance registry...</td>
                </tr>
              ) : models.map((m) => (
                <tr key={m.id} className="hover:bg-slate-700/40">
                  <td className="py-3 px-4 font-semibold text-white">{m.modelType}</td>
                  <td className="py-3 px-4 font-mono text-indigo-400">{m.modelVersion}</td>
                  <td className="py-3 px-4 text-slate-300">{m.trainingRowCount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {m.modelType === 'CHURN_CLASSIFICATION' && (
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-emerald-400 font-bold">ROC-AUC: {m.metrics?.roc_auc?.toFixed(4)}</span>
                        <span className="text-slate-400 block">F1: {m.metrics?.f1_score?.toFixed(4)} | PR-AUC: {m.metrics?.pr_auc?.toFixed(4)}</span>
                      </div>
                    )}
                    {m.modelType === 'CLV_REGRESSION' && (
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-emerald-400 font-bold">R² Score: {m.metrics?.r2_score?.toFixed(4)}</span>
                        <span className="text-slate-400 block">MAE: ${m.metrics?.mae?.toFixed(2)} | RMSE: ${m.metrics?.rmse?.toFixed(2)}</span>
                      </div>
                    )}
                    {m.modelType === 'KMEANS_CLUSTERING' && (
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-emerald-400 font-bold">Silhouette: {m.metrics?.silhouette_score?.toFixed(4)}</span>
                        <span className="text-slate-400 block">Clusters (K): {m.metrics?.n_clusters}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{new Date(m.trainingTimestamp).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Churn Risk Predictions Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Top High-Risk Churn Scored Customers</h3>
          <p className="text-xs text-slate-400 mb-4">Supervised binary classification inference results</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Churn Prob</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {churnPredictions.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 font-medium text-white">{cp.customerName}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-400">{(cp.churnProbability * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={cp.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Projected CLV Predictions Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Top Predicted 180-Day Customer Lifetime Value</h3>
          <p className="text-xs text-slate-400 mb-4">Supervised continuous regression inference results</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Predicted 180d CLV</th>
                  <th className="py-2.5 px-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clvPredictions.map((clv) => (
                  <tr key={clv.id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 font-medium text-white">{clv.customerName}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">${clv.predictedClv.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{clv.preferredChannel}</td>
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
