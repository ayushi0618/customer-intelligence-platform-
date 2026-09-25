import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Customer360Modal from '../components/customer/Customer360Modal';
import {
  Search,
  Filter,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState('');
  const [churnRisk, setChurnRisk] = useState('');
  const [channel, setChannel] = useState('');

  // Selected customer for 360 modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, [page, segment, churnRisk, channel]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        segment,
        churnRisk,
        channel
      });
      const res = await api.get(`/customers?${params.toString()}`);
      if (res.data.success) {
        setCustomers(res.data.data);
        setTotal(res.data.meta.total);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Directory & Intelligence</h2>
          <p className="text-xs text-slate-400">Search and filter across {total.toLocaleString()} unified customer profiles</p>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={segment}
            onChange={(e) => { setSegment(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All RFM Segments</option>
            <option value="Champions">Champions</option>
            <option value="Loyal Customers">Loyal Customers</option>
            <option value="Potential Loyalists">Potential Loyalists</option>
            <option value="New Customers">New Customers</option>
            <option value="Need Attention">Need Attention</option>
            <option value="At Risk">At Risk</option>
            <option value="Lost Customers">Lost Customers</option>
          </select>

          <select
            value={churnRisk}
            onChange={(e) => { setChurnRisk(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Churn Tiers</option>
            <option value="HIGH">High Churn Risk</option>
            <option value="MEDIUM">Medium Churn Risk</option>
            <option value="LOW">Low Churn Risk</option>
          </select>

          <button
            type="submit"
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </form>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 uppercase text-[10px] font-semibold text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact & Location</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Total Spend</th>
                <th className="py-3 px-4">RFM Segment</th>
                <th className="py-3 px-4">Churn Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading customer data from MySQL database...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No matching customer records found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div>{c.email}</div>
                      <div className="text-[10px] text-slate-500">{c.city}, {c.state}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{c.acquisition_channel}</td>
                    <td className="py-3 px-4 font-semibold text-white">{c.order_count}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      ${parseFloat(c.total_spend).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.rfm_segment} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.churn_risk} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomerId(c.id)}
                        className="py-1 px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-[11px] font-medium flex items-center gap-1.5 ml-auto transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360 Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {page} of {totalPages} ({total.toLocaleString()} total customers)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer 360 Slide-Out Drawer Modal */}
      {selectedCustomerId && (
        <Customer360Modal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
