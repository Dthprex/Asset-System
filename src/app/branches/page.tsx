'use client';

import React, { useState, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import { 
  Store, 
  Building2, 
  Laptop, 
  MapPin, 
  Tag, 
  Coins, 
  History, 
  ArrowRight 
} from 'lucide-react';
import { formatLKR } from '@/lib/utils';

function BranchesContent() {
  const { branches, assets, openDetail } = useApp();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  const branchStats = branches.map((b) => {
    const branchAssets = assets.filter((a) => a.currentAssignment?.locationOrBranch === b.name);
    const totalValue = branchAssets.reduce((sum, a) => sum + (Number(a.purchaseAmount) || 0), 0);
    return {
      ...b,
      assets: branchAssets,
      count: branchAssets.length,
      totalValue,
    };
  });

  const activeBranch = branchStats.find((b) => b.id === selectedBranchId);
  const displayedAssets = activeBranch ? activeBranch.assets : assets;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Showrooms & Regional Deployments</h1>
        <p className="text-xs text-slate-500">
          Track hardware equipment, POS terminals, and digital iPads deployed across cosmetics.lk retail outlets
        </p>
      </div>

      {/* Showrooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* All Showrooms Card */}
        <button
          onClick={() => setSelectedBranchId('ALL')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedBranchId === 'ALL'
              ? 'bg-[#fbf5ef] border-[#c28551] shadow-xs ring-1 ring-[#c28551]/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Locations</span>
            <div className="text-sm font-bold text-slate-900 mt-1">Entire Network</div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#c28551]">{assets.length} Total Devices</span>
            <span className="text-slate-400 text-[11px]">8 Branches</span>
          </div>
        </button>

        {/* Individual Showrooms */}
        {branchStats.map((b) => {
          const isSelected = selectedBranchId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#fbf5ef] border-[#c28551] shadow-xs ring-1 ring-[#c28551]/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{b.code}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600">
                    {b.type}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{b.name}</div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="font-bold text-[#c28551]">{b.count} {b.count === 1 ? 'Device' : 'Devices'}</span>
                <span className="font-semibold text-slate-700 text-[11px]">{formatLKR(b.totalValue)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Equipment Deployed at Selected Showroom */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#c28551]" />
            <span>
              {activeBranch ? `Hardware Deployed at ${activeBranch.name} (${displayedAssets.length})` : `All Deployed Hardware (${displayedAssets.length})`}
            </span>
          </h2>

          {selectedBranchId !== 'ALL' && (
            <button
              onClick={() => setSelectedBranchId('ALL')}
              className="text-xs font-semibold text-[#c28551] hover:text-[#a66c3b]"
            >
              Show All Showrooms
            </button>
          )}
        </div>

        {displayedAssets.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
            <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">No equipment currently assigned to this showroom</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Use the inventory tab or assign modal to deploy hardware here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayedAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => openDetail(asset)}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#c28551]/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20">
                      {asset.assetTag}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 truncate mt-1">{asset.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium truncate text-[11px]">
                    {asset.currentAssignment?.assignedToName || 'Unassigned'}
                  </span>
                  <span className="font-bold text-slate-900 text-[11px]">
                    {formatLKR(asset.purchaseAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default function BranchesPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading showrooms...</div>}>
        <BranchesContent />
      </Suspense>
    </AppShell>
  );
}
