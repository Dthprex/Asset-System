'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell, useApp } from '@/components/AppShell';
import { 
  Store, 
  Building2, 
  Laptop, 
  MapPin, 
  Tag, 
  Coins, 
  History, 
  ArrowRight,
  Plus,
  Trash2,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { formatLKR } from '@/lib/utils';
import { NewBranchModal } from '@/components/NewBranchModal';

function BranchesContent() {
  const { branches, departments, assets, openDetail, openAuditReport, openManageDepartments, refreshData, showToast } = useApp();
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<string | null>(null);

  useEffect(() => {
    if (branchParam && branches.length > 0) {
      const q = branchParam.toLowerCase();
      const match = branches.find(
        (b) =>
          b.id.toLowerCase() === q ||
          b.code.toLowerCase() === q ||
          b.name.toLowerCase().includes(q)
      );
      if (match) {
        setSelectedBranchId(match.id);
      }
    }
  }, [branchParam, branches]);

  const handleBranchCreated = (newBranch: any) => {
    refreshData();
    showToast(`Added new location: ${newBranch.name}`);
    setSelectedBranchId(newBranch.id);
  };

  const handleDeleteBranch = async (branchId: string, branchName: string, assetCount: number) => {
    if (assetCount > 0) {
      alert(`Cannot delete "${branchName}" because it currently has ${assetCount} active asset(s) deployed. Please reassign or return the assets first.`);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${branchName}" from the retail showroom network?`);
    if (!confirmed) return;

    setDeletingId(branchId);
    try {
      const res = await fetch(`/api/branches?id=${encodeURIComponent(branchId)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Removed location: ${branchName}`);
        if (selectedBranchId === branchId) {
          setSelectedBranchId('ALL');
        }
        await refreshData();
      } else {
        alert(result.error || 'Failed to delete branch');
      }
    } catch (err) {
      console.error('Failed to delete branch:', err);
      alert('An error occurred while deleting the branch.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDept = async (deptId: string, deptName: string, assetCount: number) => {
    if (assetCount > 0) {
      alert(`Cannot delete "${deptName}" because it currently has ${assetCount} active asset(s) deployed. Please reassign or return the assets first.`);
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${deptName}" from the company departments directory?`);
    if (!confirmed) return;

    setDeletingDeptId(deptId);
    try {
      const res = await fetch(`/api/departments?id=${encodeURIComponent(deptId)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Removed department: ${deptName}`);
        if (selectedDeptName === deptName) {
          setSelectedDeptName('ALL');
        }
        await refreshData();
      } else {
        alert(result.error || 'Failed to delete department');
      }
    } catch (err) {
      console.error('Failed to delete department:', err);
      alert('An error occurred while deleting the department.');
    } finally {
      setDeletingDeptId(null);
    }
  };

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

  const deptStats = departments.map((d) => {
    const deptAssets = assets.filter(
      (a) =>
        a.status !== 'RETIRED' &&
        a.currentAssignment?.department?.trim().toLowerCase() === d.name.trim().toLowerCase()
    );
    const totalValue = deptAssets.reduce((sum, a) => sum + (Number(a.purchaseAmount) || 0), 0);
    return {
      ...d,
      assets: deptAssets,
      count: deptAssets.length,
      totalValue,
    };
  });

  const activeBranch = branchStats.find((b) => b.id === selectedBranchId);
  const displayedAssets = assets.filter((a) => {
    if (activeBranch && a.currentAssignment?.locationOrBranch !== activeBranch.name) {
      return false;
    }
    if (
      selectedDeptName !== 'ALL' &&
      a.currentAssignment?.department?.trim().toLowerCase() !== selectedDeptName.trim().toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#f0e6de] luxury-card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f4e6d8] text-[#844c1d] border border-[#c28551]/30">
              Retail Network &amp; Org Units
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • {branches.length} Locations • {departments.length} Departments
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Showrooms, Branches &amp; Departments
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Track hardware equipment, POS terminals, and corporate allocations across cosmetics.lk retail outlets, Pepiliyana Head Office, and company departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              openAuditReport({
                branch: activeBranch ? activeBranch.name : 'ALL',
                department: selectedDeptName !== 'ALL' ? selectedDeptName : 'ALL',
              })
            }
            className="px-3.5 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              {activeBranch
                ? `${activeBranch.name} Audit Report`
                : selectedDeptName !== 'ALL'
                ? `${selectedDeptName} Audit Report`
                : 'Audit Report & CSV'}
            </span>
          </button>

          <button
            onClick={openManageDepartments}
            className="px-3.5 py-2.5 rounded-2xl border border-[#c28551]/30 bg-white hover:bg-[#faf7f3] text-[#1d2939] font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-[#c28551]" />
            <span>Manage Departments ({departments.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#c28551] hover:bg-[#a96f3e] text-white font-semibold text-xs transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shop Location</span>
          </button>
        </div>
      </div>

      {/* Showrooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* All Showrooms Card */}
        <button
          onClick={() => setSelectedBranchId('ALL')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between btn-press-sm ${
            selectedBranchId === 'ALL'
              ? 'bg-[#fbf5ef] border-[#c28551] shadow-xs ring-1 ring-[#c28551]/30 glow-terracotta'
              : 'bg-white border-slate-200/90 hover:border-slate-300 luxury-card-hover'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Locations</span>
            <div className="text-sm font-bold text-slate-900 mt-1">Entire Network</div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#c28551]">{assets.length} Total Devices</span>
            <span className="text-slate-400 text-[11px] font-mono">{branches.length} Locations</span>
          </div>
        </button>

        {/* Individual Showrooms */}
        {branchStats.map((b) => {
          const isSelected = selectedBranchId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between btn-press-sm ${
                isSelected
                  ? 'bg-[#fbf5ef] border-[#c28551] shadow-xs ring-1 ring-[#c28551]/30 glow-terracotta'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 luxury-card-hover'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{b.code}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600">
                      {b.type}
                    </span>
                    {b.count === 0 && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBranch(b.id, b.name, b.count);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        title={`Delete empty branch ${b.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{b.name}</div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="font-bold text-[#c28551]">{b.count} {b.count === 1 ? 'Device' : 'Devices'}</span>
                <span className="font-semibold text-slate-700 text-[11px] font-mono">{formatLKR(b.totalValue)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Company Departments Directory & Filter Section */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 luxury-card-shadow space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c28551]" />
            <h2 className="text-sm font-bold text-slate-900">
              Company Departments ({departments.length})
            </h2>
            {selectedDeptName !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faece2] text-[#c28551] border border-[#c28551]/30">
                Filtered: {selectedDeptName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedDeptName !== 'ALL' && (
              <button
                onClick={() => setSelectedDeptName('ALL')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Clear Department Filter
              </button>
            )}
            <button
              onClick={openManageDepartments}
              className="px-3 py-1.5 rounded-xl bg-[#fbf5ef] hover:bg-[#faece2] text-[#c28551] border border-[#c28551]/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Remove Departments</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            onClick={() => setSelectedDeptName('ALL')}
            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
              selectedDeptName === 'ALL'
                ? 'bg-[#1d2939] text-white border-[#1d2939] shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold opacity-70">All Departments</div>
              <div className="text-xs font-bold truncate">All Org Units</div>
            </div>
            <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded-lg bg-white/15">
              {departments.length}
            </span>
          </button>

          {deptStats.map((d) => {
            const isSelected = selectedDeptName === d.name;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDeptName(isSelected ? 'ALL' : d.name)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#fbf5ef] border-[#c28551] ring-1 ring-[#c28551]/30'
                    : 'bg-white border-slate-200 hover:border-[#c28551]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{d.name}</span>
                  {d.count === 0 && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDept(d.id, d.name, d.count);
                      }}
                      title={`Remove empty department ${d.name}`}
                      className="p-0.5 text-slate-300 hover:text-rose-600 rounded transition shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#c28551]">
                    {d.count} {d.count === 1 ? 'Device' : 'Devices'}
                  </span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {d.totalValue > 0 ? formatLKR(d.totalValue) : 'Rs. 0'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipment Deployed at Selected Showroom / Department */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#c28551]" />
            <span>
              {activeBranch && selectedDeptName !== 'ALL'
                ? `Hardware at ${activeBranch.name} • ${selectedDeptName} (${displayedAssets.length})`
                : activeBranch
                ? `Hardware Deployed at ${activeBranch.name} (${displayedAssets.length})`
                : selectedDeptName !== 'ALL'
                ? `Hardware in ${selectedDeptName} (${displayedAssets.length})`
                : `All Deployed Hardware (${displayedAssets.length})`}
            </span>
          </h2>

          {(selectedBranchId !== 'ALL' || selectedDeptName !== 'ALL') && (
            <div className="flex items-center gap-2">
              {selectedBranchId !== 'ALL' && activeBranch && (
                <button
                  onClick={() => handleDeleteBranch(activeBranch.id, activeBranch.name, activeBranch.count)}
                  disabled={deletingId === activeBranch.id}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                    activeBranch.count > 0 
                      ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed opacity-70' 
                      : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200'
                  }`}
                  title={activeBranch.count > 0 ? "Cannot delete location with assigned hardware" : "Delete this shop location"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === activeBranch.id ? 'Deleting...' : 'Delete Location'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedBranchId('ALL');
                  setSelectedDeptName('ALL');
                }}
                className="text-xs font-semibold text-[#c28551] hover:text-[#a66c3b] btn-press-sm px-2.5 py-1 rounded-lg hover:bg-[#fbf5ef]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {displayedAssets.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-3xl border border-slate-200/90 luxury-card-shadow p-6">
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
                className="p-4 rounded-2xl bg-white border border-slate-200/90 luxury-card-shadow luxury-card-hover btn-press cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
                    <img src={asset.images[0]} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-2 py-0.5 rounded border border-[#c28551]/20 font-mono">
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
                  <span className="font-bold text-slate-900 text-[11px] font-mono">
                    {asset.purchaseAmount > 0 ? formatLKR(asset.purchaseAmount) : 'Unrecorded'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Location Modal */}
      <NewBranchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleBranchCreated}
      />

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
