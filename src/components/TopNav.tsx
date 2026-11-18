'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw,
  Scan,
  Receipt,
  Database,
  KeyRound,
  Lock,
  FileSpreadsheet
} from 'lucide-react';

interface TopNavProps {
  onOpenNewAssetModal: () => void;
  onOpenScanner?: () => void;
  onOpenInvoices?: () => void;
  onOpenAuditReport?: () => void;
  onOpenSecuritySettings?: () => void;
  onLockPortal?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sidebarCollapsed?: boolean;
  dbStatus?: {
    connected: boolean;
    mode: 'SUPABASE_CLOUD' | 'FALLBACK_LOCAL';
    message: string;
  };
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenNewAssetModal,
  onOpenScanner,
  onOpenInvoices,
  onOpenAuditReport,
  onOpenSecuritySettings,
  onLockPortal,
  onRefresh,
  isRefreshing = false,
  searchQuery = '',
  onSearchChange,
  sidebarCollapsed = false,
  dbStatus,
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
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-[#f0e6de]/80 px-4 sm:px-8 flex items-center justify-between gap-4 transition-all duration-200">
      
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-[#c28551] transition-transform duration-200 group-focus-within:scale-110" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Global Fleet Search (Tag, Serial, Dual IMEI, Custodian, Vendor)..."
          className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[#fdfbf9]/90 border border-[#f0e6de] text-xs sm:text-sm text-[#1d2939] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551] focus:bg-white shadow-2xs transition-all duration-150"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Live Database Status Pill */}
        {dbStatus && (
          <div
            title={dbStatus.message}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold shadow-2xs cursor-help ${
              dbStatus.connected
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/90 border-amber-200 text-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Database className="w-3.5 h-3.5" />
            <span>{dbStatus.connected ? 'Supabase Cloud' : 'Fallback Mode'}</span>
          </div>
        )}

        {/* Asia/Colombo Live Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-pill text-xs shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#c28551] animate-pulse"></span>
          <span className="font-bold text-[#c28551]">Colombo:</span>
          <span className="font-mono text-[#1d2939] font-semibold">{colomboTime || 'Syncing...'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Inventory"
            className="p-2.5 rounded-xl border border-[#f0e6de] text-slate-600 hover:text-[#1d2939] hover:bg-[#faf7f3] transition disabled:opacity-50 cursor-pointer btn-press-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#c28551]' : ''}`} />
          </button>
        )}

        {/* Password & Security Settings Button */}
        {onOpenSecuritySettings && (
          <button
            onClick={onOpenSecuritySettings}
            title="Password & Recovery Settings"
            className="p-2.5 rounded-xl border border-[#f0e6de] text-slate-600 hover:text-[#c28551] hover:bg-[#fbf5ef] transition cursor-pointer btn-press-sm"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        )}

        {/* Lock Portal Button */}
        {onLockPortal && (
          <button
            onClick={onLockPortal}
            title="Lock Portal (Sign Out)"
            className="p-2.5 rounded-xl border border-[#f0e6de] text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer btn-press-sm"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Hardware Barcode & QR Scanner Trigger */}
        {onOpenScanner && (
          <button
            onClick={onOpenScanner}
            title="Scan Hardware Tag (⌘B)"
            className="px-3.5 py-2.5 rounded-xl border border-[#c28551]/30 bg-white hover:bg-[#fbf5ef] text-slate-700 hover:text-[#c28551] text-xs font-semibold shadow-2xs transition flex items-center gap-2 cursor-pointer btn-press-sm"
          >
            <Scan className="w-4 h-4 text-[#c28551]" />
            <span className="hidden sm:inline">Scan Tag</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200">
              ⌘B
            </kbd>
          </button>
        )}

        {/* Manager Audit Report & Excel/CSV Export */}
        {onOpenAuditReport && (
          <button
            onClick={onOpenAuditReport}
            title="Manager's Full Fleet Audit Report & Excel/CSV Export"
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-2xs transition flex items-center gap-2 cursor-pointer btn-press-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Audit Report / Export</span>
          </button>
        )}

        {/* Central Invoices & Receipts Vault */}
        {onOpenInvoices && (
          <button
            onClick={onOpenInvoices}
            title="Fleet Invoices, Vendor Repair Bills & Return Evidence"
            className="px-3.5 py-2.5 rounded-xl border border-[#c28551]/30 bg-white hover:bg-[#fbf5ef] text-slate-700 hover:text-[#c28551] text-xs font-semibold shadow-2xs transition flex items-center gap-2 cursor-pointer btn-press-sm"
          >
            <Receipt className="w-4 h-4 text-[#c28551]" />
            <span className="hidden lg:inline">Invoices & Bills</span>
          </button>
        )}

        {/* Primary Intake Button in cosmetics.lk signature gold */}
        <button
          onClick={onOpenNewAssetModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 hover:shadow-lg hover:shadow-[#c28551]/30 transition-all flex items-center gap-2 cursor-pointer btn-press"
        >
          <Plus className="w-4 h-4" />
          <span className="tracking-wide">Intake New Hardware</span>
        </button>

      </div>

    </header>
  );
};
