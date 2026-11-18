'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { AppShell, useApp } from '@/components/AppShell';
import {
  Users,
  Search,
  Building2,
  Briefcase,
  Laptop,
  RotateCcw,
  FileCheck2,
  History,
  Clock,
  BadgeCheck,
  X,
  CheckCircle2,
  Layers,
  Coins,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Asset } from '@/types/asset';
import { formatLKR, formatDate, calculateDuration } from '@/lib/utils';

interface CustodianGroup {
  key: string;
  name: string;
  role: string;
  employeeId: string;
  branch: string;
  department: string;
  assets: Asset[];
  totalValueLKR: number;
  loanCount: number;
  permanentCount: number;
}

function CustodiansContent() {
  const {
    assets,
    branches,
    departments,
    openDetail,
    openReturn,
    openHandoverVoucher,
    openAuditReport,
    refreshData,
    showToast,
  } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MULTI' | 'LOANS'>('ALL');

  // Batch return (Offboarding) state
  const [offboardingKey, setOffboardingKey] = useState<string | null>(null);
  const [offboardingNotes, setOffboardingNotes] = useState('');
  const [processingOffboard, setProcessingOffboard] = useState(false);

  const custodianGroups = useMemo<CustodianGroup[]>(() => {
    const map = new Map<string, CustodianGroup>();

    for (const asset of assets) {
      if (!asset.currentAssignment || asset.status === 'RETIRED') continue;
      const ca = asset.currentAssignment;
      const normalizedName = ca.assignedToName.trim().toLowerCase();
      const contactOrId = (ca.employeeId || ca.assignedToContact || '').trim();
      const key = normalizedName;

      const existing = map.get(key);
      const val = Number(asset.purchaseAmount) || 0;
      const isLoan = asset.status === 'BORROWED_TEMPORARY' || ca.assignmentType === 'TEMPORARY_BORROW';

      if (existing) {
        existing.assets.push(asset);
        existing.totalValueLKR += val;
        if (isLoan) existing.loanCount += 1;
        else existing.permanentCount += 1;
      } else {
        map.set(key, {
          key,
          name: ca.assignedToName.trim(),
          role: ca.assignedToRole || ca.employeeRole || 'Staff Member',
          employeeId: contactOrId,
          branch: ca.locationOrBranch || 'Unassigned Branch',
          department: ca.department || 'General',
          assets: [asset],
          totalValueLKR: val,
          loanCount: isLoan ? 1 : 0,
          permanentCount: isLoan ? 0 : 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.assets.length !== a.assets.length) return b.assets.length - a.assets.length;
      return a.name.localeCompare(b.name);
    });
  }, [assets]);

  const filteredCustodians = useMemo(() => {
    return custodianGroups.filter((group) => {
      if (selectedBranch !== 'ALL' && group.branch !== selectedBranch) return false;
      if (selectedDepartment !== 'ALL' && group.department !== selectedDepartment) return false;
      if (filterMode === 'MULTI' && group.assets.length < 2) return false;
      if (filterMode === 'LOANS' && group.loanCount === 0) return false;

      if (localSearch.trim()) {
        const q = localSearch.toLowerCase();
        const matchPerson =
          group.name.toLowerCase().includes(q) ||
          group.role.toLowerCase().includes(q) ||
          group.employeeId.toLowerCase().includes(q) ||
          group.branch.toLowerCase().includes(q) ||
          group.department.toLowerCase().includes(q);

        const matchAsset = group.assets.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.assetTag.toLowerCase().includes(q) ||
            a.serialNumber.toLowerCase().includes(q)
        );

        if (!matchPerson && !matchAsset) return false;
      }

      return true;
    });
  }, [custodianGroups, selectedBranch, selectedDepartment, filterMode, localSearch]);

  const totalCustodians = custodianGroups.length;
  const totalAssignedDevices = custodianGroups.reduce((sum, g) => sum + g.assets.length, 0);
  const totalCustodyValueLKR = custodianGroups.reduce((sum, g) => sum + g.totalValueLKR, 0);
  const multiDeviceHoldersCount = custodianGroups.filter((g) => g.assets.length >= 2).length;

  const handleBatchReturnAll = async (group: CustodianGroup) => {
    setProcessingOffboard(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await Promise.all(
        group.assets.map((asset) =>
          fetch(`/api/assets/${asset.id}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              returnDate: today,
              conditionUponReturn: asset.condition || 'Used - Good',
              damages: '',
              notes:
                offboardingNotes.trim() ||
                `Batch returned all hardware from ${group.name} (${group.branch}) to Central IT Lab.`,
              performedBy: 'IT Asset Admin',
            }),
          })
        )
      );

      setOffboardingKey(null);
      setOffboardingNotes('');
      showToast(
        `Returned all ${group.assets.length} device(s) from ${group.name} to Central IT Lab!`
      );
      await refreshData();
    } catch (err) {
      console.error('Batch return failed:', err);
    } finally {
      setProcessingOffboard(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="p-6 rounded-3xl bg-[#fbf5ef] border border-[#f0e6de] luxury-card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f4e6d8] text-[#844c1d] border border-[#c28551]/30">
              Employee Custody Directory
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • Who Has What Hardware
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Staff &amp; Custodian Hardware Directory
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            View every laptop, mobile phone, tablet, or POS terminal grouped by employee—ideal for showroom transfers, staff audits, and resignation offboarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              openAuditReport({
                branch: selectedBranch,
                department: selectedDepartment,
              })
            }
            className="px-4 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Manager Audit Report &amp; CSV</span>
          </button>

          <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#c28551]/30 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Active Custodians
            </span>
            <span className="text-base font-extrabold text-[#c28551]">
              {totalCustodians} Staff
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] luxury-card-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Staff Holders
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {totalCustodians}
            </div>
            <span className="text-[11px] text-slate-500">Employees holding gear</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#fbf5ef] border border-[#ead7c7] flex items-center justify-center text-[#c28551]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] luxury-card-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Devices in Staff Custody
            </span>
            <div className="text-xl font-extrabold text-[#c28551] mt-1">
              {totalAssignedDevices}
            </div>
            <span className="text-[11px] text-slate-500">Allocated + Temporary Loans</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#fbf5ef] border border-[#ead7c7] flex items-center justify-center text-[#c28551]">
            <Laptop className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] luxury-card-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Multi-Device Holders
            </span>
            <div className="text-xl font-extrabold text-indigo-700 mt-1">
              {multiDeviceHoldersCount}
            </div>
            <span className="text-[11px] text-slate-500">Holding 2+ devices</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] luxury-card-shadow flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Value in Staff Custody
            </span>
            <div className="text-base font-extrabold text-emerald-700 mt-1 font-mono">
              {formatLKR(totalCustodyValueLKR)}
            </div>
            <span className="text-[11px] text-slate-500">Recorded asset value</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-white border border-[#f0e6de] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c28551]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search Employee Name, Staff ID (CLK-EMP...), Role, Branch, or Asset Tag..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551]"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Showrooms &amp; Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Quick Mode Pills */}
            <div className="flex items-center p-1 rounded-xl bg-[#fbf5ef] border border-[#ead7c7]">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white text-[#c28551] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({totalCustodians})
              </button>
              <button
                onClick={() => setFilterMode('MULTI')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  filterMode === 'MULTI'
                    ? 'bg-white text-[#c28551] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2+ Devices ({multiDeviceHoldersCount})
              </button>
              <button
                onClick={() => setFilterMode('LOANS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  filterMode === 'LOANS'
                    ? 'bg-white text-[#c28551] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Temp Loans
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custodians Grid */}
      {filteredCustodians.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[#f0e6de] p-6">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-800">
            No matching staff custodians found
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Try clearing your search or assigning hardware from the Fleet Inventory page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCustodians.map((group) => {
            const isOffboarding = offboardingKey === group.key;

            return (
              <div
                key={group.key}
                className="rounded-3xl bg-white border border-[#f0e6de] luxury-card-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Staff Member Header */}
                <div className="p-5 bg-gradient-to-r from-[#fbf5ef]/90 to-white border-b border-[#f0e6de]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c28551] to-[#dfae85] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {group.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {group.name}
                          </h3>
                          {group.employeeId && (
                            <span className="px-2 py-0.5 rounded-md bg-white border border-[#ead7c7] text-[#c28551] font-mono text-[10px] font-bold">
                              {group.employeeId}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-[#c28551]" />
                          <span>{group.role}</span>
                          <span className="text-slate-300">•</span>
                          <span>{group.department}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{group.branch}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                        <Laptop className="w-3.5 h-3.5" />
                        <span>
                          {group.assets.length}{' '}
                          {group.assets.length === 1 ? 'Device' : 'Devices'}
                        </span>
                      </span>
                      <div className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                        {group.totalValueLKR > 0
                          ? formatLKR(group.totalValueLKR)
                          : 'Unrecorded Value'}
                      </div>
                    </div>
                  </div>

                  {/* Offboard / Return All Confirmation Bar */}
                  {isOffboarding && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5 animate-in fade-in duration-150">
                      <div className="text-xs font-bold text-rose-900">
                        Return all {group.assets.length} device(s) held by {group.name} to Central IT Lab?
                      </div>
                      <input
                        type="text"
                        value={offboardingNotes}
                        onChange={(e) => setOffboardingNotes(e.target.value)}
                        placeholder="Optional reason (e.g., Staff resignation offboarding, Branch transfer)..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setOffboardingKey(null);
                            setOffboardingNotes('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleBatchReturnAll(group)}
                          disabled={processingOffboard}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {processingOffboard
                              ? 'Returning All...'
                              : `Confirm Return All (${group.assets.length})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Assigned Devices List */}
                <div className="p-4 divide-y divide-slate-100 flex-1">
                  {group.assets.map((asset) => {
                    const isLoan =
                      asset.status === 'BORROWED_TEMPORARY' ||
                      asset.currentAssignment?.assignmentType === 'TEMPORARY_BORROW';

                    return (
                      <div
                        key={asset.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => openDetail(asset)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                        >
                          <img
                            src={asset.images[0]}
                            alt={asset.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-[#c28551] bg-[#fbf5ef] px-1.5 py-0.5 rounded border border-[#ead7c7]">
                                {asset.assetTag}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isLoan
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isLoan ? 'Temp Loan' : 'Permanent'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {asset.currentAssignment?.conditionAtHandover || asset.condition}
                              </span>
                              {asset.currentAssignment?.assignedDate && (
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {calculateDuration(asset.currentAssignment.assignedDate)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#c28551] transition truncate mt-0.5">
                              {asset.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              SN: {asset.serialNumber}
                              {asset.currentAssignment?.expectedReturnDate
                                ? ` • Due: ${formatDate(asset.currentAssignment.expectedReturnDate)}`
                                : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openHandoverVoucher(asset)}
                            title="Print Handover Voucher"
                            className="p-1.5 rounded-lg border border-[#ead7c7] text-[#c28551] hover:bg-[#fbf5ef] transition cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDetail(asset)}
                            title="View Hardware Dossier"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openReturn(asset)}
                            title="Return This Device"
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-[#fdfbf9] border-t border-[#f0e6de] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#c28551]" />
                    <span>
                      {group.permanentCount} Permanent • {group.loanCount} Temp Loan
                    </span>
                  </span>

                  <button
                    onClick={() => {
                      setOffboardingKey(isOffboarding ? null : group.key);
                      setOffboardingNotes('');
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>
                      {group.assets.length > 1
                        ? `Return All (${group.assets.length}) / Offboard`
                        : 'Quick Offboard Return'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustodiansPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-400">
            Loading staff custodian directory...
          </div>
        }
      >
        <CustodiansContent />
      </Suspense>
    </AppShell>
  );
}
