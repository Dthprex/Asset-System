'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { AppShell, useApp } from '@/components/AppShell';
import { 
  Coins, 
  Laptop, 
  Store, 
  ClockAlert, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  Plus
} from 'lucide-react';
import { formatLKR, formatDate } from '@/lib/utils';

function DashboardContent() {
  const { stats, assets, openDetail, openAssign, openReturn, openNewIntake } = useApp();

  const metrics = [
    {
      title: 'Total Fleet Value',
      value: formatLKR(stats.totalValueLKR),
      subtext: `${stats.totalAssets} tracked hardware items`,
      icon: Coins,
      color: 'text-[#c28551]',
      bgColor: 'bg-[#fbf5ef]',
      borderColor: 'border-[#ead7c7]',
    },
    {
      title: 'Ready in IT Lab',
      value: stats.availableCount,
      subtext: 'Available for immediate dispatch',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Showroom Deployments',
      value: stats.allocatedCount,
      subtext: `${stats.totalBranches} retail stores & depts`,
      icon: Store,
      color: 'text-[#c28551]',
      bgColor: 'bg-[#fbf5ef]',
      borderColor: 'border-[#ead7c7]',
    },
    {
      title: 'Temporary Loans',
      value: stats.borrowedCount,
      subtext: 'Photo shoots & short assignments',
      icon: ClockAlert,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Under Repair',
      value: stats.repairCount,
      subtext: 'Service center tickets',
      icon: Wrench,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
    },
    {
      title: 'Warranty Alert',
      value: `${stats.expiringWarrantyCount} Expiring`,
      subtext: `${stats.expiredWarrantyCount} expired warranties`,
      icon: ShieldAlert,
      color: 'text-[#c28551]',
      bgColor: 'bg-[#fbf5ef]',
      borderColor: 'border-[#ead7c7]',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner in cosmetics.lk signature gold theme */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#fbf3ec] via-[#fdfbf9] to-transparent border border-[#ead7c7] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
              Operations Command
            </span>
            <span className="text-xs text-slate-400">• cosmetics.lk IT Infrastructure</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1d2939] tracking-tight">
            Enterprise Fleet & Custody Command Center
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Real-time tracking of computers, cameras, barcode scanners, and tablets across Colombo Flagship, Kandy City Centre, Nawala HQ, and regional showrooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="px-4 py-2.5 rounded-xl border border-[#ead7c7] hover:bg-white text-[#1d2939] text-xs font-semibold transition"
          >
            Browse Fleet
          </Link>
          <button
            onClick={openNewIntake}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Intake Item</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border ${m.borderColor} shadow-xs space-y-3 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 truncate">{m.title}</span>
                <div className={`p-1.5 rounded-lg ${m.bgColor} ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-lg font-extrabold text-[#1d2939] tracking-tight">{m.value}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{m.subtext}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Activity & Quick Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Fleet Spotlight */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1d2939] flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#c28551]" />
              <span>Recently Updated Fleet Hardware</span>
            </h2>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-[#c28551] hover:text-[#b07440] flex items-center gap-1"
            >
              <span>View All ({assets.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assets.slice(0, 4).map((asset) => (
              <div
                key={asset.id}
                onClick={() => openDetail(asset)}
                className="p-4 rounded-2xl bg-white border border-[#f0e6de] hover:border-[#c28551] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-[#f0e6de]">
                    <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded-md border border-[#ead7c7]">
                        {asset.assetTag}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{asset.category}</span>
                    </div>
                    <h3 className="text-xs font-bold text-[#1d2939] truncate mt-1">{asset.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f4ebe4] flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 truncate">
                    {asset.currentAssignment ? asset.currentAssignment.locationOrBranch : 'Ready in IT Lab'}
                  </span>
                  <span className="font-bold text-[#c28551]">{formatLKR(asset.purchaseAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Recent Custody Audit Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1d2939] flex items-center gap-2">
              <History className="w-4 h-4 text-[#c28551]" />
              <span>Custody Activity Log</span>
            </h2>
            <span className="text-[11px] text-slate-400">Live feed</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] space-y-3.5 shadow-xs">
            {stats.recentHistory && stats.recentHistory.slice(0, 5).map((h: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 text-xs pb-3 border-b border-[#f4ebe4] last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-[#c28551] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold uppercase text-[#1d2939]">{h.action.replace('_', ' ')}</span>
                    <span className="font-mono">{formatDate(h.date)}</span>
                  </div>
                  <div className="font-semibold text-slate-800 truncate">
                    {h.newHolder}
                  </div>
                  {h.damages && (
                    <div className="text-[10px] text-rose-600 font-medium truncate mt-0.5">
                      Damage: {h.damages}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading fleet dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}
