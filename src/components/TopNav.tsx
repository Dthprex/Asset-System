'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

interface TopNavProps {
  onOpenNewAssetModal: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sidebarCollapsed?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenNewAssetModal,
  onRefresh,
  isRefreshing = false,
  searchQuery = '',
  onSearchChange,
  sidebarCollapsed = false,
}) => {
  const [colomboTime, setColomboTime] = useState<string>('');

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
      setColomboTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/95 backdrop-blur-xl border-b border-[#f0e6de] px-4 sm:px-8 flex items-center justify-between gap-4">
      
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-[#c28551]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Global Fleet Search (Tag, Serial, Dual IMEI, Custodian, Vendor)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs sm:text-sm text-[#1d2939] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Asia/Colombo Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#fbf5ef] border border-[#ead7c7] text-xs">
          <span className="w-2 h-2 rounded-full bg-[#c28551] animate-pulse"></span>
          <span className="font-semibold text-[#c28551]">Colombo Time:</span>
          <span className="font-mono text-[#1d2939] font-medium">{colomboTime || 'Syncing...'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Inventory"
            className="p-2.5 rounded-xl border border-[#f0e6de] text-slate-600 hover:text-[#1d2939] hover:bg-[#faf7f3] transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#c28551]' : ''}`} />
          </button>
        )}

        {/* Primary Intake Button in cosmetics.lk signature gold */}
        <button
          onClick={onOpenNewAssetModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 hover:shadow-lg hover:shadow-[#c28551]/30 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Intake New Hardware</span>
        </button>

      </div>

    </header>
  );
};
