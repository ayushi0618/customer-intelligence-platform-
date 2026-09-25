import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PieChart,
  Filter,
  Megaphone,
  GitCompare,
  BrainCircuit,
  Lightbulb,
  ShieldAlert,
  LogOut,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customer 360', path: '/customers', icon: Users },
    { label: 'RFM Segments', path: '/segments', icon: PieChart },
    { label: 'Conversion Funnel', path: '/funnel', icon: Filter },
    { label: 'Marketing Campaigns', path: '/campaigns', icon: Megaphone },
    { label: 'Attribution Models', path: '/attribution', icon: GitCompare },
    { label: 'Machine Learning', path: '/ml', icon: BrainCircuit },
    { label: 'Recommendations', path: '/recommendations', icon: Lightbulb },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">CUSTOMER 360</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Intelligence Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 gap-3 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.roles?.[0] || 'User'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
