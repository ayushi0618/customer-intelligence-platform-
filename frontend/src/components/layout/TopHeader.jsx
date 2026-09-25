import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Sparkles } from 'lucide-react';

export default function TopHeader({ title = 'Analytics Dashboard', subtitle }) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Live system status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>MySQL 8 Core Online</span>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>{user?.roles?.[0] || 'Executive'}</span>
        </div>
      </div>
    </header>
  );
}
