'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Layers,
  Plus,
  Trash2,
  Laptop,
  Users,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Asset, Department } from '@/types/asset';
import { formatLKR } from '@/lib/utils';

interface ManageDepartmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  assets: Asset[];
  onRefresh: () => Promise<void>;
  onShowToast?: (msg: string) => void;
  onOpenDeptAudit?: (deptName: string) => void;
}

export const ManageDepartmentsModal: React.FC<ManageDepartmentsModalProps> = ({
  isOpen,
  onClose,
  departments,
  assets,
  onRefresh,
  onShowToast,
  onOpenDeptAudit,
}) => {
  const [newDeptName, setNewDeptName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deptStats = useMemo(() => {
    return departments.map((d) => {
      const deptAssets = assets.filter(
        (a) =>
          a.status !== 'RETIRED' &&
          a.currentAssignment?.department?.trim().toLowerCase() === d.name.trim().toLowerCase()
      );
      const custodianCount = new Set(
        deptAssets
          .filter((a) => a.currentAssignment?.assignedToName)
          .map((a) => a.currentAssignment!.assignedToName.trim().toLowerCase())
      ).size;
      const totalValueLKR = deptAssets.reduce(
        (sum, a) => sum + (Number(a.purchaseAmount) || 0),
        0
      );

      return {
        ...d,
        assetCount: deptAssets.length,
        custodianCount,
        totalValueLKR,
      };
    });
  }, [departments, assets]);

  if (!isOpen) return null;

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = newDeptName.trim();
    if (!trimmed) {
      setError('Please enter a department name');
      return;
    }

    if (departments.some((d) => d.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" already exists in the department list`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add department');
      }

      setNewDeptName('');
      await onRefresh();
      if (onShowToast) {
        onShowToast(`Added department: ${trimmed}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (dept: {
    id: string;
    name: string;
    assetCount: number;
  }) => {
    if (dept.assetCount > 0) {
      setError(
        `Cannot delete "${dept.name}" while ${dept.assetCount} active hardware item(s) are assigned to it. Reassign or return those items first.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Remove "${dept.name}" from the company departments directory?`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(dept.id);
    try {
      const res = await fetch(`/api/departments?id=${encodeURIComponent(dept.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete department');
      }

      await onRefresh();
      if (onShowToast) {
        onShowToast(`Removed department: ${dept.name}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete department');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef]/90 border-b border-[#f0e6de] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#c28551]/30 flex items-center justify-center text-[#c28551] shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Manage Company Departments
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faece2] text-[#c28551] border border-[#c28551]/30">
                  {departments.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Add or remove organizational departments for staff handovers, intake &amp; audit reports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add New Department Form */}
        <div className="p-5 bg-[#faf7f3] border-b border-[#f0e6de]">
          <form onSubmit={handleAddDepartment} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => {
                setNewDeptName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter new department name (e.g. Brand Partnerships & PR, Procurement, Visual Merchandising)..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#e5d5c5] text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c28551]/25 focus:border-[#c28551]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Adding...' : 'Add Department'}</span>
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Departments List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
          {deptStats.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No departments configured yet. Add one above!
            </div>
          ) : (
            deptStats.map((dept) => (
              <div
                key={dept.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {dept.id}
                    </span>
                    <span className="text-xs font-bold text-[#1d2939] truncate">
                      {dept.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#c28551]">
                      <Laptop className="w-3.5 h-3.5" />
                      {dept.assetCount} {dept.assetCount === 1 ? 'Device' : 'Devices'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {dept.custodianCount} {dept.custodianCount === 1 ? 'Custodian' : 'Custodians'}
                    </span>
                    {dept.totalValueLKR > 0 && (
                      <span className="font-mono text-slate-700 font-semibold">
                        • {formatLKR(dept.totalValueLKR)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenDeptAudit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeptAudit(dept.name);
                      }}
                      title={`Open Audit Report filtered to ${dept.name}`}
                      className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Audit</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteDepartment(dept)}
                    disabled={deletingId === dept.id}
                    title={
                      dept.assetCount > 0
                        ? `Cannot delete while ${dept.assetCount} hardware item(s) are assigned`
                        : `Delete ${dept.name}`
                    }
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                      dept.assetCount > 0
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-70'
                        : 'border-rose-200 bg-white hover:bg-rose-50 text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === dept.id ? 'Removing...' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf7f3] border-t border-[#f0e6de] flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Synced to Supabase Cloud &amp; Handover Dropdowns</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1d2939] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
