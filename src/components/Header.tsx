'use client';

import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Plus, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  RefreshCw 
} from 'lucide-react';

interface HeaderProps {
  onOpenNewAssetModal: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalAssetsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewAssetModal,
  onRefresh,
  isRefreshing,
  totalAssetsCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Colombo',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now);
      setCurrentTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 text-pink-400">
                <Laptop className="w-6 h-6" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold tracking-tight text-xl sm:text-2xl bg-gradient-to-r from-pink-400 via-rose-300 to-purple-300 bg-clip-text text-transparent">
                  cosmetics.lk
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-full">
                  IT Infrastructure
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Enterprise Asset & Custody Lifecycle System</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-slate-300 font-medium">{totalAssetsCount} Tracked Items</span>
              </p>
            </div>
          </div>

          {/* Timezone & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Asia/Colombo Live Clock */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-pink-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Asia/Colombo:</span>
              </div>
              <span className="font-mono text-slate-200">{currentTime || 'Loading time...'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh inventory"
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenNewAssetModal}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden rounded-xl font-medium group transition"
            >
              <span className="w-full h-full bg-gradient-to-br from-pink-500 via-rose-500 to-indigo-600 group-hover:from-pink-600 group-hover:via-rose-600 group-hover:to-indigo-700 absolute"></span>
              <span className="relative px-4 py-2 transition-all ease-in duration-150 bg-slate-950 rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2 text-sm text-white font-semibold shadow-lg shadow-pink-500/20">
                <Plus className="w-4 h-4 text-pink-400 group-hover:text-white transition" />
                <span>Intake New Item</span>
              </span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
