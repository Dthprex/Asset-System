'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import {
  ShieldCheck,
  ShieldAlert,
  Wrench,
  AlertTriangle,
  History,
  MapPin,
  Clock
} from 'lucide-react';
import { formatLKR, formatDate, getWarrantyInfo } from '@/lib/utils';

function WarrantyContent() {
  const { assets, openDetail } = useApp();
  const [filterTab, setFilterTab] = useState<'all' | 'expiring' | 'repair' | 'expired'>('all');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  }, []);

  const in30Days = currentDate ? new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;

  const categorized = assets.map((a) => {
    const wInfo = getWarrantyInfo(a.warrantyEndDate, currentDate || undefined);
    const isRepair = a.status === 'UNDER_REPAIR' || a.condition.toLowerCase().includes('damage');
    const wDate = a.warrantyEndDate ? new Date(a.warrantyEndDate) : null;
    const isExpiringSoon = currentDate && in30Days && wDate ? (wDate >= currentDate && wDate <= in30Days) : false;
    const isExpired = currentDate && wDate ? (wDate < currentDate) : false;

    return {
      ...a,
      warrantyInfo: wInfo,
      isRepair,
      isExpiringSoon,
      isExpired,
    };
  });

  const displayedAssets = categorized.filter((a) => {
    if (filterTab === 'expiring') return a.isExpiringSoon;
    if (filterTab === 'repair') return a.isRepair;
    if (filterTab === 'expired') return a.isExpired;
    return true;
  });

  const expiringCount = categorized.filter((a) => a.isExpiringSoon).length;
  const repairCount = categorized.filter((a) => a.isRepair).length;
  const expiredCount = categorized.filter((a) => a.isExpired).length;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#c28551]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f4e6d8] text-[#844c1d] border border-[#c28551]/30">
              Maintenance & Coverage
            </span>
            <span className="text-xs text-slate-400">• Warranty Tracking</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Warranty Alerts & Repair Tickets
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Monitor supplier warranties (Future World, CameraLK, Singer Mega, Softlogic) and track devices currently sent for warranty repairs or damage service.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-3 rounded-2xl bg-white border border-[#c28551]/30 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Under Repair</span>
            <span className="text-base font-extrabold text-[#c28551]">{repairCount} Devices</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${filterTab === 'all'
              ? 'bg-[#fbf5ef] text-[#a66c3b] border border-[#c28551]/30 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          All Fleet Warranties ({assets.length})
        </button>

        <button
          onClick={() => setFilterTab('expiring')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${filterTab === 'expiring'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Expiring in 30 Days ({expiringCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('repair')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${filterTab === 'repair'
              ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <Wrench className="w-3.5 h-3.5 text-rose-600" />
          <span>Under Repair & Damaged ({repairCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('expired')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${filterTab === 'expired'
              ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          Expired Coverage ({expiredCount})
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => openDetail(asset)}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#c28551]/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20">
                  {asset.assetTag}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${asset.warrantyInfo.badgeClass}`}>
                  {asset.warrantyInfo.statusText}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{asset.name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
            </div>

            {/* Repair / Damage notice if applicable */}
            {asset.isRepair && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Service Ticket / Repair Status:</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  {asset.currentAssignment?.purpose || 'Sent to service center for inspection.'}
                </p>
              </div>
            )}

            {/* Vendor & Price */}
            <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Vendor:</span>
                <span className="font-semibold text-slate-800">{asset.purchaseLocation}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Warranty Expiration:</span>
                <span className="font-semibold text-slate-800 font-mono">{formatDate(asset.warrantyEndDate)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Fleet Value:</span>
                <span className="font-bold text-[#c28551]">{formatLKR(asset.purchaseAmount)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#c28551] font-semibold">
              <span>View Hardware Audit Dossier</span>
              <History className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function WarrantyPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading warranty desk...</div>}>
        <WarrantyContent />
      </Suspense>
    </AppShell>
  );
}
