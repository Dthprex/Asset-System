'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Building2,
  Layers,
  Laptop,
  Users,
  ShieldCheck,
  CheckCircle2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Asset, Branch, Department } from '@/types/asset';
import { formatLKR, formatDate, getWarrantyInfo } from '@/lib/utils';
import { CATEGORIES } from './AssetFilters';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  branches: Branch[];
  departments: Department[];
  initialBranch?: string;
  initialCategory?: string;
  initialStatus?: string;
  initialDepartment?: string;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  assets,
  branches,
  departments,
  initialBranch = 'ALL',
  initialCategory = 'ALL',
  initialStatus = 'ACTIVE_ONLY',
  initialDepartment = 'ALL',
}) => {
  const [branchFilter, setBranchFilter] = useState(initialBranch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [departmentFilter, setDepartmentFilter] = useState(initialDepartment);
  const [reportTitleNote, setReportTitleNote] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setBranchFilter(initialBranch || 'ALL');
      setCategoryFilter(initialCategory || 'ALL');
      setStatusFilter(initialStatus || 'ACTIVE_ONLY');
      setDepartmentFilter(initialDepartment || 'ALL');
    }
  }, [isOpen, initialBranch, initialCategory, initialStatus, initialDepartment]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (statusFilter === 'ACTIVE_ONLY' && a.status === 'RETIRED') return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'ACTIVE_ONLY' && a.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (branchFilter !== 'ALL') {
        const loc = a.currentAssignment?.locationOrBranch || 'IT Lab & Staging Area';
        if (loc !== branchFilter) return false;
      }
      if (departmentFilter !== 'ALL') {
        const dept = a.currentAssignment?.department || 'IT & Systems Infrastructure';
        if (dept !== departmentFilter) return false;
      }
      return true;
    });
  }, [assets, statusFilter, categoryFilter, branchFilter, departmentFilter]);

  // 1. Summary Totals
  const summaryStats = useMemo(() => {
    const totalCount = filteredAssets.length;
    const totalValueLKR = filteredAssets.reduce((s, a) => s + (Number(a.purchaseAmount) || 0), 0);
    const availableCount = filteredAssets.filter((a) => a.status === 'AVAILABLE').length;
    const allocatedCount = filteredAssets.filter((a) => a.status === 'ALLOCATED_PERMANENT').length;
    const borrowedCount = filteredAssets.filter((a) => a.status === 'BORROWED_TEMPORARY').length;
    const repairCount = filteredAssets.filter((a) => a.status === 'UNDER_REPAIR').length;
    const retiredCount = filteredAssets.filter((a) => a.status === 'RETIRED').length;

    const uniqueCustodians = new Set(
      filteredAssets
        .filter((a) => a.currentAssignment?.assignedToName)
        .map((a) => a.currentAssignment!.assignedToName.trim().toLowerCase())
    ).size;

    return {
      totalCount,
      totalValueLKR,
      availableCount,
      allocatedCount,
      borrowedCount,
      repairCount,
      retiredCount,
      uniqueCustodians,
    };
  }, [filteredAssets]);

  // 2. Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; count: number; deployed: number; available: number; valueLKR: number }>();
    for (const a of filteredAssets) {
      const existing = map.get(a.category) || {
        category: a.category,
        count: 0,
        deployed: 0,
        available: 0,
        valueLKR: 0,
      };
      existing.count += 1;
      if (a.status === 'ALLOCATED_PERMANENT' || a.status === 'BORROWED_TEMPORARY') {
        existing.deployed += 1;
      } else if (a.status === 'AVAILABLE') {
        existing.available += 1;
      }
      existing.valueLKR += Number(a.purchaseAmount) || 0;
      map.set(a.category, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredAssets]);

  // 3. Breakdown by Branch / Location
  const branchBreakdown = useMemo(() => {
    const map = new Map<string, { branch: string; count: number; valueLKR: number }>();
    for (const a of filteredAssets) {
      const branchName =
        a.currentAssignment?.locationOrBranch ||
        (a.status === 'AVAILABLE' ? 'Central IT Lab (Available Stock)' : 'Unassigned / Central IT Lab');
      const existing = map.get(branchName) || { branch: branchName, count: 0, valueLKR: 0 };
      existing.count += 1;
      existing.valueLKR += Number(a.purchaseAmount) || 0;
      map.set(branchName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredAssets]);

  // 4. Breakdown by Department
  const departmentBreakdown = useMemo(() => {
    const map = new Map<string, { department: string; count: number; valueLKR: number }>();
    for (const a of filteredAssets) {
      const deptName =
        a.currentAssignment?.department ||
        (a.status === 'AVAILABLE' ? 'IT Central Inventory (Unassigned)' : 'General / Unspecified');
      const existing = map.get(deptName) || { department: deptName, count: 0, valueLKR: 0 };
      existing.count += 1;
      existing.valueLKR += Number(a.purchaseAmount) || 0;
      map.set(deptName, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredAssets]);

  if (!isOpen) return null;

  const reportId = `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const generatedTimestamp = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const escapeCsv = (val: any): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available in IT Lab';
      case 'ALLOCATED_PERMANENT':
        return 'Allocated (Permanent)';
      case 'BORROWED_TEMPORARY':
        return 'Temporary Loan';
      case 'UNDER_REPAIR':
        return 'Under Vendor Repair';
      case 'RETIRED':
        return 'Retired / Scrapped';
      default:
        return status;
    }
  };

  // Download Full Manager Audit Report CSV (includes Summary Counts + Full Itemized Register)
  const handleDownloadFullAuditCsv = () => {
    const rows: string[][] = [];

    rows.push(['COSMETICS.LK - OFFICIAL IT HARDWARE FLEET & CUSTODY AUDIT REPORT']);
    rows.push(['Headquarters', 'Pepiliyana Head Office', 'IT Department Contact', '0776238098']);
    rows.push(['Report Reference', reportId, 'Generated On', generatedTimestamp]);
    rows.push([
      'Filter Scope',
      `Branch: ${branchFilter} | Dept: ${departmentFilter} | Category: ${categoryFilter} | Status: ${statusFilter}`,
    ]);
    rows.push([]);

    // Summary Section 1: Overall Fleet Counts
    rows.push(['1. EXECUTIVE FLEET SUMMARY COUNTS']);
    rows.push(['Metric', 'Count / Value']);
    rows.push(['Total Hardware Items in Scope', String(summaryStats.totalCount)]);
    rows.push(['Allocated (Permanent Deployment)', String(summaryStats.allocatedCount)]);
    rows.push(['Temporary Loans / Borrows', String(summaryStats.borrowedCount)]);
    rows.push(['Available in Central IT Lab', String(summaryStats.availableCount)]);
    rows.push(['Under Vendor Repair (RMA)', String(summaryStats.repairCount)]);
    rows.push(['Retired / Scrapped', String(summaryStats.retiredCount)]);
    rows.push(['Active Staff Custodians', String(summaryStats.uniqueCustodians)]);
    rows.push(['Total Recorded Fleet Value (LKR)', String(summaryStats.totalValueLKR)]);
    rows.push([]);

    // Summary Section 2: Category Counts
    rows.push(['2. ITEM COUNT BY HARDWARE CATEGORY']);
    rows.push(['Category', 'Total Items', 'Deployed in Field', 'Available in IT Lab', 'Total Value (LKR)']);
    for (const c of categoryBreakdown) {
      rows.push([
        c.category,
        String(c.count),
        String(c.deployed),
        String(c.available),
        String(c.valueLKR),
      ]);
    }
    rows.push([]);

    // Summary Section 3: Branch / Location Counts
    rows.push(['3. ITEM COUNT BY BRANCH / LOCATION']);
    rows.push(['Branch / Location', 'Total Items', 'Total Value (LKR)']);
    for (const b of branchBreakdown) {
      rows.push([b.branch, String(b.count), String(b.valueLKR)]);
    }
    rows.push([]);

    // Summary Section 4: Department Counts
    rows.push(['4. ITEM COUNT BY DEPARTMENT']);
    rows.push(['Department', 'Total Items', 'Total Value (LKR)']);
    for (const d of departmentBreakdown) {
      rows.push([d.department, String(d.count), String(d.valueLKR)]);
    }
    rows.push([]);

    // Section 5: Complete Itemized Hardware Register
    rows.push(['5. COMPLETE ITEMIZED HARDWARE REGISTER (FULL ITEM DETAILS)']);
    rows.push([
      '#',
      'Asset Tag',
      'Device Name',
      'Category',
      'Brand',
      'Model Number',
      'Serial Number',
      'IMEI 1',
      'IMEI 2',
      'Item Condition',
      'Current Status',
      'Custodian / Person Name',
      'Designation of Person',
      'Department of Person',
      'Contact Number of Person',
      'Branch / Location',
      'Handover Date',
      'Expected Return Date',
      'Deployment Purpose / Notes',
      'Vendor / Purchase Location',
      'Purchase Date',
      'Warranty Expiry Date',
      'Purchase Value (LKR)',
    ]);

    filteredAssets.forEach((a, idx) => {
      const ca = a.currentAssignment;
      rows.push([
        String(idx + 1),
        a.assetTag,
        a.name,
        a.category,
        a.brand,
        a.modelNumber || '',
        a.serialNumber,
        a.imei1 || '',
        a.imei2 || '',
        ca?.conditionAtHandover || a.condition,
        formatStatusLabel(a.status),
        ca?.assignedToName || 'IT Central Lab (Unassigned)',
        ca?.assignedToRole || '',
        ca?.department || '',
        ca?.assignedToContact || '',
        ca?.locationOrBranch || 'IT Lab & Staging Area',
        ca?.assignedDate || '',
        ca?.expectedReturnDate || '',
        ca?.purpose || '',
        a.purchaseLocation || '',
        a.purchaseDate || 'Unrecorded',
        a.warrantyEndDate || 'Unknown',
        a.purchaseAmount > 0 ? String(a.purchaseAmount) : 'Unrecorded',
      ]);
    });

    const csvString = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `cosmetics-lk-full-audit-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Clean Data Table Only CSV (for Excel Pivot Tables / Filtering)
  const handleDownloadDataTableCsv = () => {
    const rows: string[][] = [];
    rows.push([
      'Asset Tag',
      'Device Name',
      'Category',
      'Brand',
      'Model Number',
      'Serial Number',
      'IMEI 1',
      'IMEI 2',
      'Condition',
      'Status',
      'Custodian Name',
      'Designation',
      'Department',
      'Contact Number',
      'Branch / Location',
      'Handover Date',
      'Expected Return Date',
      'Vendor',
      'Purchase Date',
      'Warranty Expiry Date',
      'Purchase Value (LKR)',
    ]);

    for (const a of filteredAssets) {
      const ca = a.currentAssignment;
      rows.push([
        a.assetTag,
        a.name,
        a.category,
        a.brand,
        a.modelNumber || '',
        a.serialNumber,
        a.imei1 || '',
        a.imei2 || '',
        ca?.conditionAtHandover || a.condition,
        formatStatusLabel(a.status),
        ca?.assignedToName || 'IT Central Lab',
        ca?.assignedToRole || '',
        ca?.department || '',
        ca?.assignedToContact || '',
        ca?.locationOrBranch || 'IT Lab & Staging Area',
        ca?.assignedDate || '',
        ca?.expectedReturnDate || '',
        a.purchaseLocation || '',
        a.purchaseDate || 'Unrecorded',
        a.warrantyEndDate || 'Unknown',
        a.purchaseAmount > 0 ? String(a.purchaseAmount) : '0',
      ]);
    }

    const csvString = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `cosmetics-lk-hardware-list-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <>
      {/* SCREEN MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200 print:hidden">
        <div
          className="relative w-full max-w-6xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Modal Header */}
          <div className="px-6 py-4 bg-[#fbf5ef] border-b border-[#f0e6de] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Manager&apos;s Full Fleet Audit Report &amp; Excel/CSV Export
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#c28551]/30">
                    {filteredAssets.length} Items in Report
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Complete item count breakdowns, custodian details, and printable / Excel export for management review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadFullAuditCsv}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Download Complete Manager Report with Summary Counts & All Item Details (.csv for Excel)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Full Excel / CSV Report</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDataTableCsv}
                className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Download Raw Itemized Table Only (.csv)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table Only (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold shadow-md shadow-[#c28551]/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF Audit Report</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Scope Bar */}
          <div className="px-6 py-3 bg-white border-b border-[#f0e6de] flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#c28551]" />
                <span>Report Scope:</span>
              </span>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer"
              >
                <option value="ALL">All Branches &amp; Showrooms</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer"
              >
                <option value="ALL">All Hardware Categories</option>
                {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 cursor-pointer"
              >
                <option value="ACTIVE_ONLY">Active Fleet (Exclude Retired)</option>
                <option value="ALL">Entire Fleet (Include Retired)</option>
                <option value="AVAILABLE">Available in IT Lab Only</option>
                <option value="ALLOCATED_PERMANENT">Allocated (Permanent) Only</option>
                <option value="BORROWED_TEMPORARY">Temporary Loans Only</option>
                <option value="UNDER_REPAIR">Under Repair Only</option>
                <option value="RETIRED">Retired / Scrapped Only</option>
              </select>

              {(branchFilter !== 'ALL' ||
                departmentFilter !== 'ALL' ||
                categoryFilter !== 'ALL' ||
                statusFilter !== 'ACTIVE_ONLY') && (
                <button
                  type="button"
                  onClick={() => {
                    setBranchFilter('ALL');
                    setDepartmentFilter('ALL');
                    setCategoryFilter('ALL');
                    setStatusFilter('ACTIVE_ONLY');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={reportTitleNote}
                onChange={(e) => setReportTitleNote(e.target.value)}
                placeholder="Optional audit note (e.g., Q4 Management Review)..."
                className="px-3 py-1.5 rounded-xl bg-[#fdfbf9] border border-[#f0e6de] text-xs text-slate-800 w-56"
              />
            </div>
          </div>

          {/* Scrollable Report Preview Body */}
          <div className="flex-1 bg-slate-100/80 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6 text-slate-800">
              {/* Report Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-slate-900">
                <div>
                  <div className="text-xl font-black tracking-wider text-[#c28551] uppercase">
                    COSMETICS.LK
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mt-0.5">
                    Executive IT Hardware Fleet &amp; Custody Audit Report
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Headquarters: Pepiliyana Head Office • IT Department Contact: 0776238098 • it-helpdesk@cosmetics.lk
                  </p>
                  {reportTitleNote && (
                    <div className="mt-2 inline-block px-2.5 py-1 rounded-md bg-[#fbf5ef] border border-[#ead7c7] text-xs font-bold text-[#844c1d]">
                      Audit Note: {reportTitleNote}
                    </div>
                  )}
                </div>

                <div className="sm:text-right text-xs space-y-1">
                  <span className="inline-block px-2.5 py-1 rounded-md font-mono font-bold bg-slate-900 text-white text-[11px]">
                    {reportId}
                  </span>
                  <div className="text-[11px] text-slate-500">Generated: {generatedTimestamp}</div>
                  <div className="text-[11px] font-semibold text-slate-700">
                    Scope: {branchFilter === 'ALL' ? 'All Branches' : branchFilter} •{' '}
                    {categoryFilter === 'ALL' ? 'All Categories' : categoryFilter}
                  </div>
                </div>
              </div>

              {/* 1. Executive Summary Count Cards */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#c28551]" />
                  <span>1. Complete Fleet Summary &amp; Status Counts</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#fbf5ef] border border-[#ead7c7]">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total Items</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {summaryStats.totalCount}
                    </div>
                    <div className="text-[10px] text-[#c28551] font-semibold">Hardware units</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">
                      Available (IT Lab)
                    </div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">
                      {summaryStats.availableCount}
                    </div>
                    <div className="text-[10px] text-emerald-600">Ready to deploy</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <div className="text-[10px] font-bold uppercase text-blue-800">
                      Allocated (Perm)
                    </div>
                    <div className="text-xl font-black text-blue-700 mt-0.5">
                      {summaryStats.allocatedCount}
                    </div>
                    <div className="text-[10px] text-blue-600">Staff &amp; Showrooms</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-amber-800">
                      Temporary Loans
                    </div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">
                      {summaryStats.borrowedCount}
                    </div>
                    <div className="text-[10px] text-amber-600">Short-term custody</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                    <div className="text-[10px] font-bold uppercase text-rose-800">
                      Under Repair
                    </div>
                    <div className="text-xl font-black text-rose-700 mt-0.5">
                      {summaryStats.repairCount}
                    </div>
                    <div className="text-[10px] text-rose-600">Service centers</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                    <div className="text-[10px] font-bold uppercase text-slate-300">
                      Total Fleet Value
                    </div>
                    <div className="text-sm font-black text-[#dfae85] mt-1 font-mono">
                      {formatLKR(summaryStats.totalValueLKR)}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {summaryStats.uniqueCustodians} active custodians
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Breakdown Tables: Category, Branch, Department */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Category Count Breakdown */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-[#c28551]" />
                      <span>Count by Category</span>
                    </span>
                    <span className="text-slate-500">{categoryBreakdown.length} Types</span>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="text-left py-1.5 px-3 font-semibold">Category</th>
                        <th className="text-center py-1.5 px-2 font-semibold">Qty</th>
                        <th className="text-right py-1.5 px-3 font-semibold">Value (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryBreakdown.map((c) => (
                        <tr key={c.category}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800">{c.category}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-[#c28551]">
                            {c.count}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                            {c.valueLKR > 0 ? formatLKR(c.valueLKR) : 'Unrecorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Branch Count Breakdown */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#c28551]" />
                      <span>Count by Branch / Location</span>
                    </span>
                    <span className="text-slate-500">{branchBreakdown.length} Locations</span>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="text-left py-1.5 px-3 font-semibold">Location</th>
                        <th className="text-center py-1.5 px-2 font-semibold">Qty</th>
                        <th className="text-right py-1.5 px-3 font-semibold">Value (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {branchBreakdown.map((b) => (
                        <tr key={b.branch}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800 truncate max-w-[150px]">
                            {b.branch}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-[#c28551]">
                            {b.count}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                            {b.valueLKR > 0 ? formatLKR(b.valueLKR) : 'Unrecorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Department Count Breakdown */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#c28551]" />
                      <span>Count by Department</span>
                    </span>
                    <span className="text-slate-500">{departmentBreakdown.length} Depts</span>
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="text-left py-1.5 px-3 font-semibold">Department</th>
                        <th className="text-center py-1.5 px-2 font-semibold">Qty</th>
                        <th className="text-right py-1.5 px-3 font-semibold">Value (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentBreakdown.map((d) => (
                        <tr key={d.department}>
                          <td className="py-1.5 px-3 font-semibold text-slate-800 truncate max-w-[150px]">
                            {d.department}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-[#c28551]">
                            {d.count}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                            {d.valueLKR > 0 ? formatLKR(d.valueLKR) : 'Unrecorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Complete Itemized Hardware Register Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#c28551]" />
                    <span>
                      2. Complete Itemized Hardware Register ({filteredAssets.length} Items)
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Includes Serial, Condition, Custodian Name, Designation, Department, Contact &amp; Valuation
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-2.5 text-left">#</th>
                        <th className="py-2.5 px-2.5 text-left">Asset Tag</th>
                        <th className="py-2.5 px-2.5 text-left">Hardware Item &amp; Category</th>
                        <th className="py-2.5 px-2.5 text-left">Serial / IMEI</th>
                        <th className="py-2.5 px-2.5 text-left">Condition &amp; Status</th>
                        <th className="py-2.5 px-2.5 text-left">Custodian, Designation &amp; Dept</th>
                        <th className="py-2.5 px-2.5 text-left">Contact &amp; Location</th>
                        <th className="py-2.5 px-2.5 text-right">Value (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredAssets.map((a, idx) => {
                        const ca = a.currentAssignment;
                        const itemCondition = ca?.conditionAtHandover || a.condition;
                        return (
                          <tr key={a.id} className="hover:bg-slate-50/80">
                            <td className="py-2 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-2.5 font-mono font-bold text-[#c28551] whitespace-nowrap">
                              {a.assetTag}
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-bold text-slate-900">{a.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {a.category} • {a.brand} {a.modelNumber}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 font-mono text-[10.5px] text-slate-700">
                              <div>SN: {a.serialNumber}</div>
                              {a.hasSim && a.imei1 && (
                                <div className="text-[10px] text-slate-500">IMEI: {a.imei1}</div>
                              )}
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-semibold text-slate-800">{itemCondition}</div>
                              <div className="text-[10px] text-slate-500">
                                {formatStatusLabel(a.status)}
                              </div>
                            </td>
                            <td className="py-2 px-2.5">
                              {ca ? (
                                <>
                                  <div className="font-bold text-slate-900">
                                    {ca.assignedToName}
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    {ca.assignedToRole || 'Staff'} • {ca.department || 'General'}
                                  </div>
                                </>
                              ) : (
                                <span className="text-emerald-700 font-semibold">
                                  Central IT Lab Stock
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5">
                              {ca ? (
                                <>
                                  <div className="font-mono text-[10.5px] font-semibold text-slate-800">
                                    {ca.assignedToContact || 'N/A'}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {ca.locationOrBranch}
                                  </div>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  Pepiliyana HQ / IT Lab
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {a.purchaseAmount > 0 ? formatLKR(a.purchaseAmount) : 'Unrecorded'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900">
                      <tr>
                        <td colSpan={7} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider">
                          Total Recorded Hardware Valuation ({filteredAssets.length} Items):
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono text-xs text-[#c28551]">
                          {formatLKR(summaryStats.totalValueLKR)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 4. Official Management Audit Sign-Off Block */}
              <div className="pt-8 mt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Prepared By (IT Department):
                  </div>
                  <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1 text-slate-500 italic">
                    IT Asset Administrator
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Signature &amp; Date: {formatDate(new Date().toISOString().slice(0, 10))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verified By (Operations / Dept Manager):
                  </div>
                  <div className="h-12 border-b border-dashed border-slate-300" />
                  <div className="text-[11px] text-slate-600 mt-1">
                    Manager Signature &amp; Date
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Approved By (Director / Finance Audit):
                  </div>
                  <div className="h-12 border-b border-dashed border-slate-300" />
                  <div className="text-[11px] text-slate-600 mt-1">
                    Official Stamp &amp; Date
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINTABLE A4 AUDIT REPORT (Visible ONLY when window.print() is triggered) */}
      <div className="hidden print:block print-area">
        <div
          style={{
            width: '190mm',
            margin: '0 auto',
            padding: '4mm',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#111',
            background: 'white',
            fontSize: '10px',
          }}
        >
          {/* Print Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2.5px solid #000',
              paddingBottom: '10px',
              marginBottom: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.05em' }}>
                COSMETICS.LK
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: '2px',
                }}
              >
                OFFICIAL IT HARDWARE FLEET &amp; CUSTODY AUDIT REPORT
              </div>
              <div style={{ fontSize: '9.5px', color: '#444', marginTop: '3px' }}>
                Headquarters: Pepiliyana Head Office • IT Dept Contact: 0776238098 • it-helpdesk@cosmetics.lk
              </div>
              {reportTitleNote && (
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
                  Audit Note: {reportTitleNote}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  border: '1.5px solid #000',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {reportId}
              </div>
              <div style={{ fontSize: '9.5px', marginTop: '4px', color: '#444' }}>
                Generated: {generatedTimestamp}
              </div>
              <div style={{ fontSize: '9.5px', fontWeight: 'bold', marginTop: '2px' }}>
                Total Items: {summaryStats.totalCount} | Value: {formatLKR(summaryStats.totalValueLKR)}
              </div>
            </div>
          </div>

          {/* Print Summary Counts Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              marginBottom: '14px',
            }}
          >
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#555' }}>
                Total Items
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>{summaryStats.totalCount}</div>
            </div>
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#555' }}>
                Available (IT Lab)
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>
                {summaryStats.availableCount}
              </div>
            </div>
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#555' }}>
                Allocated (Perm)
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>
                {summaryStats.allocatedCount}
              </div>
            </div>
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#555' }}>
                Temp Loans
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>
                {summaryStats.borrowedCount}
              </div>
            </div>
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '6px 8px' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#555' }}>
                Under Repair
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900' }}>{summaryStats.repairCount}</div>
            </div>
            <div style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '6px 8px', background: '#f5f5f5' }}>
              <div style={{ fontSize: '8.5px', textTransform: 'uppercase', color: '#333' }}>
                Total Fleet Value
              </div>
              <div style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'monospace' }}>
                {formatLKR(summaryStats.totalValueLKR)}
              </div>
            </div>
          </div>

          {/* Print Count Breakdown Tables (Category & Branch) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '8px' }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '9.5px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '4px',
                  marginBottom: '6px',
                }}
              >
                Item Count by Category
              </div>
              <table style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '2px 0' }}>Category</th>
                    <th style={{ padding: '2px 4px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '2px 0', textAlign: 'right' }}>Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((c) => (
                    <tr key={c.category} style={{ borderBottom: '1px dotted #eee' }}>
                      <td style={{ padding: '2px 0', fontWeight: 600 }}>{c.category}</td>
                      <td style={{ padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {c.count}
                      </td>
                      <td style={{ padding: '2px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                        {c.valueLKR > 0 ? formatLKR(c.valueLKR) : 'Unrecorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ border: '1px solid #333', borderRadius: '4px', padding: '8px' }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '9.5px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '4px',
                  marginBottom: '6px',
                }}
              >
                Item Count by Branch / Location
              </div>
              <table style={{ width: '100%', fontSize: '9.5px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '2px 0' }}>Branch / Location</th>
                    <th style={{ padding: '2px 4px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '2px 0', textAlign: 'right' }}>Valuation</th>
                  </tr>
                </thead>
                <tbody>
                  {branchBreakdown.map((b) => (
                    <tr key={b.branch} style={{ borderBottom: '1px dotted #eee' }}>
                      <td style={{ padding: '2px 0', fontWeight: 600 }}>{b.branch}</td>
                      <td style={{ padding: '2px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                        {b.count}
                      </td>
                      <td style={{ padding: '2px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                        {b.valueLKR > 0 ? formatLKR(b.valueLKR) : 'Unrecorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Print Complete Itemized Hardware Table */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '10px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Complete Itemized Hardware Register ({filteredAssets.length} Units)
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9px',
                border: '1px solid #000',
              }}
            >
              <thead>
                <tr style={{ background: '#eee', borderBottom: '1.5px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>#</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Tag</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Item &amp; Category</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Serial / IMEI</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Condition / Status</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Custodian, Role &amp; Dept</th>
                  <th style={{ padding: '4px', borderRight: '1px solid #ccc' }}>Contact &amp; Location</th>
                  <th style={{ padding: '4px', textAlign: 'right' }}>Value (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((a, idx) => {
                  const ca = a.currentAssignment;
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: '4px', borderRight: '1px solid #ccc' }}>{idx + 1}</td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid #ccc',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                        }}
                      >
                        {a.assetTag}
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #ccc' }}>
                        <div style={{ fontWeight: 'bold' }}>{a.name}</div>
                        <div style={{ fontSize: '8px', color: '#444' }}>
                          {a.category} • {a.brand}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          borderRight: '1px solid #ccc',
                          fontFamily: 'monospace',
                        }}
                      >
                        <div>{a.serialNumber}</div>
                        {a.hasSim && a.imei1 && (
                          <div style={{ fontSize: '8px' }}>IMEI: {a.imei1}</div>
                        )}
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #ccc' }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {ca?.conditionAtHandover || a.condition}
                        </div>
                        <div style={{ fontSize: '8px', color: '#444' }}>
                          {formatStatusLabel(a.status)}
                        </div>
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #ccc' }}>
                        {ca ? (
                          <>
                            <div style={{ fontWeight: 'bold' }}>{ca.assignedToName}</div>
                            <div style={{ fontSize: '8px', color: '#444' }}>
                              {ca.assignedToRole || 'Staff'} • {ca.department || 'General'}
                            </div>
                          </>
                        ) : (
                          <span>Central IT Lab Stock</span>
                        )}
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #ccc' }}>
                        {ca ? (
                          <>
                            <div style={{ fontFamily: 'monospace' }}>
                              {ca.assignedToContact || 'N/A'}
                            </div>
                            <div style={{ fontSize: '8px', color: '#444' }}>
                              {ca.locationOrBranch}
                            </div>
                          </>
                        ) : (
                          <span>Pepiliyana HQ / IT Lab</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '4px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                        }}
                      >
                        {a.purchaseAmount > 0 ? formatLKR(a.purchaseAmount) : 'Unrecorded'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f5f5f5', borderTop: '1.5px solid #000', fontWeight: 'bold' }}>
                  <td colSpan={7} style={{ padding: '5px', textAlign: 'right' }}>
                    TOTAL RECORDED FLEET VALUATION ({filteredAssets.length} ITEMS):
                  </td>
                  <td style={{ padding: '5px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatLKR(summaryStats.totalValueLKR)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Print Signatures */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '24px',
              marginTop: '24px',
              paddingTop: '14px',
              borderTop: '2px solid #000',
              fontSize: '9.5px',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '32px' }}>
                Prepared By (IT Department):
              </div>
              <div style={{ borderTop: '1px dashed #444', paddingTop: '4px' }}>
                IT Asset Administrator Signature &amp; Date
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '32px' }}>
                Verified By (Department / Ops Manager):
              </div>
              <div style={{ borderTop: '1px dashed #444', paddingTop: '4px' }}>
                Manager Signature &amp; Date
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '32px' }}>
                Approved By (Management / Finance):
              </div>
              <div style={{ borderTop: '1px dashed #444', paddingTop: '4px' }}>
                Authorized Signature, Stamp &amp; Date
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
