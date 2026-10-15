'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  ArrowRightLeft,
  RotateCcw,
  AlertTriangle,
  ShoppingBag,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Calendar,
  Download,
  Eye,
  Camera,
  ExternalLink,
  X,
  Radio,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { EnrichedActivityItem, HistoryAction, Asset } from '@/types/asset';
import { formatDate } from '@/lib/utils';

function getActionMeta(action: HistoryAction) {
  switch (action) {
    case 'ASSIGNED':
    case 'TRANSFERRED':
      return {
        label: 'Deployed / Loaned',
        icon: ArrowRightLeft,
        badgeClass: 'bg-[#faece2] text-[#c28551] border-[#ead7c7]',
        dotClass: 'bg-[#c28551]',
      };
    case 'RETURNED':
      return {
        label: 'Returned to Central IT',
        icon: RotateCcw,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'DAMAGE_REPORTED':
      return {
        label: 'Damages Reported',
        icon: AlertTriangle,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
      };
    case 'PURCHASED':
      return {
        label: 'Procurement Intake',
        icon: ShoppingBag,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'REPAIR_SENT':
      return {
        label: 'Dispatched to Vendor RMA',
        icon: Wrench,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
      };
    case 'REPAIR_COMPLETED':
      return {
        label: 'Vendor Repair Completed',
        icon: CheckCircle2,
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        dotClass: 'bg-teal-500',
      };
    case 'RETIRED':
      return {
        label: 'Decommissioned / Written Off',
        icon: AlertTriangle,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-500',
      };
    default:
      return {
        label: String(action).replace('_', ' '),
        icon: Activity,
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
      };
  }
}

function timeAgo(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

function ActivityContent() {
  const { assets, branches, openDetail, showToast } = useApp();
  const [activities, setActivities] = useState<EnrichedActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [newActionIds, setNewActionIds] = useState<Set<string>>(new Set());

  // Filter states
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lightbox state for return photos
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  useEffect(() => {
    setLastSyncedAt(new Date());
  }, []);

  const fetchActivities = useCallback(async (isBackgroundSync = false) => {
    if (!isBackgroundSync) setLoading(true);
    setSyncing(true);
    try {
      const res = await fetch('/api/activity?limit=150');
      const data = await res.json();
      if (data.success && data.data) {
        if (isBackgroundSync && activities.length > 0) {
          const existingIds = new Set(activities.map(a => a.id));
          const freshItems = data.data.filter((item: EnrichedActivityItem) => !existingIds.has(item.id));
          if (freshItems.length > 0) {
            setNewActionIds(new Set(freshItems.map((f: EnrichedActivityItem) => f.id)));
            showToast(`${freshItems.length} new fleet action${freshItems.length > 1 ? 's' : ''} synced!`);
            setTimeout(() => setNewActionIds(new Set()), 5000);
          }
        }
        setActivities(data.data);
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to sync fleet activity:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [activities, showToast]);

  useEffect(() => {
    fetchActivities();
  }, []);

  // Real-time polling every 12 seconds if autoSync is active
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchActivities(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoSync, fetchActivities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Action filter
      if (actionFilter !== 'ALL' && act.action !== actionFilter) return false;

      // Branch filter
      if (branchFilter !== 'ALL') {
        const qBranch = branchFilter.toLowerCase();
        const matchesBranch =
          (act.locationOrBranch && act.locationOrBranch.toLowerCase().includes(qBranch)) ||
          act.newHolder.toLowerCase().includes(qBranch) ||
          act.previousHolder.toLowerCase().includes(qBranch);
        if (!matchesBranch) return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          act.assetTag.toLowerCase().includes(q) ||
          act.assetName.toLowerCase().includes(q) ||
          act.performedBy.toLowerCase().includes(q) ||
          act.newHolder.toLowerCase().includes(q) ||
          act.previousHolder.toLowerCase().includes(q) ||
          (act.notes && act.notes.toLowerCase().includes(q)) ||
          (act.damages && act.damages.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [activities, actionFilter, branchFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const assigned = activities.filter(a => a.action === 'ASSIGNED' || a.action === 'TRANSFERRED').length;
    const returned = activities.filter(a => a.action === 'RETURNED' || a.action === 'DAMAGE_REPORTED').length;
    const repairs = activities.filter(a => a.action === 'REPAIR_SENT' || a.action === 'REPAIR_COMPLETED').length;
    const purchases = activities.filter(a => a.action === 'PURCHASED').length;
    return { total, assigned, returned, repairs, purchases };
  }, [activities]);

  // CSV Export
  const exportCSV = () => {
    const headers = ['Action ID', 'Date', 'Action', 'Asset Tag', 'Asset Name', 'Category', 'Performed By', 'Previous Holder', 'New Holder', 'Damages', 'Notes'];
    const rows = filteredActivities.map(a => [
      `"${a.id}"`,
      `"${a.date}"`,
      `"${a.action}"`,
      `"${a.assetTag}"`,
      `"${a.assetName.replace(/"/g, '""')}"`,
      `"${a.assetCategory}"`,
      `"${a.performedBy}"`,
      `"${a.previousHolder.replace(/"/g, '""')}"`,
      `"${a.newHolder.replace(/"/g, '""')}"`,
      `"${(a.damages || '').replace(/"/g, '""')}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cosmetics-lk-fleet-audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fleet activity audit log exported to CSV!');
  };

  const handleOpenAsset = (assetId: string) => {
    const found = assets.find(a => a.id === assetId || a.assetTag.toLowerCase() === assetId.toLowerCase());
    if (found) {
      openDetail(found);
    } else {
      showToast(`Asset details for ID ${assetId} are being retrieved...`);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header and Live Sync Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#f0e6de] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#c28551]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#faece2] text-[#c28551]">
              <Activity className="w-5 h-5 text-[#c28551]" />
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1d2939] tracking-tight">
                Live Activity & Fleet Audit Stream
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Sync
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Live chronological custody record of hardware purchases, showroom deployments, damage inspections, vendor repairs, and technician sign-offs across all cosmetics.lk locations.
          </p>
        </div>

        {/* Live Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Auto-Sync Toggle */}
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer btn-press-sm ${
              autoSync
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title={autoSync ? 'Auto-sync active (every 12s)' : 'Auto-sync paused'}
          >
            <Radio className={`w-3.5 h-3.5 ${autoSync ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{autoSync ? 'Live Auto-Sync: ON' : 'Live Sync: PAUSED'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchActivities(false)}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#fbf5ef] border border-[#f0e6de] hover:border-[#c28551]/40 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs btn-press-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#c28551]' : 'text-slate-500'}`} />
            <span>Sync Now</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#1d2939] hover:bg-[#c28551] text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm btn-press-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#dfae85]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Fleet Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faece2] flex items-center justify-center text-[#c28551] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Total Audit Events</span>
            <span className="text-xl font-bold font-mono text-[#1d2939]">{stats.total}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Deployments & Loans</span>
            <span className="text-xl font-bold font-mono text-[#1d2939]">{stats.assigned}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Returns & Check-Ins</span>
            <span className="text-xl font-bold font-mono text-[#1d2939]">{stats.returned}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Vendor Repairs</span>
            <span className="text-xl font-bold font-mono text-[#1d2939]">{stats.repairs}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block">Procured Hardware</span>
            <span className="text-xl font-bold font-mono text-[#1d2939]">{stats.purchases}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Action Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'All Fleet Events' },
            { id: 'ASSIGNED', label: 'Deployments' },
            { id: 'RETURNED', label: 'Returns' },
            { id: 'DAMAGE_REPORTED', label: 'Damages' },
            { id: 'REPAIR_SENT', label: 'Vendor RMA' },
            { id: 'PURCHASED', label: 'Intakes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap btn-press-sm ${
                actionFilter === tab.id
                  ? 'bg-[#c28551] text-white shadow-xs'
                  : 'bg-[#faf7f3] text-slate-600 hover:text-[#1d2939] hover:bg-[#f0e6de]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Location Select */}
        <div className="flex items-center gap-2.5">
          {/* Branch Select */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#faf7f3] border border-[#f0e6de] text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 cursor-pointer"
          >
            <option value="ALL">All Showrooms & Hubs</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actor, tag, holder..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#faf7f3] border border-[#f0e6de] focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-[#f0e6de] space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-[#c28551] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Syncing live fleet activity stream...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-[#f0e6de] space-y-3">
            <Activity className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-bold text-sm text-slate-700">No activity events match your criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your action category, clearing your search query, or selecting "All Showrooms & Hubs".
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-0.5 before:bg-[#f0e6de]">
            {filteredActivities.map((act) => {
              const meta = getActionMeta(act.action);
              const Icon = meta.icon;
              const isNew = newActionIds.has(act.id);

              return (
                <div
                  key={act.id}
                  className={`relative group p-5 rounded-2xl bg-white border transition-all duration-200 hover:shadow-md ${
                    isNew
                      ? 'border-[#c28551] ring-2 ring-[#c28551]/30 bg-[#fdfbf9]'
                      : 'border-[#f0e6de] hover:border-[#c28551]/40'
                  }`}
                >
                  {/* Timeline Node Bullet */}
                  <div className={`absolute -left-6 sm:-left-8 top-6 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${meta.dotClass}`} />

                  {/* Card Content */}
                  <div className="space-y-3">
                    
                    {/* Top Row: Action Badge, Asset Link, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${meta.badgeClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>

                        {/* Clickable Asset Tag */}
                        <button
                          onClick={() => handleOpenAsset(act.assetId)}
                          className="font-mono text-xs font-bold text-[#c28551] hover:underline flex items-center gap-1 cursor-pointer"
                          title="Open hardware dossier"
                        >
                          <span>{act.assetTag}</span>
                          <span className="text-slate-400 font-sans font-normal">• {act.assetName}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{timeAgo(act.date)}</span>
                        <span className="text-slate-300">|</span>
                        <span>{formatDate(act.date)}</span>
                      </div>
                    </div>

                    {/* Custody Movement / Handover Direction */}
                    <div className="p-3 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-500">From:</span>
                        <span className="font-bold text-[#1d2939]">{act.previousHolder}</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-semibold text-slate-500">To:</span>
                        <span className="font-bold text-[#c28551]">{act.newHolder}</span>
                      </div>

                      {act.duration && (
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                          <span className="text-slate-400">Duration:</span>
                          <span className="font-semibold">{act.duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Reported Damages Banner */}
                    {act.damages && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-[11px] uppercase">Damage Inspection Findings:</span>
                          <p className="mt-0.5">{act.damages}</p>
                        </div>
                      </div>
                    )}

                    {/* Return Condition Photo Proof Gallery */}
                    {act.returnPhotos && act.returnPhotos.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#c28551]" />
                          <span>Return Condition Photo Evidence ({act.returnPhotos.length})</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {act.returnPhotos.map((photo, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => setLightboxImage({
                                url: photo,
                                title: `Condition Proof #${pIdx + 1} (${act.assetTag})`,
                                subtitle: `Action: ${act.action} • Logged by ${act.performedBy}`
                              })}
                              className="group relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-[#c28551] transition cursor-pointer"
                            >
                              <img src={photo} alt={`Evidence ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes & Actor */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                      {act.notes ? (
                        <p className="italic text-slate-600 text-[11px] max-w-xl">
                          "{act.notes}"
                        </p>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Admin / Technician:</span>
                          <span className="font-semibold text-slate-700">{act.performedBy || 'IT Admin'}</span>
                        </div>

                        <button
                          onClick={() => handleOpenAsset(act.assetId)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#faf7f3] border border-[#f0e6de] text-[#c28551] font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer btn-press-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Hardware</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Photo Inspections */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">{lightboxImage.title}</h3>
              {lightboxImage.subtitle && <p className="text-xs text-white/60 mt-0.5">{lightboxImage.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Open full resolution"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function ActivityPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-16 text-center text-xs text-slate-400">Loading fleet activity stream...</div>}>
        <ActivityContent />
      </Suspense>
    </AppShell>
  );
}
