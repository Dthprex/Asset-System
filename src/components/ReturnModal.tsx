'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  User, 
  Check, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { Asset, AssetCondition } from '@/types/asset';
import { calculateDuration, formatDate } from '@/lib/utils';

interface ReturnModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Asset) => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  asset,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    if (isOpen && !returnDate) {
      setReturnDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, returnDate]);
  const [conditionUponReturn, setConditionUponReturn] = useState<AssetCondition>('Used - Good');
  const [damages, setDamages] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('IT Asset Admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !asset || !asset.currentAssignment) return null;

  const currentHolder = asset.currentAssignment.assignedToName;
  const currentBranch = asset.currentAssignment.locationOrBranch;
  const assignedDate = asset.currentAssignment.assignedDate;
  const custodyDuration = calculateDuration(assignedDate, returnDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/assets/${asset.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnDate,
          conditionUponReturn,
          damages: damages.trim(),
          notes: notes.trim(),
          performedBy,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process asset return');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during return check-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Return Check-in & Damage Inspection</h2>
              <p className="text-xs text-slate-400">
                {asset.name} • <span className="font-mono text-pink-300">{asset.assetTag}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Custody Summary Banner */}
        <div className="m-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Currently Returning From</span>
            <div className="text-sm font-bold text-white mt-0.5">{currentHolder}</div>
            <div className="text-xs text-slate-400">{currentBranch}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-indigo-400/80">TOTAL CUSTODY DURATION</div>
              <div className="font-semibold text-white">{custodyDuration}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Return Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Return Date (Asia/Colombo) <span className="text-pink-400">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Physical Condition Upon Return <span className="text-pink-400">*</span>
              </label>
              <select
                value={conditionUponReturn}
                onChange={(e) => setConditionUponReturn(e.target.value as AssetCondition)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              >
                <option value="Used - Like New">Used - Like New (Mint Condition)</option>
                <option value="Used - Good">Used - Good (Normal Cosmetic Wear)</option>
                <option value="Used - Fair">Used - Fair (Visible Scratches / Signs of Use)</option>
                <option value="Damaged / Needs Repair">Damaged / Needs Repair (Defects Found)</option>
                <option value="Scrapped / Retired">Unrepairable / Total Loss</option>
              </select>
            </div>
          </div>

          {/* Damage Assessment Field */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Inspection of Damages, Missing Accessories, or Hardware Issues:</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Note any dents, screen scratches, liquid ingress, sticky keyboard keys, battery degradation, or missing cables/chargers upon return.
            </p>
            <textarea
              rows={3}
              value={damages}
              onChange={(e) => setDamages(e.target.value)}
              placeholder="e.g. Hairline scratch on corner bezel, screen is 100% fine. 67W power adapter returned without braided cable."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-rose-500/40 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sanitization & Inventory Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Device wiped, sanitized with isopropyl alcohol, verified working."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Inspecting IT Officer
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold shadow-lg shadow-rose-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <span>Recording Return...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Return to Inventory</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
