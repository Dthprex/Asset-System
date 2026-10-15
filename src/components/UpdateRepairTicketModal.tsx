'use client';

import React, { useState } from 'react';
import {
  X,
  Wrench,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { RepairTicket, RepairTicketStatus } from '@/types/asset';
import { formatLKR, formatDate } from '@/lib/utils';

interface UpdateRepairTicketModalProps {
  ticket: RepairTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: RepairTicket) => void;
}

const STATUS_OPTIONS: { label: string; value: RepairTicketStatus; desc: string }[] = [
  {
    value: 'DISPATCHED_TO_VENDOR',
    label: 'Dispatched to Vendor',
    desc: 'Item delivered to vendor service center / waiting in intake queue',
  },
  {
    value: 'UNDER_DIAGNOSTICS',
    label: 'Under Diagnostics',
    desc: 'Technicians are testing circuits, logic board, and reporting faults',
  },
  {
    value: 'AWAITING_PARTS',
    label: 'Awaiting Spare Parts',
    desc: 'Components ordered from Singapore/overseas distributor',
  },
  {
    value: 'REPAIR_COMPLETED',
    label: 'Repair Completed',
    desc: 'Hardware fixed and ready for IT pickup from service center',
  },
  {
    value: 'RETURNED_TO_FLEET',
    label: 'Re-integrate to Fleet (Available)',
    desc: 'Sanitized, tested, and returned to Central Inventory as Available',
  },
];

export const UpdateRepairTicketModal: React.FC<UpdateRepairTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState<RepairTicketStatus>(ticket?.status || 'DISPATCHED_TO_VENDOR');
  const [actualCostLKR, setActualCostLKR] = useState<number | ''>(ticket?.actualCostLKR || 0);
  const [notes, setNotes] = useState(ticket?.notes || '');
  const [completedDate, setCompletedDate] = useState(
    ticket?.completedDate || new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/repairs/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          actualCostLKR: Number(actualCostLKR) || 0,
          notes,
          completedDate: status === 'RETURNED_TO_FLEET' || status === 'REPAIR_COMPLETED' ? completedDate : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update repair ticket.');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving repair ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white border border-[#f0e6de] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-[#fbf5ef] border-b border-[#f0e6de] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#c28551] text-white flex items-center justify-center shadow-md shadow-[#c28551]/20">
              <RotateCcw className="w-6 h-6 text-[#faece2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#faece2] text-[#c28551] border border-[#ead7c7]">
                  {ticket.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">• RMA #{ticket.rmaNumber}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Update RMA Service Status
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer btn-press-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Summary Card */}
          <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#f0e6de] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{ticket.assetName}</span>
              <span className="font-mono text-xs font-bold text-[#c28551]">{ticket.assetTag}</span>
            </div>
            <p className="text-slate-600 text-xs">
              <span className="font-semibold text-slate-800">Vendor:</span> {ticket.vendorName} ({ticket.serviceCenterLocation})
            </p>
            <p className="text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700">Issue:</span> {ticket.issueDescription}
            </p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Update Repair Lifecycle Stage
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    status === opt.value
                      ? opt.value === 'RETURNED_TO_FLEET'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-[#fbf5ef] border-[#c28551] text-[#713f12] shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="ticketStatus"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="mt-0.5 text-[#c28551] focus:ring-[#c28551]"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>{opt.label}</span>
                      {opt.value === 'RETURNED_TO_FLEET' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-600 text-white font-bold uppercase tracking-wide">
                          Reintegrates Asset
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actual Cost & Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Final Actual Cost (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-[10px]">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={actualCostLKR}
                  onChange={(e) => setActualCostLKR(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {formatLKR(Number(actualCostLKR) || 0)} (Est: {formatLKR(ticket.estimatedCostLKR)})
              </span>
            </div>

            {(status === 'RETURNED_TO_FLEET' || status === 'REPAIR_COMPLETED') && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Re-integration Date
                </label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#c28551]/30"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Technician Findings / Work Carried Out Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Keyboard assembly replaced, fan cleaned, memory passed diagnostic loop."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#c28551]/30 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition cursor-pointer btn-press-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl font-bold shadow-md transition cursor-pointer btn-press disabled:opacity-50 text-white flex items-center gap-2 ${
                status === 'RETURNED_TO_FLEET'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-[#c28551] to-[#dfae85] hover:from-[#b07440] hover:to-[#cb8e5c] shadow-[#c28551]/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving Updates...' : status === 'RETURNED_TO_FLEET' ? 'Re-integrate to Fleet' : 'Save Status Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
