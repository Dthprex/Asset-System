'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import { 
  Laptop, 
  Search, 
  LayoutGrid, 
  ListFilter, 
  X, 
  History, 
  ArrowRightLeft, 
  RotateCcw, 
  Clock
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatLKR, formatDate, getWarrantyInfo } from '@/lib/utils';
import { CATEGORIES, STATUSES } from '@/components/AssetFilters';

function InventoryContent() {
  const { assets, branches, openDetail, openAssign, openReturn, searchQuery, setSearchQuery } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          a.name.toLowerCase().includes(q) ||
          a.assetTag.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          (a.imei1 && a.imei1.includes(q)) ||
          (a.imei2 && a.imei2.includes(q)) ||
          (a.currentAssignment?.assignedToName.toLowerCase().includes(q)) ||
          (a.purchaseLocation.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && a.status !== selectedStatus) {
        return false;
      }

      // Branch
      if (selectedBranch !== 'ALL' && a.currentAssignment?.locationOrBranch !== selectedBranch) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, selectedCategory, selectedStatus, selectedBranch]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedBranch('ALL');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1d2939] tracking-tight">Fleet Hardware Inventory</h1>
          <p className="text-xs text-slate-500">
            Audit hardware assets, dual IMEI registrations, warranties, and custody records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-[#faece2] text-[#c28551] border border-[#ead7c7] text-xs font-semibold">
            {filteredAssets.length} of {assets.length} Items Listed
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-xs space-y-3.5">
        
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c28551]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tag, Serial, Dual IMEI, Custodian Name, Location..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-[#1d2939] focus:outline-none focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Branch Selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-[#1d2939] cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Branches & Showrooms</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-[#1d2939] cursor-pointer focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#fbf5ef] border border-[#ead7c7] shadow-2xs">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition cursor-pointer btn-press-sm ${
                  viewMode === 'table' ? 'bg-white text-[#c28551] shadow-xs glow-terracotta-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition cursor-pointer btn-press-sm ${
                  viewMode === 'grid' ? 'bg-white text-[#c28551] shadow-xs glow-terracotta-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedBranch !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551] text-xs font-semibold transition btn-press-sm"
              >
                Reset
              </button>
            )}
          </div>

        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border btn-press-sm ${
                  isSelected
                    ? 'bg-[#faece2] text-[#c28551] border-[#c28551] shadow-xs glow-terracotta-sm font-bold'
                    : 'bg-white/90 text-slate-600 border-[#f0e6de] hover:border-[#ead7c7] hover:text-[#1d2939] hover:bg-[#fbf5ef]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Assets Presentation */}
      {filteredAssets.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-[#f0e6de] p-6">
          <Laptop className="w-12 h-12 text-[#ead7c7] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1d2939]">No matching assets found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, or intake a new hardware device into inventory.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551] text-xs font-semibold transition"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="w-full overflow-x-auto rounded-2xl border border-[#f0e6de] bg-white shadow-xs">
          <table className="w-full text-left text-xs text-[#1d2939]">
            <thead className="bg-[#fdfbf9] text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#f0e6de]">
              <tr>
                <th className="py-3 px-4">Tag & Category</th>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Serial / Dual IMEI</th>
                <th className="py-3 px-4">Current Custody & Branch</th>
                <th className="py-3 px-4">Price (LKR)</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f0e9]">
              {filteredAssets.map((asset) => {
                const warranty = getWarrantyInfo(asset.warrantyEndDate);
                const isBorrowed = asset.status === 'BORROWED_TEMPORARY';
                const isRepair = asset.status === 'UNDER_REPAIR';

                return (
                  <tr 
                    key={asset.id}
                    className="hover:bg-[#fbf7f3] transition group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#c28551]">{asset.assetTag}</div>
                      <div className="text-[11px] text-slate-400">{asset.category}</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div 
                        onClick={() => openDetail(asset)}
                        className="font-bold text-[#1d2939] group-hover:text-[#c28551] transition cursor-pointer truncate"
                      >
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {asset.brand} {asset.modelNumber ? `• ${asset.modelNumber}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-slate-700">{asset.serialNumber}</div>
                      {asset.hasSim && (
                        <div className="text-[10px] text-[#c28551] font-semibold">
                          IMEI: {asset.imei1?.slice(0, 8)}...
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      {asset.currentAssignment ? (
                        <div>
                          <div className="font-semibold text-[#1d2939] truncate flex items-center gap-1.5">
                            {isBorrowed && <Clock className="w-3 h-3 text-amber-600" />}
                            {isRepair && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                            <span>{asset.currentAssignment.assignedToName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {asset.currentAssignment.locationOrBranch}
                          </div>
                          {asset.currentAssignment.expectedReturnDate && (
                            <div className="text-[10px] text-amber-700 font-semibold font-mono">
                              Due: {formatDate(asset.currentAssignment.expectedReturnDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Ready in IT Lab</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-[#1d2939]">
                      {formatLKR(asset.purchaseAmount)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${warranty.badgeClass}`}>
                        {warranty.statusText}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(asset)}
                          title="View Specs & Timeline"
                          className="p-1.5 rounded-lg border border-[#f0e6de] text-slate-600 hover:text-[#1d2939] hover:bg-[#fbf5ef] transition cursor-pointer btn-press-sm"
                        >
                          <History className="w-3.5 h-3.5 text-[#c28551]" />
                        </button>

                        {asset.currentAssignment ? (
                          <button
                            onClick={() => openReturn(asset)}
                            title="Return and Damage Inspection"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer btn-press-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openAssign(asset)}
                            title="Deploy or Loan"
                            className="p-1.5 rounded-lg bg-[#1d2939] hover:bg-[#c28551] text-white transition cursor-pointer btn-press-sm"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-2xl border border-[#f0e6de] overflow-hidden luxury-card-shadow luxury-card-hover flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-[#f0e6de] shrink-0">
                    <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#ead7c7]">
                        {asset.assetTag}
                      </span>
                      <span className="text-[10px] text-slate-400">{asset.category}</span>
                    </div>
                    <h3 
                      onClick={() => openDetail(asset)}
                      className="text-xs font-bold text-[#1d2939] truncate mt-1 hover:text-[#c28551] transition cursor-pointer"
                    >
                      {asset.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">SN: {asset.serialNumber}</p>
                  </div>
                </div>

                {asset.hasSim && (
                  <div className="p-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-[10px] font-mono text-slate-600 space-y-0.5">
                    <div className="truncate">SIM 1: {asset.imei1 || 'N/A'}</div>
                    <div className="truncate">SIM 2: {asset.imei2 || 'N/A'}</div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#f4ebe4] flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Current Custody</div>
                    <div className="font-semibold text-slate-800 text-[11px] truncate max-w-[140px]">
                      {asset.currentAssignment ? asset.currentAssignment.assignedToName : 'Ready in IT Lab'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Price (LKR)</div>
                    <div className="font-bold text-[#c28551] text-[11px]">{formatLKR(asset.purchaseAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#fdfbf9] border-t border-[#f0e6de] flex items-center justify-between gap-2">
                <button
                  onClick={() => openDetail(asset)}
                  className="flex-1 py-1.5 rounded-lg border border-[#f0e6de] hover:bg-white text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 btn-press-sm"
                >
                  <History className="w-3.5 h-3.5 text-[#c28551]" />
                  <span>Timeline</span>
                </button>

                {asset.currentAssignment ? (
                  <button
                    onClick={() => openReturn(asset)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 btn-press-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openAssign(asset)}
                    className="flex-1 py-1.5 rounded-lg bg-[#1d2939] hover:bg-[#c28551] text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 btn-press-sm"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Deploy</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default function InventoryPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading inventory...</div>}>
        <InventoryContent />
      </Suspense>
    </AppShell>
  );
}
