'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  ListFilter, 
  Building2, 
  X,
  Smartphone,
  Laptop,
  Camera,
  Server
} from 'lucide-react';
import { AssetCategory, AssetStatus, Branch } from '@/types/asset';

interface AssetFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  branches: Branch[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onResetFilters: () => void;
}

export const CATEGORIES: { label: string; value: string; icon?: any }[] = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Laptops', value: 'Laptop' },
  { label: 'Desktops', value: 'Desktop' },
  { label: 'Tablets', value: 'Tablet' },
  { label: 'Mobile Phones', value: 'Mobile Phone' },
  { label: 'Cameras & Audio', value: 'Camera' },
  { label: 'POS & Scanners', value: 'POS Terminal' },
  { label: 'Printers', value: 'Printer' },
  { label: 'Network Gear', value: 'Network Equipment' },
];

export const STATUSES = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Available (In IT Lab)', value: 'AVAILABLE' },
  { label: 'Permanent Allocation', value: 'ALLOCATED_PERMANENT' },
  { label: 'Temporary Loan', value: 'BORROWED_TEMPORARY' },
  { label: 'Under Repair / Damaged', value: 'UNDER_REPAIR' },
];

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedBranch,
  onBranchChange,
  branches,
  viewMode,
  onViewModeChange,
  onResetFilters,
}) => {
  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedCategory !== 'ALL' || 
    selectedStatus !== 'ALL' || 
    selectedBranch !== 'ALL';

  return (
    <div className="space-y-4 mb-6">
      
      {/* Top Search & Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Asset Tag (e.g. CLK-IT-2025-001), Serial No, Dual IMEI, Holder Name..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2">
          
          {/* Branch / Location Dropdown */}
          <div className="relative">
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 cursor-pointer"
            >
              <option value="ALL">All Showrooms & Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => onViewModeChange('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' 
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              title="Clear all filters"
              className="px-2.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
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
              onClick={() => onCategoryChange(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/50 shadow-sm shadow-pink-500/20 ring-1 ring-pink-500/30'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

    </div>
  );
};
