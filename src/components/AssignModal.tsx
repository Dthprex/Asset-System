'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Building2, 
  Users, 
  UserCheck, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Asset, AssignmentType, Branch, Department } from '@/types/asset';

interface AssignModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Asset) => void;
  branches: Branch[];
  departments: Department[];
}

export const AssignModal: React.FC<AssignModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSuccess,
  branches,
  departments,
}) => {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('PERMANENT_EMPLOYEE');
  const [assignedToName, setAssignedToName] = useState('');
  const [assignedToRole, setAssignedToRole] = useState('');
  const [assignedToContact, setAssignedToContact] = useState('');
  const [locationOrBranch, setLocationOrBranch] = useState(branches[0]?.name || 'Head Office - Nawala (HQ)');
  const [department, setDepartment] = useState(departments[0]?.name || 'Digital Marketing & Content Creation');
  const [assignedDate, setAssignedDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (!assignedDate) {
        setAssignedDate(new Date().toISOString().slice(0, 10));
      }
      if (!expectedReturnDate) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setExpectedReturnDate(nextWeek.toISOString().slice(0, 10));
      }
    }
  }, [isOpen, assignedDate, expectedReturnDate]);

  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset) return null;

  const isTemporaryBorrow = assignmentType === 'TEMPORARY_BORROW';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!assignedToName.trim()) {
      setError('Please specify who or which counter will receive this item');
      return;
    }

    if (isTemporaryBorrow && !expectedReturnDate) {
      setError('Please provide an Expected Return Date for temporary loans');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/assets/${asset.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentType,
          assignedToName: assignedToName.trim(),
          assignedToRole,
          assignedToContact,
          locationOrBranch,
          department,
          assignedDate,
          expectedReturnDate: isTemporaryBorrow ? expectedReturnDate : '',
          purpose,
          notes,
          performedBy: 'IT Asset Admin',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign asset');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fbf5ef] border border-[#c28551]/30 flex items-center justify-center text-[#c28551]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Deploy / Assign Hardware</h2>
              <p className="text-xs text-slate-500">
                {asset.name} • <span className="font-mono text-[#c28551] font-semibold">{asset.assetTag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Deployment Mode Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Deployment Mode:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              
              <button
                type="button"
                onClick={() => setAssignmentType('LOCATION_SHOWROOM')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  assignmentType === 'LOCATION_SHOWROOM'
                    ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Showroom Branch</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Permanent retail POS / tablet stand</div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('DEPARTMENT_SHARED')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  assignmentType === 'DEPARTMENT_SHARED'
                    ? 'bg-purple-50/80 border-purple-400 text-purple-900 shadow-xs ring-1 ring-purple-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Department Shared</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Team gear (Marketing, Video, Accounts)</div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('PERMANENT_EMPLOYEE')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  assignmentType === 'PERMANENT_EMPLOYEE'
                    ? 'bg-[#fbf5ef] border-[#c28551] text-[#844c1d] shadow-xs ring-1 ring-[#c28551]/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <UserCheck className="w-4 h-4 text-[#c28551]" />
                  <span>Individual Employee</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Primary work laptop / phone</div>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('TEMPORARY_BORROW')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  assignmentType === 'TEMPORARY_BORROW'
                    ? 'bg-amber-50/80 border-amber-400 text-amber-900 shadow-xs ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Temporary Loan</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Scheduled return date required</div>
              </button>

            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Location <span className="text-[#c28551]">*</span>
              </label>
              <select
                value={locationOrBranch}
                onChange={(e) => setLocationOrBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custodian Name <span className="text-[#c28551]">*</span>
              </label>
              <input
                type="text"
                required
                value={assignedToName}
                onChange={(e) => setAssignedToName(e.target.value)}
                placeholder="e.g. Kaveen Dias, POS Counter 2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation / Role
              </label>
              <input
                type="text"
                value={assignedToRole}
                onChange={(e) => setAssignedToRole(e.target.value)}
                placeholder="e.g. Lead Video Producer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone / Email
              </label>
              <input
                type="text"
                value={assignedToContact}
                onChange={(e) => setAssignedToContact(e.target.value)}
                placeholder="077 123 4567 • name@cosmetics.lk"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Handover Date
              </label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
              />
            </div>

            {/* Temporary Borrow Due Date */}
            {isTemporaryBorrow && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Scheduled Return Due Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold"
                />
              </div>
            )}

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deployment Purpose & Handover Notes
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Handed over with charger brick, braided cable, and laptop case."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-[#c28551]/20 focus:border-[#c28551] focus:bg-white transition"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#c28551] hover:bg-[#a66c3b] text-white text-xs font-semibold shadow-md shadow-[#c28551]/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Handover & Log Timeline</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
